import React from 'react'
import { YStack, Text, Button } from '@my/ui'
import { AlertTriangle, RefreshCw } from '@tamagui/lucide-icons'

interface ChatInboxErrorStateProps {
  onRetry: () => void
}
export function ChatInboxErrorState({ onRetry }: ChatInboxErrorStateProps) {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$color2"
      px="$5"
      space="$3"
    >
      <YStack
        p="$3"
        borderRadius="$12"
        backgroundColor="$red2"
        animation="lazy"
        pressStyle={{ scale: 0.96 }}
      >
        <AlertTriangle size={40} color="$red10" />
      </YStack>

      <YStack space="$1" alignItems="center">
        <Text fontSize={16} fontWeight="700" color="$red10">
          Đã xảy ra lỗi!
        </Text>
        <Text color="$color10" textAlign="center" fontSize={14}>
          Không thể tải danh sách hộp thư. Vui lòng kiểm tra lại kết nối.
        </Text>
      </YStack>

      <Button
        mt="$3"
        size="$3"
        theme="blue"
        borderRadius="$12"
        icon={<RefreshCw size={14} />}
        fontWeight="600"
        onPress={onRetry}
        hoverStyle={{ scale: 1.02 }}
        pressStyle={{ scale: 0.97 }}
      >
        Thử lại
      </Button>
    </YStack>
  )
}