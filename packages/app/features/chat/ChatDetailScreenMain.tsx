import { Button, Text, XStack, YStack } from '@my/ui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

export function ChatDetailScreenMain({ id }: { id: string }) {
  const router = useRouter()
  return (
    <YStack flex={1} justifyContent="center" alignItems="center">
      <XStack
        alignItems="center"
        padding="$2.5"
        borderBottomWidth={1}
        borderColor="$borderColor"
        display="none" // <-- Bước 1: Mặc định ẩn trên Desktop
        $sm={{
          display: 'flex', // <-- Bước 2: Chỉ hiển thị khi màn hình nhỏ (Mobile)
        }}
      >
        <Button
          icon={<ChevronLeft size={24} />}
          chromeless // Xóa nền nút để trông giống Zalo
          onPress={() => router.push('/chat')} // Quay về danh sách tin nhắn
          padding="$2"
        />
      </XStack>
      <Text>Đang nhắn tin với người có ID: {id}</Text>
    </YStack>
  )
}
