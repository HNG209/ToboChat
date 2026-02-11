import { useRouter } from 'solito/navigation'
import SearchHeader from '../search/SearchHeader'
import { Avatar, ListItem, ScrollView, Text, YStack } from '@my/ui'
import { Pin } from '@tamagui/lucide-icons'
const CHAT_DATA = [
  {
    id: '1',
    name: 'My Documents',
    message: 'Bạn: [Hình ảnh]',
    time: '18 giờ',
    avatar: 'https://picsum.photos/100/100',
    pinned: true,
  },
  {
    id: '2',
    name: 'Hân (Gâu Gâu)',
    message: 'Để lên khoa hỏi có hk',
    time: '26/01',
    avatar: 'https://i.pravatar.cc/150?u=han',
    pinned: true,
  },
  {
    id: '3',
    name: 'Em ĐÀO 😊',
    message: '[Sticker]',
    time: 'CN',
    avatar: 'https://i.pravatar.cc/150?u=dao',
    pinned: true,
  },
]
export default function ChatMain() {
  const router = useRouter()
  return (
    <YStack flex={1}>
      <SearchHeader />
      <ScrollView>
        {CHAT_DATA.map((item) => (
          <ListItem
            key={item.id}
            pressTheme
            onPress={() => router.push(`/chat/${item.id}`)}
            title={item.name}
            subTitle={item.message}
            icon={
              <Avatar circular size="$5">
                <Avatar.Image src={item.avatar} />
              </Avatar>
            }
            // ... các thuộc tính khác giữ nguyên
          >
            <YStack alignItems="flex-end">
              <Text fontSize={12} color="$color10">
                {item.time}
              </Text>
              {item.pinned && <Pin size={12} rotate="45deg" />}
            </YStack>
          </ListItem>
        ))}
      </ScrollView>
    </YStack>
  )
}
