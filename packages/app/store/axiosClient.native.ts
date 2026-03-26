import axios, { AxiosError } from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'
import Constants from 'expo-constants'
import { ApiResponse } from 'app/types/Response'

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
  }

  const debuggerHost = Constants.expoConfig?.hostUri
  const localhost = debuggerHost?.split(':')[0]
  return localhost ? `http://${localhost}:8081/api` : 'http://localhost:8081/api'
}

let clientInstance: any = null

export const getAxiosClient = async () => {
  if (clientInstance) return clientInstance

  const client = axios.create({
    baseURL: getBaseUrl(),
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
