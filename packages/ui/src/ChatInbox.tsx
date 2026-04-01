import { useRouter } from 'solito/navigation'
import { ScrollView, Spinner, Text, YStack } from '@my/ui'
import { useGetJoinedRoomsQuery } from 'app/services/roomApi'
import { ChatInboxItem } from './ChatInboxItem'

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN')
}

export default function ChatInbox() {
  const router = useRouter()

  const { data, isLoading, isError } = useGetJoinedRoomsQuery()

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
            message="Chưa có tin nhắn"
            time={formatTime(room.createdAt)}
            avatar={`https://i.pravatar.cc/150?u=${room.id}`}
            pinned={false}
            onPress={() => router.push(`/chat/${room.id}`)}
          />
        ))}
      </YStack>
    </ScrollView>
  )
}
