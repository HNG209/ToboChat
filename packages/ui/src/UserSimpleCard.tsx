import { Image, ListItem, YStack, XStack, Text, Button } from '@my/ui'
import { UserResponse } from '../../app/types/Response'
import { useSelector } from 'react-redux'
import { RootState } from '../../app/store'

type Props = {
  user: UserResponse
  requestSent: boolean
  onPress?: () => void
  onAddFriend?: (userId: string) => Promise<void>
  onCancelRequest?: (userId: string) => Promise<void>
}

export function UserSimpleCard({
  user,
  requestSent,
  onPress,
  onAddFriend,
  onCancelRequest,
}: Props) {
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const currentUserId = currentUser?.result?.id

  const isSelf = String(user.id) === String(currentUserId)

  // TH1: Là chính mình
  if (isSelf) {
    return (
      <ListItem width="100%" padding="$3" borderRadius="$4" hoverTheme pressTheme onPress={onPress}>
        <XStack alignItems="center" justifyContent="space-between" width="100%" gap="$3">
          <XStack alignItems="center" gap="$3" flex={1}>
            <Image
              source={{
                uri: user.avatarUrl || 'https://via.placeholder.com/60x60.png?text=Avatar',
              }}
              width={50}
              height={50}
              borderRadius={25}
            />
            <YStack>
              <Text fontWeight="700" fontSize="$5">
                {user.name}
              </Text>
              <Text color="$blue10" fontSize="$3">
                {user.email}
              </Text>
            </YStack>
          </XStack>

          <Text
            color="$green10"
            fontWeight="600"
            fontStyle="italic"
            fontSize="$5"
            backgroundColor="$green3"
            paddingHorizontal="$4"
            paddingVertical="$1"
            borderRadius="$4"
          >
            Tôi
          </Text>
        </XStack>
      </ListItem>
    )
  }

  // TH2: Đã là bạn bè
  if (user.friend === true) {
    return (
      <ListItem width="100%" padding="$3" borderRadius="$4" hoverTheme pressTheme onPress={onPress}>
        <XStack alignItems="center" gap="$3" flex={1}>
          <Image
            source={{
              uri: user.avatarUrl || 'https://via.placeholder.com/60x60.png?text=Avatar',
            }}
            width={50}
            height={50}
            borderRadius={25}
          />
          <YStack>
            <Text fontWeight="700" fontSize="$5">
              {user.name}
            </Text>
            <Text color="$blue10" fontSize="$3">
              {user.email}
            </Text>
          </YStack>
        </XStack>
      </ListItem>
    )
  }

  // TH3: Chưa kết nối
  return (
    <ListItem width="100%" padding="$3" borderRadius="$4" hoverTheme pressTheme onPress={onPress}>
      <XStack alignItems="center" justifyContent="space-between" width="100%" gap="$3">
        <XStack alignItems="center" gap="$3" flex={1}>
          <Image
            source={{
              uri: user.avatarUrl || 'https://via.placeholder.com/60x60.png?text=Avatar',
            }}
            width={50}
            height={50}
            borderRadius={25}
          />
          <YStack>
            <Text fontWeight="700" fontSize="$5">
              {user.name}
            </Text>
            <Text color="$blue10" fontSize="$3">
              {user.email}
            </Text>
          </YStack>
        </XStack>

        {requestSent ? (
          <Button
            size="$3"
            theme="red"
            borderRadius="$6"
            onPress={(e) => {
              e.stopPropagation()
              onCancelRequest?.(user.id)
            }}
          >
            Hủy lời mời
          </Button>
        ) : (
          <Button
            size="$3"
            theme="blue"
            borderRadius="$6"
            onPress={(e) => {
              e.stopPropagation()
              onAddFriend?.(user.id)
            }}
          >
            Kết bạn
          </Button>
        )}
      </XStack>
    </ListItem>
  )
}
