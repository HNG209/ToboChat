'use client'

import React from 'react'
import { XStack, YStack, H3, Text, Button } from 'tamagui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

interface ContactHeaderProps {
  title: string
  subtitle: string
  actionElement?: React.ReactNode
  onBackPath?: string // Đường dẫn khi nhấn Back, mặc định là /contact
}

export const ContactHeader = ({
  title,
  subtitle,
  actionElement,
  onBackPath = '/contact',
}: ContactHeaderProps) => {
  const router = useRouter()

  return (
    <XStack
      alignItems="center"
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$6"
      backgroundColor="$background"
      gap="$3"
    >
      {/* NÚT BACK: Tích hợp sẵn, tự ẩn trên Desktop và hiện trên Mobile */}
      <Button
        icon={<ChevronLeft size={24} />}
        height={40}
        width={40}
        padding={0}
        chromeless
        display="none" // Ẩn trên Desktop
        $sm={{ display: 'flex' }} // Hiện trên Mobile
        onPress={() => router.push(onBackPath)}
      />

      {/* KHỐI TIÊU ĐỀ */}
      <YStack flex={1}>
        <H3 fontWeight="bold">
          {title}
        </H3>
        <Text color="$gray10" fontSize="$3">
          {subtitle}
        </Text>
      </YStack>

      {/* KHỐI HÀNH ĐỘNG (Nút tạo nhóm, Select...) */}
      {actionElement && (
        <XStack alignItems="center">
          {actionElement}
        </XStack>
      )}
    </XStack>
  )
}