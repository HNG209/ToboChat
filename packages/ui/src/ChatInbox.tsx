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
import { StyledFlatList } from './StyledFlatList'
import { AlertTriangle, Inbox } from '@tamagui/lucide-icons'
import { RoomUpdateEvent } from 'app/types/Events'
import { CheckCircle, Clock } from '@tamagui/lucide-icons' // Thêm icon nếu chưa có
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

type InboxUpdatedPayload = {
  message: MessageResponse
  inboxStatus: RoomStatus
}

type NewRoomPayload = {
  room: RoomResponse
  inboxStatus: RoomStatus
}

export default function ChatInbox() {
  const dispatch = useDispatch<AppDispatch>()
  const activeRoomId = useSelector(
    (state: RootState) => state.chat.activeRoomId
  )

  const hasSession = useSelector((s: RootState) => s.auth.hasSession)

  const [isSocketReady, setIsSocketReady] = useState(false)
  const [status, setStatus] = useState<RoomStatus>('ACTIVE')
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [activeCursor, setActiveCursor] = useState<string | undefined>(undefined)
  const [pendingCursor, setPendingCursor] = useState<string | undefined>(undefined)
  const router = useRouter()

  const { data, isLoading, isError } = useGetJoinedRoomsQuery(
    { status, cursor: status === 'ACTIVE' ? activeCursor : pendingCursor },
    { skip: !hasSession }
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

    const handleInboxUpdated = (payload: InboxUpdatedPayload) => {
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: payload.inboxStatus }, (draft) => {
          if (!draft?.items) return

          const roomIndex = draft.items.findIndex((r) => r.id === payload.message.roomId)

          if (roomIndex !== -1) {
            draft.items[roomIndex].latestMessage = payload.message

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

    const handleNewRoom = (payload: NewRoomPayload) => {
      // Cập nhật cache rtk-query để thêm nhóm mới vào danh sách phòng
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: payload.inboxStatus }, (draft) => {
          if (draft) {
            draft.items.unshift(payload.room);
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

    const handlePendingInboxUpdated = (room: RoomResponse) => {
      // Xoá phòng khỏi tab Đang chờ nếu đã được chấp nhận
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'PENDING' }, (draft) => {
          const index = draft.items?.findIndex((r) => r.id === room.id);
          if (index !== -1 && index !== undefined) {
            draft.items.splice(index, 1);
          }
        })
      );

      // Thêm phòng vào tab Tất cả nếu đã được chấp nhận
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          if (draft) {
            // Nếu phòng đã tồn tại thì không thêm nữa (trường hợp nhận được nhiều sự kiện cập nhật cho cùng 1 phòng)
            const exists = draft.items.some((r) => r.id === room.id);
            if (!exists) {
              draft.items.unshift(room);
            }
          }
        })
      );
    }

    const handleRoomUpdated = (event: RoomUpdateEvent) => {
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
          const roomIndex = draft?.items.findIndex((r) => r.id === event.roomId)
          if (roomIndex !== undefined && roomIndex !== -1) {
            const room = draft.items[roomIndex]

            if (event.newRoomName) {
              room.roomName = event.newRoomName
            }

            if (event.newRoomAvatar) {
              room.avatarUrl = event.newRoomAvatar
            }
          }
        })
      );
    }

    socket.on('pending_inbox_updated', handlePendingInboxUpdated)
    socket.on('room_updated', handleRoomUpdated)
    socket.on('inbox_updated', handleInboxUpdated)
    socket.on('unread_updated', handleUnreadUpdate)
    socket.on('message_revoked', handleMessageRevoked)
    socket.on('new_room', handleNewRoom)
    socket.on('room_disband', handleGroupDisband)
    socket.on('self_removed', handleSelfRemoved)
    socket.on('new_member', handleNewMember)
    return () => {
      socket.off('pending_inbox_updated', handlePendingInboxUpdated)
      socket.off('room_updated', handleRoomUpdated)
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

  const handleFetchMore = () => {
    if (isLoading || isFetchingMore || !data?.nextCursor) return

    setIsFetchingMore(true)
    if (status === 'ACTIVE') {
      setActiveCursor(data.nextCursor)
    } else {
      setPendingCursor(data.nextCursor)
    }

    setTimeout(() => {
      setIsFetchingMore(false)
    }, 1000)
  }

  if (isError) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$color2">
        <AlertTriangle size={48} color="#FF6B6B" />
        <Text fontSize={18} fontWeight="700" color="#FF6B6B" marginTop={12}>
          Đã xảy ra lỗi!
        </Text>
        <Text color="$color10" marginTop={4}>
          Không thể tải danh sách phòng.
        </Text>
        <Pressable onPress={() => window.location.reload()} style={{ marginTop: 20 }}>
          <XStack backgroundColor="$blue10" paddingHorizontal={20} paddingVertical={10} borderRadius="$5">
            <Text color="white" fontWeight="600">Thử lại</Text>
          </XStack>
        </Pressable>
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$color2">

      {/* ===== SEGMENTED TABS ===== */}
      <YStack paddingHorizontal="$3" paddingTop="$3" backgroundColor="$color2">
        <XStack gap={8} justifyContent="center">
          <Pressable onPress={() => setStatus('ACTIVE')} style={{ flex: 1 }}>
            <XStack
              backgroundColor={status === 'ACTIVE' ? '$blue10' : '$background'}
              borderRadius={8}
              paddingVertical={7}
              paddingHorizontal={0}
              justifyContent="center"
              alignItems="center"
              gap={6}
              shadowColor={status === 'ACTIVE' ? '#1976d2' : 'transparent'}
              shadowOpacity={status === 'ACTIVE' ? 0.10 : 0}
              shadowRadius={status === 'ACTIVE' ? 4 : 0}
              borderWidth={1}
              borderColor={status === 'ACTIVE' ? '$blue8' : 'transparent'}
              pressStyle={{ scale: 0.98 }}
              transition="all 0.12s"
            >
              <CheckCircle size={16} color={status === 'ACTIVE' ? 'white' : '$blue10'} />
              <Text
                color={status === 'ACTIVE' ? 'white' : '$blue10'}
                fontWeight="700"
                fontSize={13}
              >
                Tất cả
              </Text>
            </XStack>
          </Pressable>
          <Pressable onPress={() => setStatus('PENDING')} style={{ flex: 1 }}>
            <XStack
              backgroundColor={status === 'PENDING' ? '$orange8' : '$background'}
              borderRadius={8}
              paddingVertical={7}
              paddingHorizontal={0}
              justifyContent="center"
              alignItems="center"
              gap={6}
              shadowColor={status === 'PENDING' ? '#ff9800' : 'transparent'}
              shadowOpacity={status === 'PENDING' ? 0.10 : 0}
              shadowRadius={status === 'PENDING' ? 4 : 0}
              borderWidth={1}
              borderColor={status === 'PENDING' ? '$orange7' : 'transparent'}
              pressStyle={{ scale: 0.98 }}
              transition="all 0.12s"
            >
              <Clock size={16} color={status === 'PENDING' ? 'white' : '$orange8'} />
              <Text
                color={status === 'PENDING' ? 'white' : '$orange8'}
                fontWeight="700"
                fontSize={13}
              >
                Đang chờ
              </Text>
            </XStack>
          </Pressable>
        </XStack>
      </YStack>

      {/* ===== LIST ===== */}
      <StyledFlatList<RoomResponse>
        data={data?.items || []}
        keyExtractor={room => room.id}
        renderItem={({ item: room }) => (
          <ChatInboxItem
            selected={activeRoomId === room.id}
            key={room.id}
            name={room.roomName}
            avatarUrl={
              room.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(room.roomName)}&background=random`
            }
            latestMessage={room.latestMessage}
            time={room?.latestMessage?.createdAt ?? undefined}
            pinned={false}
            onPress={() => handleRoomPress(room.id, room.unreadMessages || 0)}
            unreadCount={room.unreadMessages}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
              <Spinner size="large" color="$blue10" />
            </YStack>
          ) : (
            <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
              <Inbox size={48} color="#A0AEC0" />
              <Text fontSize={18} fontWeight="700" color="$color10" marginTop={12}>
                Không có phòng nào
              </Text>
            </YStack>
          )
        }
        onEndReached={handleFetchMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingMore ? <Spinner size="small" color="$blue10" /> : null}
      />
    </YStack>
  )
}