import { useRouter } from 'solito/navigation'
import { Avatar, ListItem, ScrollView, Text, View, YStack } from '@my/ui'
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
export default function ChatInbox() {
  const router = useRouter()

  return (
    <ScrollView backgroundColor="$color2">
      {CHAT_DATA.map((item) => (
        <ListItem
          key={item.id}
          pressTheme
          // Phan chinh mau cho mau nen
          backgroundColor="$color3"
          onPress={() => router.push(`/chat/${item.id}`)}
          hoverStyle={{ background: '$gray3' }} // Hiệu ứng khi di chuột qua
          paddingVertical="$3"
          paddingHorizontal="$4"
          // Phần Tiêu đề (Tên người dùng)
          title={
            <Text fontWeight="600" fontSize={15} color="$gray12">
              {item.name}
            </Text>
          }
          // Phần Nội dung tin nhắn (Subtitle)
          subTitle={
            <Text fontSize={13} color="$gray10" numberOfLines={1} marginTop={2}>
              {item.message}
            </Text>
          }
          // Avatar
          icon={
            <Avatar circular size="$5">
              <Avatar.Image src={item.avatar} />
            </Avatar>
          }
        >
          {/* Phần thời gian và ghim bên phải */}
          <YStack space="$1" alignItems="flex-end" justifyContent="center">
            <Text fontSize={11} color="$gray9">
              {item.time}
            </Text>
            {item.pinned ? (
              <Pin size={12} color="$gray8" rotate="45deg" fill="currentColor" />
            ) : (
              <View height={12} /> // Giữ chỗ để layout không bị nhảy
            )}
          </YStack>
        </ListItem>
      ))}
    </ScrollView>
  )
}
