import axios, { AxiosError } from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'
import { ApiResponse } from 'app/types/Response'

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'
}

let clientInstance: any = null

export const getAxiosClient = async () => {
  if (clientInstance) return clientInstance

  const client = axios.create({
    baseURL: getBaseUrl(),
    // headers: { 'Content-Type': 'application/json' }, xoa bo de khong loi
    // Cognito dùng Bearer Token, không dùng Cookie nên withCredentials thường là false
    withCredentials: false,
  })

  client.interceptors.request.use(
    async (config) => {
      try {
        // Tự động check và gắn token Cognito vào header Authorization
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        // phan fix them de khong loi
        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json'
        } else {
          delete config.headers['Content-Type']
        }
      } catch (error) {
        console.log('User chưa đăng nhập hoặc lỗi lấy token')
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // logout khi token chết hẳn (ví dụ do refresh token cũng hết hạn)
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.log('Phiên đăng nhập hết hạn hẳn -> Redirect login')
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
