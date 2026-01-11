import axios from 'axios'
import { Platform } from 'react-native'
// import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
// import * as SecureStore from 'expo-secure-store'
// import Constants from 'expo-constants'

const getBaseUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000'
  // const debuggerHost = Constants.expoConfig?.hostUri
  // const localhost = debuggerHost?.split(':')[0]
  // Lưu ý: Đảm bảo port backend của bạn đúng (8080 hoặc 3000)
  // return localhost ? `http://${localhost}:8080` : 'https://api-prod.com'
  return 'https://api-prod.com'
}

const COOKIE_STORE_KEY = 'persistent_cookie_jar'
let clientInstance: any = null

export const getAxiosClient = async () => {
  if (clientInstance) return clientInstance

  const client = axios.create({
    baseURL: getBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // Bắt buộc cho Web
  })

  // Mobile: Thiết lập Cookie Jar để lưu cookie giữa các phiên
  if (Platform.OS !== 'web') {
    let jar = new CookieJar()

    try {
      // const storedCookies = await SecureStore.getItemAsync(COOKIE_STORE_KEY)
      // if (storedCookies) {
      //   jar = CookieJar.deserializeSync(JSON.parse(storedCookies))
      // }
    } catch (e) {
      console.log('Tạo cookie jar mới do lỗi đọc cũ:', e)
    }

    // wrapper(client)
    // @ts-ignore
    client.defaults.jar = jar

    // Interceptor 1: Tự động lưu Cookie khi Server trả về
    client.interceptors.response.use(
      async (response) => {
        await saveJarToDisk(jar)
        return response
      },
      async (error) => {
        await saveJarToDisk(jar)
        return Promise.reject(error)
      }
    )
  }

  // Interceptor 2: Logic này chạy cho cả Web và Mobile
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // Nếu lỗi 401 (Unauthorized) và chưa từng thử lại
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true // Đánh dấu đã retry

        try {
          console.log('Token hết hạn, đang gọi refresh...')
          // Gọi API Refresh (Không cần truyền data, Cookie tự lo)
          await client.post('/auth/refresh')

          // Refresh thành công -> Gọi lại request cũ
          return client(originalRequest)
        } catch (refreshError) {
          console.log('Refresh thất bại -> Logout')
          return Promise.reject(refreshError)
        }
      }
      return Promise.reject(error)
    }
  )

  clientInstance = client
  return client
}

const saveJarToDisk = async (jar: CookieJar) => {
  if (Platform.OS === 'web') return
  try {
    const serialized = JSON.stringify(jar.toJSON())
    // await SecureStore.setItemAsync(COOKIE_STORE_KEY, serialized)
  } catch (e) {
    console.error('Lỗi lưu cookie:', e)
  }
}
