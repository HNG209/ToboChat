import { useParams } from 'solito/navigation'
import { ChatDetailScreenMain } from 'app/features/chat/ChatDetailScreenMain'
import { Stack } from 'expo-router'

export default function ChatScreen() {
  const { id } = useParams()

  return (
    <>
      {/* headerShown: false để ẩn tiêu đề mặc định của hệ thống */}
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />

      {/* Component hiển thị nội dung tin nhắn của bạn */}
      <ChatDetailScreenMain id={id as string} />
    </>
  )
}
