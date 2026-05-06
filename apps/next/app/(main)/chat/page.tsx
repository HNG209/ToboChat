'use client'

import { YStack, Text, Circle, Theme } from '@my/ui'
import { MessageSquarePlus } from '@tamagui/lucide-icons'

const EmptyChatState = () => {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      p="$4"
      space="$4"
      bg="$background" // Tự động thích ứng light/dark mode
    >
      {/* Vòng tròn trang trí chứa Icon */}
      <Circle
        size={120}
        bg="$blue3"
        animation="lazy"
        enterStyle={{ opacity: 0, scale: 0.5 }}
      >
        <MessageSquarePlus size={48} color="$blue10" strokeWidth={1.5} />
      </Circle>

      <YStack alignItems="center" space="$2">
        <Text
          fontSize="$7"
          fontWeight="bold"
          color="$color"
          textAlign="center"
        >
          Chào mừng bạn đến với ToboChat!
        </Text>

        <Text
          fontSize="$5"
          color="$colorFocus"
          textAlign="center"
          maxWidth={300}
          opacity={0.7}
        >
          Chọn một cuộc trò chuyện từ danh sách bên trái hoặc bắt đầu kết nối với bạn bè ngay bây giờ.
        </Text>
      </YStack>

      <YStack
        position="absolute"
        bottom="$10"
        opacity={0.05}
        zIndex={-1}
      >
        <Text fontSize={100} fontWeight="900" letterSpacing={-5}>
          TOBO
        </Text>
      </YStack>
    </YStack>
  )
}

export default EmptyChatState
