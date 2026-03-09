import { Theme, XStack, YStack } from '@my/ui'
import React from 'react'
import { Platform } from 'react-native'
import { ZaloSidebar } from '../sidebar/ZaloSidebar'
import { useParams, usePathname, useRouter } from 'solito/navigation'
import { useAppTheme } from 'app/provider/ThemeContext'
import FriendMenu from '@my/ui/src/FriendMenu'
import SearchHeader from '@my/ui/src/SearchHeader'
import ChatInbox from '@my/ui/src/ChatInbox'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const { theme } = useAppTheme()
  const pathname = usePathname()

  // Kiểm tra chính xác trang Bạn bè (dùng bằng khớp hoàn toàn hoặc check kỹ hơn)
  const isFriendPage = pathname === '/chat/friend' || pathname?.startsWith('/chat/friend/')

  // Trang Chat chỉ hiện khi bắt đầu bằng /chat và CHẮC CHẮN không phải là trang friend
  const isChatPage = pathname?.startsWith('/chat') && !isFriendPage

  // Thêm một biến kiểm tra trang chủ chat để reset list
  const isMainChat = pathname === '/chat'

  if (Platform.OS !== 'web') {
    return (
      <YStack marginTop={20} flex={1}>
        {children}
      </YStack>
    )
  }

  return (
    <Theme name={theme}>
      <XStack height="100vh" width="100vw" overflow="hidden" backgroundColor="$background">
        {/* CỘT 1: SIDEBAR - Luôn cố định bên trái */}
        <YStack
          width={64}
          minWidth={64}
          height="100%"
          borderRightWidth={1}
          borderColor="$borderColor"
          $sm={{ display: isChatPage ? 'none' : 'flex' }}
        >
          <ZaloSidebar />
        </YStack>

        {/* CỘT 2: LIST DỰA TRÊN ROUTE */}
        <YStack
          width={340}
          minWidth={340}
          height="100%"
          borderRightWidth={1}
          borderColor="$borderColor"
          $sm={{ display: isChatPage ? 'none' : 'flex', width: '100%' }}
        >
          <YStack flex={1} backgroundColor="$color2">
            <SearchHeader />
            {isFriendPage ? <FriendMenu /> : <ChatInbox />}
          </YStack>
        </YStack>

        {/* CỘT 3: CHI TIẾT (Children) */}
        <YStack
          flex={1}
          height="100%"
          backgroundColor="$background"
          $sm={{ display: isChatPage ? 'flex' : 'none' }}
        >
          {children}
        </YStack>
      </XStack>
    </Theme>
  )
}
