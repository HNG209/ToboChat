import React from 'react'
import { Button, XStack, YStack, Text, Avatar } from 'tamagui'
import { Check, X, Users } from '@tamagui/lucide-icons'
import { UserResponse } from 'app/types/Response'
import { FriendRequestType } from 'app/types/Request'
import { useMedia } from 'tamagui'

type GroupCardProps = {
  roomName: string
  avatarUrl?: string
  description?: string
  // Dùng để phân biệt Group Request (PENDING) và Group thường (không truyền type)
  type?: FriendRequestType
  onAction?: (action: 'join' | 'reject') => void
}

export function GroupCard({ roomName, avatarUrl, description, type, onAction }: GroupCardProps) {
  const isPending = type === FriendRequestType.PENDING
  const media = useMedia()

  const buttonProps = {
    size: "$3",
    borderRadius: "$4",
    variant: "outline" as const,
  }

  return (
    <XStack
      width="100%"
      padding="$3"
      marginBottom="$2"
      alignItems="center"
      justifyContent="space-between"
      borderColor="$borderColor"
      borderRadius="$6"
      backgroundColor="$background"
      hoverStyle={{ backgroundColor: '$gray2' }}
      pressStyle={{ scale: 0.99 }}
      gap="$3"
    >
      {/* LEFT: Avatar + Thông tin nhóm */}
      <XStack alignItems="center" gap="$3" flex={1}>
        <Avatar circular size="$4">
          <Avatar.Image
            src={
              avatarUrl || `https://ui-avatars.com/api/?name=${roomName}&background=random`
            }
          />
          <Avatar.Fallback backgroundColor="$gray5" />
        </Avatar>

        <YStack flex={1}>
          <Text fontWeight="700" fontSize="$4" color="$color">
            {roomName}
          </Text>
          <XStack alignItems="center" gap="$1.5">
            <Users size={12} color="$gray10" />
            <Text color="$gray10" fontSize="$2" numberOfLines={1}>
              {description}
            </Text>
          </XStack>
        </YStack>
      </XStack>

      {/* RIGHT: Các nút bấm hành động (Chỉ hiển thị khi có lời mời PENDING) */}
      <XStack gap="$2" alignItems="center">
        {isPending && (
          <XStack gap="$2">
            <Button
              {...buttonProps}
              theme="blue"
              icon={<Check size={16} />}
              onPress={() => onAction?.('join')}
            >
              {!media.sm && "Tham gia"}
            </Button>
            <Button
              {...buttonProps}
              icon={<X size={16} />}
              onPress={() => onAction?.('reject')}
            >
              {!media.sm && "Từ chối"}
            </Button>
          </XStack>
        )}
      </XStack>
    </XStack>
  )
}