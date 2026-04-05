import { useRouter } from 'solito/navigation'
import { ScrollView, Spinner, Text, YStack } from '@my/ui'
import { useGetJoinedRoomsQuery } from 'app/services/roomApi'
import { getSocket } from 'app/utils/socket'
import { useDispatch } from 'react-redux'
import { roomApi } from 'app/services/roomApi'
import { MessageResponse } from 'app/types/Response'
import { AppDispatch } from 'app/store'
import { ChatInboxItem } from './ChatInboxItem'
import { useEffect, useState } from 'react'

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN')
}

export default function ChatInbox() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const [isSocketReady, setIsSocketReady] = useState(false)

  const { data, isLoading, isError } = useGetJoinedRoomsQuery()
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkSocket = () => {
      const socket = getSocket()
      if (socket) {
        setIsSocketReady(true) // Báo cho React biết để chạy Effect bên dưới
      } else {
        // Nếu chưa có, đợi 200ms rồi kiểm tra lại
        timeoutId = setTimeout(checkSocket, 200)
      }
    }

    checkSocket()

    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!isSocketReady) return

    const socket = getSocket()
    console.log('ChatInbox mounted, socket:', socket)
    if (!socket) return

    const handleReceiveMessage = (payload: any) => {
      // Tuỳ vào cách bạn cấu hình BE, payload có thể là { roomId, message } hoặc trực tiếp là MessageResponse
      const newMsg: MessageResponse = payload.message || payload
      const targetRoomId = newMsg.roomId || payload.roomId

      dispatch(
        // Đối số thứ 2 là cache key (arg). Nếu useGetJoinedRoomsQuery không có arg, ta để undefined
        roomApi.util.updateQueryData('getJoinedRooms', undefined, (draft) => {
          if (!draft || !draft.items) return

          // 1. Tìm vị trí của phòng chat nhận được tin nhắn
          const roomIndex = draft.items.findIndex((room) => room.id === targetRoomId)

          if (roomIndex !== -1) {
            // 2. Cập nhật tin nhắn mới nhất
            draft.items[roomIndex].latestMessage = newMsg

            // 3. UX Tricky: Cắt phòng chat này ra và nhét lên vị trí đầu tiên (index 0)
            const [updatedRoom] = draft.items.splice(roomIndex, 1)
            draft.items.unshift(updatedRoom)
          }
          // (Tuỳ chọn) Nếu roomIndex === -1 tức là người dùng vừa được mời vào 1 phòng mới toanh,
          // bạn có thể gọi invalidateTags để báo RTK Query fetch lại danh sách phòng.
        })
      )
    }

    socket.on('receive_message', handleReceiveMessage)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [dispatch, isSocketReady])

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    )
  }

  if (isError) {
    return <Text>Error loading rooms</Text>
  }

  return (
    <ScrollView backgroundColor="$color2">
      <YStack>
        {data?.items?.map((room) => (
          <ChatInboxItem
            key={room.id}
            name={room.roomName}
            latestMessage={room.latestMessage}
            time={room?.latestMessage?.createdAt ?? undefined}
            avatar={`https://i.pravatar.cc/150?u=${room.id}`}
            pinned={false}
            onPress={() => router.push(`/chat/${room.id}`)}
          />
        ))}
      </YStack>
    </ScrollView>
  )
}
