import React, { useEffect, useMemo } from 'react'
import { Avatar, Button, ScrollView, Text, XStack, YStack } from 'tamagui'

type Props = {
  onCountChange?: (count: number) => void
}

type GroupInvite = {
  id: string
  name: string
  inviter: string
  avatarUrl?: string
}

export default function GroupRequestsReceived({ onCountChange }: Props) {
  const items: GroupInvite[] = useMemo(
    () => [
      { id: 'inv1', name: 'Cộng đồng React Việt', inviter: 'Nguyễn Văn A' },
      { id: 'inv2', name: 'Team Design UI/UX', inviter: 'Trần Thị B' },
    ],
    []
  )

  useEffect(() => {
    onCountChange?.(items.length)
  }, [items.length, onCountChange])

  const onAccept = async (id: string) => {
    console.log('accept group invite', id)
  }

  const onReject = async (id: string) => {
    console.log('reject group invite', id)
  }

  return (
    <YStack flex={1} padding="$2" borderWidth={1} borderColor="$borderColor" borderRadius="$6">
      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 12 }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <XStack
              key={item.id}
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
                      item.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}`
                    }
                  />
                  <Avatar.Fallback backgroundColor="$gray5" />
                </Avatar>

                <YStack flex={1} gap="$1">
                  <Text fontSize="$4" fontWeight="700" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text fontSize="$2" color="$color10" numberOfLines={1}>
                    Người mời: {item.inviter}
                  </Text>
                </YStack>
              </XStack>

              <XStack gap="$2" alignItems="center" flexShrink={0}>
                <Button size="$3" theme="blue" borderRadius="$4" onPress={() => onAccept(item.id)}>
                  Đồng ý
                </Button>
                <Button
                  size="$3"
                  variant="outline"
                  borderRadius="$4"
                  onPress={() => onReject(item.id)}
                >
                  Từ chối
                </Button>
              </XStack>
            </XStack>
          )
        })}

        {items.length === 0 && (
          <XStack justifyContent="center" paddingVertical="$6">
            <Text color="$color10" textAlign="center">
              Không có lời mời vào nhóm nào.
            </Text>
          </XStack>
        )}
      </ScrollView>
    </YStack>
  )
}
