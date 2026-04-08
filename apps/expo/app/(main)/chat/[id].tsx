import { useParams } from 'solito/navigation'
import { ChatScreenWrapper } from 'app/features/chat/ChatScreenWrapper'
import { Stack } from 'expo-router'

export default function ChatScreen() {
  const { id } = useParams()

  return (
    <>
      {/* headerShown: false để ẩn tiêu đề mặc định của hệ thống */}
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />

      {/* Component hiển thị nội dung tin nhắn của bạn */}
      <ChatScreenWrapper roomId={id as string} />
    </>
  )
}
