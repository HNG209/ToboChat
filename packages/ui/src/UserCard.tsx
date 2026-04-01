import React from 'react'
import { Button, XStack, YStack, Text, Avatar } from 'tamagui'
import { MoreHorizontal, Check, X, UserMinus, Users } from '@tamagui/lucide-icons'
import { FriendResponse } from 'app/types/Response'
import { FriendRequestType } from 'app/types/Request'

type Props = {
  user: FriendResponse
  description?: string
  isGroup?: boolean
  requestId?: string
  type?: FriendRequestType
  onAction?: (action: 'accept' | 'reject' | 'cancel' | 'join', id: string) => void
}

export function UserCard({ user, description, isGroup = false, type, requestId, onAction }: Props) {
  const isPending = type === FriendRequestType.PENDING
  const isSent = type === FriendRequestType.SENT

  return (
    <XStack
      width="100%"
      padding="$3"
      alignItems="center"
      justifyContent="space-between"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$6"
      backgroundColor="$background"
      hoverStyle={{ backgroundColor: '$gray2' }}
      pressStyle={{ scale: 0.99 }}
      gap="$3"
    >
      {/* LEFT: Avatar + Thông tin người dùng */}
      <XStack alignItems="center" gap="$3" flex={1}>
        <Avatar circular size="$4">
          <Avatar.Image
            src={
              user?.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`
            }
          />
          <Avatar.Fallback backgroundColor="$gray5" />
        </Avatar>

        <YStack flex={1}>
          <Text fontWeight="700" fontSize="$4" color="$color">
            {user.name}
          </Text>
          <XStack alignItems="center" gap="$1.5">
            {/* CHỖ NÀY: Chỉ hiện icon Users nếu prop isGroup là true */}
            {isGroup && <Users size={12} color="$gray10" />}

            <Text color="$gray10" fontSize="$2" numberOfLines={1}>
              {description || user.email}
            </Text>
          </XStack>
        </YStack>
      </XStack>

      {/* RIGHT: Các nút hành động */}
      <XStack gap="$2" alignItems="center">
        {isGroup ? (
          <Button
            size="$3"
            variant="outline"
            borderRadius="$4"
            onPress={() => onAction?.('join', user.id)}
          >
            Vào nhóm
          </Button>
        ) : (
          <>
            {/* Trường hợp: Danh sách bạn bè bình thường */}
            {!isPending && !isSent && (
              <Button
                size="$3"
                circular
                chromeless
                icon={<MoreHorizontal size={20} color="$gray10" />}
                hoverStyle={{ backgroundColor: '$gray4' }}
              />
            )}

            {/* Trường hợp: Lời mời ĐÃ NHẬN (Pending) */}
            {isPending && (
              <XStack gap="$2">
                <Button
                  size="$3"
                  theme="blue"
                  borderRadius="$4"
                  icon={<Check size={16} />}
                  onPress={() => onAction?.('accept', user.id)}
                >
                  Chấp nhận
                </Button>
                <Button
                  size="$3"
                  variant="outline"
                  borderRadius="$4"
                  icon={<X size={16} />}
                  onPress={() => onAction?.('reject', user.id)}
                >
                  Từ chối
                </Button>
              </XStack>
            )}

            {/* Trường hợp: Lời mời ĐÃ GỬI (Sent) */}
            {isSent && (
              <Button
                size="$3"
                theme="red"
                variant="outline"
                borderRadius="$4"
                icon={<UserMinus size={16} />}
                onPress={() => onAction?.('cancel', requestId || user.id)}
              >
                Hủy yêu cầu
              </Button>
            )}
          </>
        )}
      </XStack>
    </XStack>
  )
}
