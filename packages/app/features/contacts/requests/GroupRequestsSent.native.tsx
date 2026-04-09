import React, { useEffect, useMemo } from 'react'
import { Avatar, Button, ScrollView, Text, XStack, YStack } from 'tamagui'

type Props = {
  onCountChange?: (count: number) => void
}

type GroupRequest = {
  id: string
  name: string
  avatarUrl?: string
}

export default function GroupRequestsSent({ onCountChange }: Props) {
  const items: GroupRequest[] = useMemo(
    () => [
      { id: 'req1', name: 'Hội yêu công nghệ' },
      { id: 'req2', name: 'Nhóm học tiếng Anh' },
    ],
    []
  )

  useEffect(() => {
    onCountChange?.(items.length)
  }, [items.length, onCountChange])

  const onCancel = async (id: string) => {
    console.log('cancel group join request', id)
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
                    Đang chờ duyệt
                  </Text>
                </YStack>
              </XStack>

              <XStack gap="$2" alignItems="center" flexShrink={0}>
                <Button
                  size="$3"
                  variant="outline"
                  theme="red"
                  borderRadius="$4"
                  onPress={() => onCancel(item.id)}
                >
                  Hủy
                </Button>
              </XStack>
            </XStack>
          )
        })}

        {items.length === 0 && (
          <XStack justifyContent="center" paddingVertical="$6">
            <Text color="$color10" textAlign="center">
              Bạn chưa gửi yêu cầu gia nhập nhóm nào.
            </Text>
          </XStack>
        )}
      </ScrollView>
    </YStack>
  )
}
