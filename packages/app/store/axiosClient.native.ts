import axios, { AxiosError } from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'
import Constants from 'expo-constants'
import { ApiResponse } from 'app/types/Response'

function normalizeApiUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL
  if (envUrl) return normalizeApiUrl(envUrl)

  const extraUrl = (Constants.expoConfig as any)?.extra?.apiUrl as string | undefined
  if (extraUrl) return normalizeApiUrl(extraUrl)

  const portFromEnv = process.env.EXPO_PUBLIC_API_PORT
  const portFromExtra = (Constants.expoConfig as any)?.extra?.apiPort
  const apiPort = String(portFromEnv || portFromExtra || '8081')

  const hostUri = Constants.expoConfig?.hostUri
  const host = hostUri?.split(':')[0]
  return host ? `http://${host}:${apiPort}/api` : `http://localhost:${apiPort}/api`
}

let clientInstance: any = null

export const getAxiosClient = async () => {
  if (clientInstance) return clientInstance

  const client = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: false,
  })

  client.interceptors.request.use(
    async (config) => {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json'
        } else {
          delete config.headers['Content-Type']
        }
      } catch (e) {
        console.log('Chưa đăng nhập')
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.log('Token hết hạn, user cần đăng nhập lại')
      }
      return Promise.reject(error)
    }
  )

  client.interceptors.response.use(
    (response) => {
      // Lấy data gốc từ server
      const data = response.data as ApiResponse

      // Kiểm tra xem có đúng format Spring Boot không (có field code và result)
      if (data && typeof data.code === 'number') {
        if (data.code === 1000) {
          response.data = data.result
          return response
        }

        return Promise.reject({
          response: response,
          message: data.message || 'Lỗi nghiệp vụ không xác định',
          code: data.code, // Lưu lại mã lỗi để hiển thị nếu cần
        })
      }

      return response
    },
    (error: AxiosError) => {
      return Promise.reject(error)
    }
  )

  clientInstance = client
  return client
}
