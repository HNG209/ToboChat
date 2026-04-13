import { useRouter } from 'solito/navigation'
import { ScrollView, Spinner, Text, YStack, XStack } from '@my/ui'
import { useGetJoinedRoomsQuery, roomApi } from 'app/services/roomApi'
import { getSocket } from 'app/utils/socket'
import { useDispatch, useSelector } from 'react-redux'
import { userApi } from 'app/services/userApi'
import { MessageResponse } from 'app/types/Response'
import { AppDispatch, RootState } from 'app/store'
import { ChatInboxItem } from './ChatInboxItem'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'

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
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const hasSession = useSelector((s: RootState) => s.auth.hasSession)

  const [isSocketReady, setIsSocketReady] = useState(false)
  const [status, setStatus] = useState<RoomStatus>('ACTIVE')

  // =========================
  // API: fetch rooms by status
  // =========================
  const { data, isLoading, isError } = useGetJoinedRoomsQuery(
    { status },
    {
      skip: !hasSession,
      refetchOnMountOrArgChange: true,
    }
  )

  // =========================
  // SOCKET INIT
  // =========================
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

  // =========================
  // SOCKET MESSAGE HANDLER
  // =========================
  useEffect(() => {
    if (!isSocketReady) return

    const socket = getSocket()
    if (!socket) return

    const handleReceiveMessage = (payload: any) => {
      const newMsg: MessageResponse = payload.message || payload
      const targetRoomId = newMsg.roomId || payload.roomId

      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
          if (!draft?.items) return

          const roomIndex = draft.items.findIndex((r) => r.id === targetRoomId)

          if (roomIndex !== -1) {
            draft.items[roomIndex].latestMessage = newMsg
            draft.items[roomIndex].unreadMessages =
              (draft.items[roomIndex].unreadMessages || 0) + 1

            const [updatedRoom] = draft.items.splice(roomIndex, 1)
            draft.items.unshift(updatedRoom)
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

    socket.on('receive_message', handleReceiveMessage)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [dispatch, isSocketReady, status])

  // =========================
  // OPEN ROOM
  // =========================
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

  // =========================
  // LOADING / ERROR
  // =========================
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

  // =========================
  // UI
  // =========================
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