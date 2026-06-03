import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, Spinner, Text, UserAvatar, XStack, YStack } from '@my/ui'
import {
  Check,
  MessageCircle,
  Send,
  UserPlus,
  UserRoundCheck,
  X,
} from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { useDispatch } from 'react-redux'
import {
  contactApi,
  useGetFriendStatusQuery,
  useRespondFriendRequestMutation,
  useSendFriendRequestMutation,
} from 'app/services/contactApi'
import { FriendStatus } from 'app/types/Enums'
import { UserResponse } from 'app/types/Response'
import { generateDirectRoomId } from 'app/utils/chatHelper'
import type { AppDispatch } from 'app/store'
import { setUserProfileFriendStatus } from 'app/store/userProfileDialogSlice'

type UserProfileDialogProps = {
  open: boolean
  userId: string | null
  user: UserResponse | null
  currentUserId?: string | null
  usePortal?: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileDialog({
  open,
  userId,
  user,
  currentUserId,
  usePortal = true,
  onOpenChange,
}: UserProfileDialogProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const [optimisticStatus, setOptimisticStatus] = useState<FriendStatus | null>(null)
  const [localFriendStatus, setLocalFriendStatus] = useState<FriendStatus | undefined>()
  const [actionLoading, setActionLoading] = useState(false)

  const {
    data: fetchedFriendStatus,
    isLoading: isFriendStatusLoading,
  } = useGetFriendStatusQuery(
    { otherId: userId ?? '' },
    { skip: !open || !userId || Boolean(user?.friendStatus) }
  )

  const [sendFriendRequest] = useSendFriendRequestMutation()
  const [respondFriendRequest] = useRespondFriendRequestMutation()

  const friendStatus = optimisticStatus ?? localFriendStatus ?? fetchedFriendStatus ?? user?.friendStatus
  const isLoading = !user && isFriendStatusLoading

  useEffect(() => {
    setOptimisticStatus(null)
    setLocalFriendStatus(user?.friendStatus)
  }, [userId, user?.friendStatus])

  useEffect(() => {
    if (fetchedFriendStatus) {
      setLocalFriendStatus(fetchedFriendStatus)
      if (userId) {
        dispatch(setUserProfileFriendStatus({ userId, friendStatus: fetchedFriendStatus }))
      }
    }
  }, [dispatch, fetchedFriendStatus, userId])

  const runFriendAction = async (
    nextStatus: FriendStatus,
    rollbackStatus: FriendStatus | undefined,
    action: () => Promise<unknown>
  ) => {
    setActionLoading(true)
    setOptimisticStatus(nextStatus)
    const statusPatch = userId
      ? dispatch(
          contactApi.util.updateQueryData('getFriendStatus', { otherId: userId }, () => nextStatus)
        )
      : null
    try {
      await action()
      setLocalFriendStatus(nextStatus)
      if (userId) {
        dispatch(setUserProfileFriendStatus({ userId, friendStatus: nextStatus }))
      }
      setOptimisticStatus(null)
    } catch (error) {
      statusPatch?.undo()
      setOptimisticStatus(rollbackStatus ?? null)
      if (userId) {
        dispatch(setUserProfileFriendStatus({ userId, friendStatus: rollbackStatus }))
      }
      console.error('User profile friend action failed:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendMessage = () => {
    if (!currentUserId || !userId) return
    onOpenChange(false)
    router.push(`/chat/${generateDirectRoomId(currentUserId, userId)}`)
  }

  const handleAddFriend = () => {
    if (!userId) return
    runFriendAction('SENT', friendStatus, () => sendFriendRequest({ otherId: userId }).unwrap())
  }

  const handleAcceptRequest = () => {
    if (!userId) return
    runFriendAction('FRIEND', friendStatus, () =>
      respondFriendRequest({ otherId: userId, accepted: true }).unwrap()
    )
  }

  const dialogContent = (
    <>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          backgroundColor="#000"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Dialog.Content
          bordered
          elevate
          key="content"
          animation="quick"
          enterStyle={{ opacity: 0, scale: 0.98, y: -10 }}
          exitStyle={{ opacity: 0, scale: 0.98, y: -10 }}
          width="90%"
          maxWidth={420}
          padding={0}
          borderRadius="$4"
          backgroundColor="$background"
          overflow="hidden"
        >
          <XStack
            padding="$3"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderColor="$borderColor"
          >
            <Dialog.Title asChild unstyled>
              <Text fontSize="$5" fontWeight="700" color="$color">
                Thông tin tài khoản
              </Text>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="$2" circular icon={X} chromeless />
            </Dialog.Close>
          </XStack>

          <YStack padding="$4" gap="$4">
            {isLoading ? (
              <YStack minHeight={240} alignItems="center" justifyContent="center">
                <Spinner size="large" color="$blue10" />
              </YStack>
            ) : user ? (
              <>
                <YStack alignItems="center" gap="$3">
                  <UserAvatar id={user.id} name={user.name} avatarUrl={user.avatarUrl} size="$8" />
                  <YStack alignItems="center" gap="$1" maxWidth="100%">
                    <Text fontSize="$6" fontWeight="700" color="$color" numberOfLines={1}>
                      {user.name}
                    </Text>
                    <Text fontSize="$3" color="$color10" numberOfLines={1}>
                      {user.email}
                    </Text>
                  </YStack>
                </YStack>

                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    Thông tin cá nhân
                  </Text>
                  <InfoRow label="Họ tên" value={user.name} />
                  <InfoRow label="Email" value={user.email} />
                  <InfoRow label="Trạng thái" value={getFriendStatusLabel(friendStatus)} />
                </YStack>

                <FriendActions
                  status={friendStatus}
                  loading={actionLoading}
                  onSendMessage={handleSendMessage}
                  onAddFriend={handleAddFriend}
                  onAcceptRequest={handleAcceptRequest}
                />
              </>
            ) : (
              <YStack minHeight={220} alignItems="center" justifyContent="center" gap="$2">
                <Text fontSize="$4" fontWeight="600">
                  Không tải được thông tin tài khoản
                </Text>
                <Text color="$color10" textAlign="center">
                  Vui lòng thử lại sau.
                </Text>
              </YStack>
            )}
          </YStack>
        </Dialog.Content>
    </>
  )

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      {usePortal ? (
        <Dialog.Portal>{dialogContent}</Dialog.Portal>
      ) : (
        <YStack
          position="absolute"
          fullscreen
          zIndex={200000}
          alignItems="center"
          justifyContent="center"
        >
          {dialogContent}
        </YStack>
      )}
    </Dialog>
  )
}

function FriendActions({
  status,
  loading,
  onSendMessage,
  onAddFriend,
  onAcceptRequest,
}: {
  status?: FriendStatus
  loading: boolean
  onSendMessage: () => void
  onAddFriend: () => void
  onAcceptRequest: () => void
}) {
  if (status === 'SELF') {
    return (
      <Button disabled borderRadius="$6" icon={<UserRoundCheck size={16} />}>
        Đây là bạn
      </Button>
    )
  }

  if (status === 'FRIEND') {
    return (
      <Button theme="blue" borderRadius="$6" icon={<MessageCircle size={16} />} onPress={onSendMessage}>
        Nhắn tin
      </Button>
    )
  }

  if (status === 'SENT') {
    return (
      <Button
        borderRadius="$6"
        icon={<Send size={16} />}
        onPress={onSendMessage}
      >
        Nhắn tin
      </Button>
    )
  }

  if (status === 'PENDING') {
    return (
      <XStack gap="$2" flexWrap="wrap">
        <Button flex={1} minWidth={130} icon={<Send size={16} />} onPress={onSendMessage}>
          Nhắn tin
        </Button>
        <Button
          flex={1}
          minWidth={130}
          theme="green"
          icon={<Check size={16} />}
          disabled={loading}
          onPress={onAcceptRequest}
        >
          Chấp nhận
        </Button>
      </XStack>
    )
  }

  return (
    <XStack gap="$2" flexWrap="wrap">
      <Button flex={1} minWidth={130} icon={<Send size={16} />} onPress={onSendMessage}>
        Nhắn tin
      </Button>
      <Button
        flex={1}
        minWidth={130}
        theme="blue"
        icon={<UserPlus size={16} />}
        disabled={loading}
        onPress={onAddFriend}
      >
        Kết bạn
      </Button>
    </XStack>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <XStack gap="$3" alignItems="flex-start">
      <Text width={90} color="$color10" fontSize="$3">
        {label}
      </Text>
      <Text flex={1} fontSize="$3" color="$color" numberOfLines={2}>
        {value?.trim() || 'Chưa cập nhật'}
      </Text>
    </XStack>
  )
}

function getFriendStatusLabel(status?: FriendStatus) {
  switch (status) {
    case 'SELF':
      return 'Tài khoản của bạn'
    case 'FRIEND':
      return 'Đã là bạn bè'
    case 'SENT':
      return 'Đã gửi lời mời'
    case 'PENDING':
      return 'Có lời mời kết bạn'
    default:
      return 'Chưa là bạn bè'
  }
}
