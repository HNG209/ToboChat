import { Button, Image, ListItem, YStack, XStack, Text } from '@my/ui'
import { FriendResponse } from '../../app/types/Response'
import { FriendRequestType } from '../../app/types/Request'

type Props = {
  user: FriendResponse
  requestId?: string
  type?: FriendRequestType
  onAction?: (action: 'accept' | 'reject' | 'cancel', id: string) => void
}

export function UserCard({ user, type, requestId, onAction }: Props) {
  const isPending = type === FriendRequestType.PENDING
  const isSent = type === FriendRequestType.SENT

  return (
    <ListItem
      width="100%"
      paddingVertical="$2"
      paddingHorizontal="$4"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$6"
      backgroundColor="$background"
      elevation="$2"
      hoverStyle={{
        backgroundColor: '$gray2',
        elevation: '$4',
      }}
      pressStyle={{ scale: 0.98 }}
    >
      <XStack
        width="100%"
        alignItems="center"
        justifyContent="space-between"
        gap="$4"
        flexWrap="wrap"
      >
        {/* LEFT: Avatar + Info */}
        <XStack alignItems="center" gap="$4" flex={1} minWidth={220}>
          <Image
            source={{
              uri: user?.avatarUrl || 'https://via.placeholder.com/64x64?text=Avatar',
            }}
            width={64}
            height={64}
            borderRadius={32}
          />

          <YStack flex={1} gap="$1">
            <Text fontWeight="700" fontSize="$6">
              {user.name}
            </Text>
            <Text color="$gray10" fontSize="$4">
              {'abc@gmail.com'}
            </Text>
          </YStack>
        </XStack>

        {/* RIGHT: Nút hành động */}
        <XStack alignItems="center" gap="$3" flexWrap="wrap" justifyContent="flex-end">
          {!isPending && !isSent && (
            <Button
              size="$4"
              circular
              width={44}
              height={44}
              backgroundColor="$gray3"
              hoverStyle={{ backgroundColor: '$gray5' }}
              pressStyle={{ scale: 0.95 }}
            >
              <Text fontSize="$6">⋯</Text>
            </Button>
          )}

          {isPending && (
            <XStack gap="$3">
              <Button
                size="$3"
                theme="green"
                borderRadius="$8"
                paddingHorizontal="$4"
                onPress={() => {
                  onAction?.('accept')
                }}
              >
                Chấp nhận
              </Button>

              <Button
                size="$3"
                theme="red"
                borderRadius="$8"
                paddingHorizontal="$4"
                onPress={() => {
                  onAction?.('reject')
                }}
              >
                Từ chối
              </Button>
            </XStack>
          )}
          {isSent && (
            <Button
              size="$3"
              theme="red"
              borderRadius="$8"
              paddingHorizontal="$4"
              onPress={() => {
                onAction?.('cancel', requestId!)
              }}
            >
              Hủy gửi
            </Button>
          )}
        </XStack>
      </XStack>
    </ListItem>
  )
}
