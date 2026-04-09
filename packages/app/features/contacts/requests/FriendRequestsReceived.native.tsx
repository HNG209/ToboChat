import React, { useEffect } from 'react'
import { Avatar, Button, ScrollView, Text, XStack, YStack } from 'tamagui'

import {
  useGetMyFriendRequestsQuery,
  useRespondFriendRequestMutation,
} from 'app/services/contactApi'
import { FriendRequestType } from 'app/types/Request'

type Props = {
  onCountChange?: (count: number) => void
}

export default function FriendRequestsReceived({ onCountChange }: Props) {
  const { data, isLoading, error } = useGetMyFriendRequestsQuery({
    type: FriendRequestType.PENDING,
    limit: 10,
  })
  const [respondFriendRequest] = useRespondFriendRequestMutation()

  const items = data?.items ?? []

  useEffect(() => {
    onCountChange?.(items.length)
  }, [items.length, onCountChange])

  const onAccept = async (otherId: string) => {
    try {
      await respondFriendRequest({ otherId, accepted: true }).unwrap()
    } catch (err) {
      console.error('API error:', err)
    }
  }

  const onReject = async (otherId: string) => {
    try {
      await respondFriendRequest({ otherId, accepted: false }).unwrap()
    } catch (err) {
      console.error('API error:', err)
    }
  }

  return (
    <YStack flex={1} padding="$2" borderWidth={1} borderColor="$borderColor" borderRadius="$6">
      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 12 }}>
        {isLoading && <Text padding="$3">Đang tải...</Text>}
        {!!error && (
          <Text padding="$3" color="red">
            Lỗi tải dữ liệu
          </Text>
        )}

        {items.map((request, index) => {
          const isLast = index === items.length - 1

          return (
            <XStack
              key={request.id}
              padding="$3"
              gap="$3"
              alignItems="center"
              justifyContent="space-between"
              borderBottomWidth={isLast ? 0 : 1}
              borderColor="$borderColor"
            >
              <XStack flex={1} gap="$3" alignItems="center">
                <Avatar circular size="$4">
                  <Avatar.Image
                    src={
                      request.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}`
                    }
                  />
                  <Avatar.Fallback backgroundColor="$gray5" />
                </Avatar>

                <YStack flex={1} gap="$1">
                  <Text fontSize="$4" fontWeight="700" numberOfLines={1}>
                    {request.name}
                  </Text>
                  <Text fontSize="$2" color="$color10" numberOfLines={1}>
                    Muốn kết bạn với bạn
                  </Text>
                </YStack>
              </XStack>

              <XStack gap="$2" alignItems="center" flexShrink={0}>
                <Button
                  size="$3"
                  theme="blue"
                  borderRadius="$4"
                  onPress={() => onAccept(request.id)}
                >
                  Đồng ý
                </Button>
                <Button
                  size="$3"
                  variant="outline"
                  borderRadius="$4"
                  onPress={() => onReject(request.id)}
                >
                  Từ chối
                </Button>
              </XStack>
            </XStack>
          )
        })}

        {!isLoading && items.length === 0 && (
          <XStack justifyContent="center" paddingVertical="$6">
            <Text color="$color10" textAlign="center">
              Chưa có lời mời kết bạn nào đang chờ
            </Text>
          </XStack>
        )}
      </ScrollView>
    </YStack>
  )
}
