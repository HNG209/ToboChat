// packages/app/provider/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { useRouter, usePathname } from 'solito/navigation'
import { Spinner, YStack } from 'tamagui' // Đã đổi sang Tamagui

// 1. Tạo Context để các con có thể dùng useAuth()
type AuthContextType = {
  user: any
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
})

// Danh sách các đường dẫn KHÔNG cần đăng nhập (Public)
const PUBLIC_PATHS = ['/login', '/auth/forgot-password']

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname() // Lấy đường dẫn hiện tại

  // 2. Hàm kiểm tra User hiện tại
  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // 3. Lắng nghe sự kiện Login/Logout toàn App
  useEffect(() => {
    checkUser() // Check ngay khi mở App

    // Hub lắng nghe sự kiện từ Amplify
    const listener = Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case 'signedIn':
          checkUser()
          break
        case 'signedOut':
          setUser(null)
          break
      }
    })

    return () => listener() // Hủy lắng nghe khi unmount
  }, [])

  // 4. CƠ CHẾ BẢO VỆ (ROUTE GUARD) - Quan trọng nhất
  useEffect(() => {
    if (loading) return // Đang check thì cứ bình tĩnh

    const isPublicPage = PUBLIC_PATHS.some((path) => pathname?.startsWith(path))

    if (user && isPublicPage) {
      // Đã đăng nhập mà còn mon men vào trang Login -> Đá về Home
      router.replace('/')
    } else if (!user && !isPublicPage) {
      // Chưa đăng nhập mà đòi vào trang trong -> Đá về Login
      router.replace('/login')
    }
  }, [user, loading, pathname]) // Chạy lại mỗi khi user hoặc đường dẫn thay đổi

  // 5. Giao diện Loading che màn hình
  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    )
  }

  // 6. Cung cấp Context cho App
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook nhỏ để dùng nhanh trong các màn hình con
export const useAuth = () => useContext(AuthContext)
