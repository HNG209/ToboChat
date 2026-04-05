// packages/app/hooks/useSocketConnection.ts
import { useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { initSocket, disconnectSocket } from 'app/utils/socket'
import { Platform } from 'react-native'

export function useSocketConnection(isLoggedIn: boolean) {
  useEffect(() => {
    let isMounted = true

    const setupSocket = async () => {
      // 1. NẾU ĐÃ ĐĂNG NHẬP -> Tiến hành kết nối
      if (isLoggedIn) {
        try {
          const session = await fetchAuthSession()
          const token = session.tokens?.accessToken?.toString()

          if (token && isMounted) {
            const baseUrl =
              Platform.OS === 'web' ? 'http://localhost:8085' : 'http://192.168.1.xxx:8085'

            initSocket(token, baseUrl)
          }
        } catch (error) {
          console.log('Lỗi khi lấy token cho Socket:', error)
        }
      }
      // 2. NẾU CHƯA ĐĂNG NHẬP (hoặc vừa Đăng xuất) -> Ngắt kết nối
      else {
        disconnectSocket()
      }
    }

    setupSocket()

    // Cleanup khi app tắt hoàn toàn
    return () => {
      isMounted = false
    }
  }, [isLoggedIn])
}
