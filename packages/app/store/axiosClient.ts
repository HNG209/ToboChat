import axios from 'axios'

const getBaseUrl = () => {
  // console.log('Web axiosClient called')
  return 'http://localhost:8081/api'
}

let clientInstance: any = null

export const getAxiosClient = async () => {
  if (clientInstance) return clientInstance

  const client = axios.create({
    baseURL: getBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // Bắt buộc cho Web
  })

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      const errorCode = error.response.data.code || error.response?.status

      // Nếu lỗi 401 (Unauthorized) và chưa từng thử lại
      if (errorCode === 3005 && !originalRequest._retry) {
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
