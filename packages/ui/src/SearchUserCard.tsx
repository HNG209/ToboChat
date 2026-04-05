import React, { useState } from 'react'
import { Avatar, YStack, XStack, Text, Button } from 'tamagui'
import { UserResponse } from 'app/types/Response'
import { UserPlus, Check, X } from '@tamagui/lucide-icons'

type Props = {
  user: UserResponse
  requestSent: boolean
  onPress?: () => void
  onAddFriend?: (userId: string) => Promise<void>
  onCancelRequest?: (userId: string) => Promise<void>
  onAcceptRequest?: (userId: string) => Promise<void>
}

export function SearchUserCard({
  user,
  onPress,
  onAddFriend,
  onCancelRequest,
  onAcceptRequest,
}: Props) {
  const [friendStatus, setFriendStatus] = useState(user.friendStatus)
  const [loading, setLoading] = useState(false)

  const handleAddFriend = async (userId: string) => {
    setLoading(true)
    setFriendStatus('SENT')
    try {
      await onAddFriend?.(userId)
    } catch (e) {
      setFriendStatus(user.friendStatus)
    }
    setLoading(false)
  }

  const handleCancelRequest = async (userId: string) => {
    setLoading(true)
    setFriendStatus('STRANGER')
    try {
      await onCancelRequest?.(userId)
    } catch (e) {
      setFriendStatus(user.friendStatus)
    }
    setLoading(false)
  }

  const handleAcceptRequest = async (userId: string) => {
    setLoading(true)
    setFriendStatus('FRIEND')
    try {
      await onAcceptRequest?.(userId)
    } catch (e) {
      setFriendStatus(user.friendStatus)
    }
    setLoading(false)
  }

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
      onPress={onPress}
      gap="$3"
    >
      {/* LEFT: Avatar + Info */}
      <XStack alignItems="center" gap="$3" flex={1}>
        <Avatar circular size="$4">
          <Avatar.Image
            src={
              user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`
            }
          />
          <Avatar.Fallback backgroundColor="$gray5" />
        </Avatar>

        <YStack flex={1}>
          <Text fontWeight="700" fontSize="$4" color="$color" numberOfLines={1}>
            {user.name}
          </Text>
          <Text color="$color" fontSize="$2" numberOfLines={1}>
            {user.email}
          </Text>
        </YStack>
      </XStack>

      {/* RIGHT: Action Badge or Button */}
      <XStack alignItems="center">
        {/* Trường hợp 1: Là chính mình */}
        {friendStatus === 'SELF' && (
          <XStack
            backgroundColor="$green3"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius="$4"
          >
            <Text color="$green10" fontWeight="700" fontSize="$2">
              TÔI
            </Text>
          </XStack>
        )}

        {/* Trường hợp 2: Đã là bạn bè */}
        {friendStatus === 'FRIEND' && (
          <XStack
            backgroundColor="$blue3"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius="$4"
            gap="$1.5"
            alignItems="center"
          >
            <Check size={12} color="$blue10" />
            <Text color="$blue10" fontWeight="700" fontSize="$2" paddingVertical={3}>
              BẠN BÈ
            </Text>
          </XStack>
        )}

        {/* Trường hợp 3: Chưa kết nối */}
        {friendStatus === 'STRANGER' && (
          <Button
            size="$3"
            theme="blue"
            borderRadius="$4"
            icon={<UserPlus size={16} />}
            onPress={(e) => {
              e.stopPropagation()
              handleAddFriend(user.id)
            }}
            disabled={loading}
            loading={loading}
          />
        )}

        {/* Trường hợp 4: Đang chờ kết bạn (đã gửi lời mời) */}
        {friendStatus === 'SENT' && (
          <Button
            size="$3"
            theme="red"
            variant="outline"
            borderRadius="$4"
            icon={<X size={16} />}
            onPress={(e) => {
              e.stopPropagation()
              handleCancelRequest(user.id)
            }}
            disabled={loading}
            loading={loading}
          />
        )}

        {/* Trường hợp 5: Đang chờ kết bạn (được người khác gửi lời mời) */}
        {friendStatus === 'PENDING' && (
          <XStack
            backgroundColor="$purple3"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius="$4"
          >
            {/* Nút xác nhận hoặc từ chối */}
            <Button
              size="$3"
              theme="green"
              variant="outline"
              borderRadius="$4"
              marginRight="$2"
              icon={<Check size={16} />}
              onPress={(e) => {
                e.stopPropagation()
                handleAcceptRequest(user.id)
              }}
              disabled={loading}
              loading={loading}
            />
            <Button
              size="$3"
              theme="red"
              variant="outline"
              borderRadius="$4"
              icon={<X size={16} />}
              onPress={(e) => {
                e.stopPropagation()
                handleCancelRequest(user.id)
              }}
              disabled={loading}
              loading={loading}
            />
          </XStack>
        )}
      </XStack>
    </XStack>
  )
}
