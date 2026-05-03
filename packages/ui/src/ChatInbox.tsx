import { usePathname } from 'solito/navigation'
import { ScrollView, Spinner, Text, YStack, XStack } from '@my/ui'
import { useGetJoinedRoomsQuery, roomApi } from 'app/services/roomApi'
import { getSocket } from 'app/utils/socket'
import { useDispatch, useSelector } from 'react-redux'
import { userApi } from 'app/services/userApi'
import { MessageResponse, RoomMemberResponse, RoomResponse } from 'app/types/Response'
import { AppDispatch, RootState } from 'app/store'
import { ChatInboxItem } from './ChatInboxItem'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { formatPreviewMessage } from 'app/utils/chatHelper'
import { useRouter, useParams } from 'solito/navigation'
export type RoomStatus = 'ACTIVE' | 'PENDING'

function TabButton({
  active,
  label,
  onPress,
}: {
  active: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <XStack
        height={25}
        justifyContent="center"
        alignItems="center"
        borderRadius="$5"
        backgroundColor={active ? '$blue10' : 'transparent'}
      >
        <Text color={active ? 'white' : '$color10'} fontWeight="600">
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}

export default function ChatInbox() {
  const dispatch = useDispatch<AppDispatch>()
  const activeRoomId = useSelector(
    (state: RootState) => state.chat.activeRoomId
  )

  const hasSession = useSelector((s: RootState) => s.auth.hasSession)

  const [isSocketReady, setIsSocketReady] = useState(false)
  const [status, setStatus] = useState<RoomStatus>('ACTIVE')
  const router = useRouter()

  const { data, isLoading, isError } = useGetJoinedRoomsQuery(
    { status },
    {
      skip: !hasSession,
    }
  )

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkSocket = () => {
      const socket = getSocket()
      if (socket) {
        setIsSocketReady(true)
      } else {
        timeoutId = setTimeout(checkSocket, 200)
      }
    }

    checkSocket()
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!isSocketReady) return

    const socket = getSocket()
    if (!socket) return

    const handleInboxUpdated = (payload: any) => {
      const newMsg: MessageResponse = payload.message || payload
      const targetRoomId = newMsg.roomId || payload.roomId

      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
          if (!draft?.items) return

          const roomIndex = draft.items.findIndex((r) => r.id === targetRoomId)

          if (roomIndex !== -1) {
            draft.items[roomIndex].latestMessage = newMsg
            // draft.items[roomIndex].unreadMessages =
            //   (draft.items[roomIndex].unreadMessages || 0) + 1

            const [updatedRoom] = draft.items.splice(roomIndex, 1)
            draft.items.unshift(updatedRoom)
          }
        })
      )
    }

    const handleUnreadUpdate = (roomId: string) => {
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
          if (!draft?.items) return

          const roomIndex = draft.items.findIndex((r) => r.id === roomId)

          if (roomIndex !== -1) {
            draft.items[roomIndex].unreadMessages =
              (draft.items[roomIndex].unreadMessages || 0) + 1
          }
        })
      )

      dispatch(
        userApi.util.updateQueryData('getProfile', undefined, (draft) => {
          if (!draft) return
          draft.totalUnreadMessages = (draft.totalUnreadMessages || 0) + 1
        })
      )
    }

    const handleMessageRevoked = (payload: any) => {
      const revokedMsgId = payload.messageId
      const targetRoomId = payload.roomId
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
          if (!draft?.items) return
          const roomIndex = draft.items.findIndex((r) => r.id === targetRoomId)
          if (roomIndex !== -1) {
            const msg = draft.items[roomIndex].latestMessage
            if (msg && msg.id === revokedMsgId) {
              msg.messageStatus = 'REVOKED'
            }

            // format lại nội dung nếu tin nhắn bị thu hồi
            msg.content = formatPreviewMessage(msg)
            msg.attachments = [] // ẩn attachments nếu tin nhắn bị thu hồi
          }
        })
      )
    }

    const handleNewRoom = (newRoom: RoomResponse) => {
      // Cập nhật cache rtk-query để thêm nhóm mới vào danh sách phòng
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          if (draft) {
            draft.items.unshift(newRoom);
          }
        })
      );
    }

    const handleGroupDisband = (roomId: string) => {
      dispatch(
        roomApi.util.updateQueryData(
          'getJoinedRooms',
          { status: 'ACTIVE' },
          (draft) => {
            const index = draft.items?.findIndex((r) => r.id === roomId)

            if (index !== undefined && index !== -1) {
              draft.items.splice(index, 1)
            }
          }
        )
      );
    }

    // Self remove: người bị đá khỏi phòng
    const handleSelfRemoved = (roomId: string) => {
      // TODO: thêm thông báo đã bị xoá khỏi nhóm
      if (activeRoomId === roomId) {
        router.replace("/chat")
      }

      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          const index = draft.items?.findIndex((r) => r.id === roomId);
          if (index !== -1 && index !== undefined) {
            draft.items.splice(index, 1);
          }
        })
      );

      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'PENDING' }, (draft) => {
          const index = draft.items?.findIndex((r) => r.id === roomId);
          if (index !== -1 && index !== undefined) {
            draft.items.splice(index, 1);
          }
        })
      );

    };
    const handleNewMember = (member: RoomMemberResponse) => {
      dispatch(
        roomApi.util.updateQueryData('getRoomMembers', { roomId: member.roomId }, (draft) => {
          if (draft) {
            draft.items.unshift(member);
          }
        })
      );
    }

    socket.on('inbox_updated', handleInboxUpdated)
    socket.on('unread_updated', handleUnreadUpdate)
    socket.on('message_revoked', handleMessageRevoked)
    socket.on('new_room', handleNewRoom)
    socket.on('room_disband', handleGroupDisband)
    socket.on('self_removed', handleSelfRemoved)
    socket.on('new_member', handleNewMember)

    return () => {
      socket.off('inbox_updated', handleInboxUpdated)
      socket.off('unread_updated', handleUnreadUpdate)
      socket.off('message_revoked', handleMessageRevoked)
      socket.off('new_room', handleNewRoom)
      socket.off('room_disband', handleGroupDisband)
      socket.off('self_removed', handleSelfRemoved)
      socket.off('new_member', handleNewMember)
    }
  }, [dispatch, isSocketReady, activeRoomId, status])

  const handleRoomPress = (roomId: string, unreadCount: number) => {
    dispatch(
      roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
        const roomIndex = draft.items.findIndex((r) => r.id === roomId)
        if (roomIndex !== -1) {
          draft.items[roomIndex].unreadMessages = 0
        }
      })
    )

    dispatch(
      userApi.util.updateQueryData('getProfile', undefined, (draft) => {
        if (!draft) return
        draft.totalUnreadMessages = Math.max(
          (draft.totalUnreadMessages || 0) - unreadCount,
          0
        )
      })
    )

    router.push(`/chat/${roomId}`)
  }

  if (!hasSession || isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    )
  }

  if (isError) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>Error loading rooms</Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$color2">

      {/* ===== SEGMENTED TABS ===== */}
      <YStack padding="$3" backgroundColor="$color2">
        <XStack backgroundColor="$background" borderRadius="$5" padding={4} gap={4}>
          <TabButton
            active={status === 'ACTIVE'}
            label="Tất cả"
            onPress={() => setStatus('ACTIVE')}
          />
          <TabButton
            active={status === 'PENDING'}
            label="Đang chờ"
            onPress={() => setStatus('PENDING')}
          />
        </XStack>
      </YStack>

      {/* ===== LIST ===== */}
      <ScrollView>
        <YStack>
          {data?.items?.map((room) => (
            <ChatInboxItem
              key={room.id}
              name={room.roomName}
              avatarUrl={
                room.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  room.roomName
                )}&background=random`
              }
              latestMessage={room.latestMessage}
              time={room?.latestMessage?.createdAt ?? undefined}
              pinned={false}
              onPress={() =>
                handleRoomPress(room.id, room.unreadMessages || 0)
              }
              unreadCount={room.unreadMessages}
            />
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  )
}