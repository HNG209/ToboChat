import { Theme, XStack, YStack } from '@my/ui'
import React from 'react'
import { Platform } from 'react-native'
import ChatMain from './ChatMain'
import { ZaloSidebar } from '../sidebar/ZaloSidebar'
import { useParams, useRouter } from 'solito/navigation'
import { useAppTheme } from 'app/provider/ThemeContext'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const { theme } = useAppTheme()
  const isChatting = !!params.id // Kiểm tra xem có đang chọn tin nhắn không

  // Neu la mobile: Chi hien noi dung trang, khong hien ba cot
  if (Platform.OS !== 'web')
    return (
      <YStack marginTop={20} flex={1}>
        {children}
      </YStack>
    )
  return (
    <Theme name={theme}>
      <XStack
        height="100vh"
        width="100vw"
        alignItems="center"
        overflow="hidden"
        backgroundColor="$background"
      >
        {/* CỘT 1: SIDEBAR (Màu xanh Zalo) - Cố định 64px */}
        <YStack
          $sm={{ display: isChatting ? 'none' : 'flex' }}
          width={64}
          backgroundColor="$primary"
          alignItems="center"
          py="$5"
          justifyContent="space-between"
        >
          <YStack alignItems="center">
            {/* Thêm Icon Chat, Danh bạ ở đây */}
            <ZaloSidebar />
          </YStack>
        </YStack>
        {/* CỘT 2: DANH SÁCH CHAT - Rộng 340px */}
        <YStack
          $sm={{ display: isChatting ? 'none' : 'flex', width: '100%' }}
          width={340}
          borderRightWidth={1}
          borderColor="$borderColor"
          color="$color"
          height="100%"
        >
          <YStack flex={1}>
            <ChatMain />
          </YStack>
        </YStack>

        {/* CỘT 3: CHI TIẾT TIN NHẮN - Ẩn khi màn hình nhỏ * * Desktop → luôn hiện * Man hinh nho isChatting == true hien full man hinh * neu chua chon thi an */}
        <YStack
          flex={1}
          $sm={{
            display: isChatting ? 'flex' : 'none',
            position: 'absolute', // Đè lên toàn bộ nếu cần
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '$background',
          }}
        >
          {children}
        </YStack>
      </XStack>
    </Theme>
  )
}
