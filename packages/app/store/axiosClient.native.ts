import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'
import Constants from 'expo-constants'

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

  // --- 1. REQUEST INTERCEPTOR ---
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

  // --- 2. RESPONSE INTERCEPTOR ---
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.log('Token hết hạn, user cần đăng nhập lại')
      }
      return Promise.reject(error)
    }
  )

  clientInstance = client
  return client
}
