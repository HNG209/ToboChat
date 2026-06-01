import React from 'react'
import { YStack, Text, Button, XStack } from 'tamagui'
import { AlertCircle, AlertTriangle, RefreshCw } from '@tamagui/lucide-icons'

interface ChatErrorStateProps {
  onRetry?: () => void
  errorMessage?: string
}

export function ChatErrorState({ onRetry, errorMessage }: ChatErrorStateProps) {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      bg="$background"
      px="$6"
      space="$4"
      animation="lazy"
    >
      {/* Icon sinh động với vòng tròn nền */}
      <YStack
        p="$3"
        borderRadius="$12"
        backgroundColor="$red2"
        animation="lazy"
        pressStyle={{ scale: 0.96 }}
      >
        <AlertTriangle size={40} color="$red10" />
      </YStack>

      {/* Thông điệp lỗi */}
      <YStack space="$2" alignItems="center" maxWidth={280}>
        <Text
          fontSize="$5"
          fontWeight="700"
          textAlign="center"
          color="$red10"
        >
          Không thể tải tin nhắn!
        </Text>
        <Text
          fontSize="$3"
          color="$color10"
          textAlign="center"
          lineHeight={20}
        >
          {errorMessage || 'Đã có lỗi xảy ra trong quá trình kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.'}
        </Text>
      </YStack>

      {/* Nút hành động */}
      {onRetry && (
        <Button
          mt="$2"
          size="$4"
          theme="blue"
          borderRadius="$10"
          icon={<RefreshCw size={16} />}
          onPress={onRetry}
          hoverStyle={{ scale: 1.02 }}
          pressStyle={{ scale: 0.97 }}
          elevation="$2"
        >
          Thử lại ngay
        </Button>
      )}
    </YStack>
  )
}