import { Button, XStack, YStack, Text, Adapt, Sheet } from 'tamagui'
import { MoreHorizontal, Check, X, UserMinus, Users } from '@tamagui/lucide-icons'
import { FriendResponse, UserResponse } from 'app/types/Response'
import { FriendRequestType } from 'app/types/Request'
import { Alert, Platform } from 'react-native'
import { useMedia } from 'tamagui'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState, store } from 'app/store'
import { contactApi, useDeleteFriendMutation } from 'app/services/contactApi'
import { Popover } from 'tamagui'
import { Dialog } from 'tamagui'
import { UserAvatar } from './UserAvatar'
type Props = {
  user: UserResponse
  description?: string
  isGroup?: boolean
  requestId?: string
  type?: FriendRequestType
  onAction?: (action: 'accept' | 'reject' | 'cancel' | 'join', id: string) => void
}

export function UserCard({ user, description, isGroup, type, requestId, onAction }: Props) {
  const isPending = type === FriendRequestType.PENDING
  const isSent = type === FriendRequestType.SENT
  const media = useMedia()
  const dispatch = useDispatch<AppDispatch>()
  const selfUserId = useSelector((state: RootState) => state.auth.user?.id)
  const [deleteFriend, { isLoading: isDeletingFriend }] = useDeleteFriendMutation()
  const buttonProps = {
    size: "$3",
    borderRadius: "$4",
    variant: "outline" as const,
  }
  const handleUnfriendOptimistic = (friendId: string) => {
    const state = store.getState()

    const friendListCaches = contactApi.util.selectInvalidatedBy(
      state,
      ['FriendList']
    )

    return friendListCaches.map(({ originalArgs }) =>
      dispatch(
        contactApi.util.updateQueryData(
          'getMyFriendList',
          originalArgs,
          (draft) => {
            if (!draft?.items) return

            draft.items = draft.items.filter(
              (item: any) =>
                item.user?.id !== friendId &&
                item.id !== friendId
            )
          }
        )
      )
    )
  }
  const handleUnfriend = async () => {
    if (!selfUserId) return

    const patches = handleUnfriendOptimistic(user.id)

    try {
      await deleteFriend({
        userId: selfUserId,
        otherId: user.id,
      }).unwrap()
    } catch (error) {
      patches.forEach((patch) => patch.undo())
      console.error('Unfriend failed:', error)
    }
  }
  const confirmUnfriend = () => {
    const message = `Bạn có chắc chắn muốn hủy kết bạn với ${user.name}?`

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        handleUnfriend()
      }
      return
    }

    Alert.alert('Hủy kết bạn', message, [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Hủy kết bạn',
        style: 'destructive',
        onPress: handleUnfriend,
      },
    ])
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
      {/* LEFT: Avatar + Thông tin người dùng */}
      <XStack alignItems="center" gap="$3" flex={1}>
        <UserAvatar id={user.id} name={user.name} avatarUrl={user.avatarUrl} size="$4" />

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
          <></>
        ) : (
          <>
            {/* Trường hợp: Danh sách bạn bè bình thường */}
            {!isPending && !isSent && (
              <Popover size="$5" allowFlip placement="bottom-end">
                <Popover.Trigger asChild>
                  <Button
                    size="$3"
                    circular
                    chromeless
                    icon={<MoreHorizontal size={20} color="$gray10" />}
                    onPress={(e) => e.stopPropagation()}
                  />
                </Popover.Trigger>

                <Popover.Content
                  borderWidth={1}
                  borderColor="$borderColor"
                  enterStyle={{ y: -10, opacity: 0 }}
                  exitStyle={{ y: -10, opacity: 0 }}
                  elevate
                  animation={[
                    'quick',
                    {
                      opacity: {
                        overshootClamping: true,
                      },
                    },
                  ]}
                  p={0}
                >
                  <YStack>
                    <Button
                      chromeless
                      borderRadius={0}
                      size="$3"
                      justifyContent="flex-start"
                      disabled={isDeletingFriend}
                      opacity={isDeletingFriend ? 0.5 : 1}
                      onPress={confirmUnfriend}
                    >
                      <XStack space="$2" alignItems="center">
                        <UserMinus size={16} color="$red10" />
                        <Text color="$red10" fontSize="$3">Hủy kết bạn</Text>
                      </XStack>
                    </Button>
                  </YStack>
                </Popover.Content>
              </Popover>
            )}

            {/* Trường hợp: Lời mời ĐÃ NHẬN (Pending) */}
            {isPending && (
              <XStack gap="$2">
                <Button
                  {...buttonProps}
                  theme="blue"
                  icon={<Check size={16} />}
                  onPress={() => onAction?.('accept', user.id)}
                >
                  {!media.sm && "Chấp nhận"}
                </Button>
                <Button
                  {...buttonProps}
                  icon={<X size={16} />}
                  onPress={() => onAction?.('reject', user.id)}
                >
                  {!media.sm && "Từ chối"}
                </Button>
              </XStack>
            )}

            {/* Trường hợp: Lời mời ĐÃ GỬI (Sent) */}
            {isSent && (
              <Button
                {...buttonProps}
                theme="red"
                icon={<UserMinus size={16} />}
                onPress={() => onAction?.('cancel', requestId || user.id)}
              >
                {!media.sm && "Hủy yêu cầu"}
              </Button>
            )}
          </>
        )}
      </XStack>
    </XStack >
  )
}
