import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'
}

let clientInstance: any = null

export const getAxiosClient = async () => {
  if (clientInstance) return clientInstance

  const client = axios.create({
    baseURL: getBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
    // Cognito dùng Bearer Token, không dùng Cookie nên withCredentials thường là false
    withCredentials: false,
  })

  // --- 1. REQUEST INTERCEPTOR (Quan trọng nhất) ---
  client.interceptors.request.use(
    async (config) => {
      try {
        // Tự động check và gắn token Cognito vào header Authorization
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.log('User chưa đăng nhập hoặc lỗi lấy token')
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // --- 2. RESPONSE INTERCEPTOR (Chỉ để logout khi token chết hẳn) ---
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.log('Phiên đăng nhập hết hạn hẳn -> Redirect login')
      }
      return Promise.reject(error)
    }
  )

  clientInstance = client
  return client
}
