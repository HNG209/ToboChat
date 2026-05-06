import { useParams } from 'solito/navigation'
import { ChatScreenWrapper } from 'app/features/chat/ChatScreenWrapper'
import { Stack } from 'expo-router'
import { useDispatch } from 'react-redux'
import { clearActiveRoom, setActiveRoom } from 'app/store/chatSlice'
import { useEffect } from 'react'

export default function ChatScreen() {
  const { id } = useParams()
  const dispatch = useDispatch()

  useEffect(() => {
    if (id) {
      dispatch(setActiveRoom(id as string))
    }

    return () => {
      dispatch(clearActiveRoom())
    }
  }, [id])

  return (
    <>
      {/* headerShown: false để ẩn tiêu đề mặc định của hệ thống */}
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />

      {/* Component hiển thị nội dung tin nhắn của bạn */}
      <ChatScreenWrapper roomId={id as string} />
    </>
  )
}
