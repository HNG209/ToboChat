import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

// 1. Cấu hình URL cho Mobile
const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri
  const localhost = debuggerHost?.split(':')[0]
  return localhost ? `http://${localhost}:8080` : 'https://api-prod.com'
}

const COOKIE_STORE_KEY = 'persistent_cookie_jar'
let clientInstance: any = null

export const getAxiosClient = async () => {
  if (clientInstance) return clientInstance

  const client = axios.create({
    baseURL: getBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  })

  // === LOGIC THỦ CÔNG: TỰ QUẢN LÝ COOKIE ===
  let jar = new CookieJar()
  try {
    const storedCookies = await SecureStore.getItemAsync(COOKIE_STORE_KEY)
    if (storedCookies) {
      // Khôi phục hũ cookie cũ từ ổ cứng
      jar = CookieJar.deserializeSync(JSON.parse(storedCookies))
    }
  } catch (e) {
    console.log('Tạo hũ cookie mới.')
  }

  // --- INTERCEPTOR 1: GỬI ĐI (REQUEST) ---
  // Trước khi gửi request, tự lấy cookie trong hũ gắn vào header
  client.interceptors.request.use(async (config) => {
    // Lấy URL đầy đủ để tough-cookie biết chọn cookie nào (đúng domain/path)
    const url = config.url?.startsWith('http') ? config.url : `${config.baseURL}${config.url}`

    try {
      // Lấy cookie dạng chuỗi: "name=value; name2=value2"
      const cookieString = await jar.getCookieString(url || '')
      if (cookieString) {
        config.headers.Cookie = cookieString
      }
    } catch (e) {
      console.error('Lỗi gắn cookie:', e)
    }
    return config
  })

  // --- INTERCEPTOR 2: NHẬN VỀ (RESPONSE) & REFRESH TOKEN ---
  client.interceptors.response.use(
    async (response) => {
      // 1. Nếu server trả cookie, lưu ngay vào hũ
      await processResponseCookies(response, jar)
      return response
    },
    async (error) => {
      const originalRequest = error.config
      const errorCode = error.response.data.code || error.response?.status

      // 2. Kể cả lỗi (401, 400...), server vẫn có thể gửi cookie mới, cần lưu lại
      if (error.response) {
        await processResponseCookies(error.response, jar)
      }

      // 3. Logic Refresh Token tự động
      if (errorCode === 3005 && !originalRequest._retry) {
        originalRequest._retry = true
        try {
          console.log('Token hết hạn, đang refresh...')
          // Gọi API refresh (Cookie refreshToken sẽ tự được interceptor 1 gửi đi)
          await client.post('/auth/refresh')

          // Refresh thành công -> Gọi lại request cũ
          return client(originalRequest)
        } catch (refreshError) {
          return Promise.reject(refreshError)
        }
      }
      return Promise.reject(error)
    }
  )

  clientInstance = client
  return client
}

// === HÀM PHỤ TRỢ: BÓC TÁCH & LƯU COOKIE ===
const processResponseCookies = async (response: any, jar: CookieJar) => {
  // Lấy header Set-Cookie (Axios có thể trả về mảng hoặc chuỗi, chữ hoa hoặc thường)
  let setCookie = response.headers['set-cookie'] || response.headers['Set-Cookie']

  if (!setCookie) return

  // Chuẩn hóa thành mảng
  if (typeof setCookie === 'string') {
    setCookie = [setCookie]
  }

  // Xác định URL để lưu cookie đúng chỗ
  const url = response.config.url?.startsWith('http')
    ? response.config.url
    : `${response.config.baseURL}${response.config.url}`

  // Lưu từng cookie vào RAM (Jar)
  for (const cookie of setCookie) {
    try {
      // setCookieSync giúp xử lý nhanh gọn
      // Nếu tough-cookie v5 bỏ setCookieSync, bạn đổi thành 'await jar.setCookie(...)'
      if (jar.setCookieSync) {
        jar.setCookieSync(cookie, url || '')
      } else {
        await jar.setCookie(cookie, url || '')
      }
    } catch (e) {
      console.error('Lỗi parse cookie:', e)
    }
  }

  // Lưu Hũ Cookie từ RAM xuống Ổ cứng (SecureStore)
  await saveJarToDisk(jar)
}

const saveJarToDisk = async (jar: CookieJar) => {
  try {
    const serialized = JSON.stringify(jar.toJSON())
    await SecureStore.setItemAsync(COOKIE_STORE_KEY, serialized)
  } catch (e) {
    console.error('Lỗi lưu cookie xuống đĩa:', e)
  }
}
