import { XStack, YStack } from '@my/ui'
import React from 'react'
import { Platform } from 'react-native'
import ChatMain from './ChatMain'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Neu la mobile: Chi hien noi dung trang, khong hien ba cot
  if (Platform.OS !== 'web') return <YStack flex={1}>{children}</YStack>
  return (
    <XStack height="100vh" width="100vw" alignItems="center" overflow="hidden">
      {/* CỘT 1: SIDEBAR (Màu xanh Zalo) - Cố định 64px */}
      <YStack width={64} bg="#0091FF" alignItems="center" py="$5" justifyContent="space-between">
        <YStack alignItems="center">
          <YStack width={45} height={45} borderRadius="$10" bg="#ccc" /> {/* Avatar */}
          {/* Thêm Icon Chat, Danh bạ ở đây */}
        </YStack>
      </YStack>
      {/* CỘT 2: DANH SÁCH CHAT - Rộng 340px */}
      <YStack
        width={340}
        borderRightWidth={1}
        borderColor="$borderColor"
        bg="$background"
        height="100%"
        $sm={{ flex: 1 }}
      >
        <YStack flex={1}>
          <ChatMain />
        </YStack>
      </YStack>

      {/* CỘT 3: CHI TIẾT TIN NHẮN - Ẩn khi màn hình nhỏ */}
      <YStack
        flex={1}
        height="100%"
        bg="#F4F5F7"
        // Mặc định là hiện (flex)
        display="flex"
        // Khi màn hình nhỏ hơn mức Medium (ví dụ < 1000px), nó sẽ biến mất
        $sm={{ display: 'none' }}
      >
        {children}
      </YStack>
    </XStack>
  )
}
