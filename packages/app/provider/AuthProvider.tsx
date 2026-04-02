// packages/app/provider/AuthProvider.tsx
import React, { useEffect, useState } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { useRouter, usePathname } from 'solito/navigation'
import { Spinner, YStack } from 'tamagui' // Đã đổi sang Tamagui
import { useLazyGetProfileQuery } from 'app/services/userApi'
import { useSocketConnection } from 'app/hooks/useSocketConnection'

// Danh sách các đường dẫn KHÔNG cần đăng nhập (Public)
const PUBLIC_PATHS = ['/login', '/auth/forgot-password']

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true)
  const [login, setLogin] = useState(false)
  const router = useRouter()
  const pathname = usePathname() // Lấy đường dẫn hiện tại
  const [getProfile, { data: profileData }] = useLazyGetProfileQuery() // Hook để gọi API lấy profile khi cần

  useSocketConnection(login) // Hook kết nối socket, sẽ tự động lấy token khi có user

  const checkUser = async () => {
    try {
      await getCurrentUser()
      setLogin(true)
      getProfile() // Gọi API lấy profile khi có user
    } catch (error) {
      console.log('No current user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkUser() // Check ngay khi mở App

    // Hub lắng nghe sự kiện từ Amplify
    const listener = Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case 'signedIn':
          checkUser()
          break
        case 'signedOut':
          checkUser()
          break
      }
    })

    return () => listener() // Hủy lắng nghe khi unmount
  }, [])

  // Cơ chế chuyển hướng dựa trên trạng thái đăng nhập và đường dẫn hiện tại
  useEffect(() => {
    if (loading) return

    const isPublicPage = PUBLIC_PATHS.some((path) => pathname?.startsWith(path))

    if (login && isPublicPage) {
      // Đã đăng nhập mà vào trang public (login, signup) -> Đá về Home
      router.replace('/chat')
    } else if (!login && !isPublicPage) {
      // Chưa đăng nhập mà vào trang trong -> Đá về Login
      router.replace('/login')
    }
  }, [login, loading, pathname])

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    )
  }
  return <>{children}</>
}
