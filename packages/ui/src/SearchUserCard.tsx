import { Avatar, YStack, XStack, Text, Button } from 'tamagui'
import { UserResponse } from 'app/types/Response'
import { useSelector } from 'react-redux'
import { RootState } from 'app/store'
import { UserPlus, UserMinus, Check } from '@tamagui/lucide-icons'

type Props = {
  user: UserResponse
  requestSent: boolean
  onPress?: () => void
  onAddFriend?: (userId: string) => Promise<void>
  onCancelRequest?: (userId: string) => Promise<void>
}

export function SearchUserCard({
  user,
  requestSent,
  onPress,
  onAddFriend,
  onCancelRequest,
}: Props) {
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const currentUserId = currentUser?.id
  const isSelf = String(user.id) === String(currentUserId)

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
        <Avatar circular size="$5">
          <Avatar.Image
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
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
        {isSelf && (
          <XStack 
            backgroundColor="$green3" 
            paddingHorizontal="$3" 
            paddingVertical="$1" 
            borderRadius="$4"
          >
            <Text color="$green10" fontWeight="700" fontSize="$2">TÔI</Text>
          </XStack>
        )}

        {/* Trường hợp 2: Đã là bạn bè */}
        {!isSelf && user.friend === true && (
          <XStack 
            backgroundColor="$blue3" 
            paddingHorizontal="$3" 
            paddingVertical="$1" 
            borderRadius="$4"
            gap="$1.5"
            alignItems="center"
          >
            <Check size={12} color="$blue10" />
            <Text color="$blue10" fontWeight="700" fontSize="$2">BẠN BÈ</Text>
          </XStack>
        )}

        {/* Trường hợp 3: Chưa kết nối */}
        {!isSelf && user.friend !== true && (
          <>
            {requestSent ? (
              <Button
                size="$3"
                theme="red"
                variant="outline"
                borderRadius="$4"
                icon={<UserMinus size={16} />}
                onPress={(e) => {
                  e.stopPropagation()
                  onCancelRequest?.(user.id)
                }}
              >
                Hủy
              </Button>
            ) : (
              <Button
                size="$3"
                theme="blue"
                borderRadius="$4"
                icon={<UserPlus size={16} />}
                onPress={(e) => {
                  e.stopPropagation()
                  onAddFriend?.(user.id)
                }}
              >
                Kết bạn
              </Button>
            )}
          </>
        )}
      </XStack>
    </XStack>
  )
}