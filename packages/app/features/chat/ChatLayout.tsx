"use client"

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

  // 1. Kiểm tra xem đã "vào trong" một cuộc hội thoại cụ thể chưa
  // Giả sử URL của bạn là /chat/[id], nếu có id nghĩa là đang xem chi tiết
  const isViewingDetail = params.id || (pathname !== '/chat' && pathname !== '/contact')

  const isFriendPage = pathname === '/contact' || pathname?.startsWith('/contact/')
  const isChatPage = pathname?.startsWith('/chat') && !isFriendPage
  if (Platform.OS !== 'web') {
    return (
      <YStack marginTop={20} flex={1}>
        <ZaloSidebar />
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
          $sm={{ display: isViewingDetail ? 'none' : 'flex' }}
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
          $sm={{ display: isViewingDetail ? 'none' : 'flex', 
            width: "100%",
            flex: 1, 
            minWidth: 0,
          }}
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
          $sm={{ display: isViewingDetail ? 'flex' : 'none' }}
        >
          {children}
        </YStack>
      </XStack>
    </Theme>
  )
}
