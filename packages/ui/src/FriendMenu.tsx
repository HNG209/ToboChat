import { YStack, Button } from '@my/ui'
import { useRouter, usePathname } from 'solito/navigation'

export default function FriendMenu() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { label: 'Danh sách bạn bè', path: '/contacts/friends' },
    { label: 'Danh sách nhóm', path: '/contacts/groups' },
    { label: 'Lời mời kết bạn', path: '/contacts/friend-requests' },
    { label: 'Lời mời vào nhóm', path: '/contacts/group-requests' },
  ]

  return (
    <YStack padding="$3" space="$3">
      {menuItems.map((item) => (
        <Button
          key={item.path}
          justifyContent="flex-start"
          backgroundColor="$color2"
          hoverStyle={{backgroundColor: "$color4"}}
          theme={pathname === item.path ? 'blue' : undefined}
          onPress={() => router.push(item.path)} // Chuyển URL ở đây
        >
          {item.label}
        </Button>
      ))}
    </YStack>
  )
}