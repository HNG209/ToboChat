import { Text, YStack } from '@my/ui'
import { MessageResponse, UserResponse } from 'app/types/Response'
import { useState } from 'react'
import { PollDetailDialog } from './PollDetailDialog'

interface SystemMessageProps {
  msg: MessageResponse
  selfUserId?: string
  onUserPress?: (user: UserResponse) => void
}

const buildRoleName = (role?: string) => {
  switch (role) {
    case 'ADMIN': return 'Quản trị viên'
    case 'VICE_ADMIN': return 'Phó quản trị viên'
    case 'MEMBER': return 'Thành viên'
    default: return 'Vai trò không xác định'
  }
}

// Sub-component giúp render link người dùng
const UserLink = ({
  id,
  name,
  user,
  isSelf,
  onPress
}: {
  id?: string
  name?: string
  user?: UserResponse
  isSelf: boolean
  onPress?: (user: UserResponse) => void
}) => {
  if (isSelf) return <Text fontWeight="bold">Bạn</Text>

  const displayName = name || 'Ai đó'

  return (
    <Text
      color="$blue10"
      fontWeight="600"
      cursor="pointer"
      hoverStyle={{
        textDecorationLine: 'underline',
        color: '$blue11',
      }}
      onPress={(e) => {
        e.stopPropagation()
        if (id && onPress) {
          onPress(user ?? { id, name: displayName, email: '', createdAt: '' })
        }
      }}
    >
      {displayName}
    </Text>
  )
}

const PollLink = ({
  pollId,
  question,
  onPress
}: {
  pollId?: string
  question?: string
  onPress?: (pollId: string) => void
}) => {
  const displayQuestion = question || 'cuộc thăm dò'
  return (
    <Text
      color="$blue10"
      fontWeight="600"
      cursor="pointer"
      hoverStyle={{
        textDecorationLine: 'underline',
        color: '$blue11',
      }}
      onPress={(e) => {
        e.stopPropagation()
        if (pollId && onPress) onPress(pollId)
      }}
    >
      {displayQuestion}
    </Text>
  )
}

export const SystemMessage = ({ msg, selfUserId, onUserPress }: SystemMessageProps) => {
  const [isPollDetailOpen, setIsPollDetailOpen] = useState(false)
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null)
  const actorId = msg.user?.id
  const actorName = msg.user?.name
  const isActorSelf = actorId === selfUserId
  const meta = msg.metadata || {}

  const onPollPress = (pollId: string) => {
    setIsPollDetailOpen(true)
    setSelectedPollId(pollId)
  }

  // Helper để render Actor (Người thực hiện hành động)
  const Actor = () => (
    <UserLink
      id={actorId}
      name={actorName}
      user={msg.user}
      isSelf={isActorSelf}
      onPress={onUserPress}
    />
  )

  switch (msg.action) {
    case 'ROOM_CREATED':
      return <Text><Actor /> đã tạo nhóm này.</Text>

    case 'ROOM_NAME_CHANGED':
      return <Text><Actor /> đã đổi tên nhóm thành "{meta.newRoomName || 'tên mới'}".</Text>

    case 'ROOM_AVATAR_CHANGED':
      return <Text><Actor /> đã đổi ảnh đại diện nhóm.</Text>

    case 'MEMBER_APPROVED':
      return (
        <Text>
          <Actor /> đã phê duyệt{' '}
          <UserLink
            id={meta?.approvedMemberId}
            name={meta?.approvedMemberName}
            isSelf={meta?.approvedMemberId === selfUserId}
            onPress={onUserPress}
          />{' '}
          tham gia nhóm.
        </Text>
      )

    case 'MEMBER_ADDED':
      return (
        <Text>
          <Actor /> đã thêm{' '}
          <UserLink
            id={meta?.newMemberId}
            name={meta?.newMemberName}
            isSelf={meta?.newMemberId === selfUserId}
            onPress={onUserPress}
          />{' '}
          vào nhóm.
        </Text>
      )

    case 'MEMBER_LEFT':
      return <Text><Actor /> đã rời nhóm.</Text>

    case 'MEMBER_REMOVED':
      return (
        <Text>
          <Actor /> đã xóa{' '}
          <UserLink
            id={meta?.removedMemberId}
            name={meta?.removedMemberName}
            isSelf={meta?.removedMemberId === selfUserId}
            onPress={onUserPress}
          />{' '}
          khỏi nhóm.
        </Text>
      )

    case 'GROUP_INVITE_ACCEPTED':
      return <Text><Actor /> đã chấp nhận lời mời tham gia nhóm.</Text>

    case 'FRIEND_ACCEPTED':
      return <Text><Actor /> đã chấp nhận lời mời kết bạn.</Text>

    case 'MEMBER_ROLE_UPDATED':
      return (
        <Text>
          <Actor /> đã cập nhật vai trò của{' '}
          <UserLink
            id={meta?.updatedMemberId}
            name={meta?.updatedMemberName}
            isSelf={meta?.updatedMemberId === selfUserId}
            onPress={onUserPress}
          />{' '}
          thành <Text fontWeight="bold">{buildRoleName(meta?.newRole)}</Text>.
        </Text>
      )

    case 'POLL_UPDATED':
      return (
        <YStack>
          <Text>
            <Actor /> đã cập nhật cuộc bình chọn. <PollLink pollId={meta?.pollId} question={'Xem chi tiết'} onPress={onPollPress} />
          </Text>
          
          <PollDetailDialog
            isOpen={isPollDetailOpen}
            pollId={selectedPollId!}
            onOpenChange={(open) => {
              if (!open) setSelectedPollId(null)
              setIsPollDetailOpen(open)
            }}
            roomId={msg.roomId}
          />
        </YStack>
      )

    case 'POLL_VOTED':
      return (
        <YStack>
          <Text>
            <Actor /> đã tham gia bình chọn. <PollLink pollId={meta?.pollId} question={'Xem chi tiết'} onPress={onPollPress} />
          </Text>

          <PollDetailDialog
            isOpen={isPollDetailOpen}
            pollId={selectedPollId!}
            onOpenChange={(open) => {
              if (!open) setSelectedPollId(null)
              setIsPollDetailOpen(open)
            }}
            roomId={msg.roomId}
          />
        </YStack>
      )

    default:
      return <Text>{msg.content || <><Actor /> đã cập nhật nhóm.</>}</Text>
  }
}
