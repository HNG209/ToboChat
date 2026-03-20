import { YStack, Button } from '@my/ui'
import { useRouter, usePathname } from 'solito/navigation'

export default function FriendMenu() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { label: 'Danh sách bạn bè', path: '/contact/friends' },
    { label: 'Danh sách nhóm', path: '/contact/groups' },
    { label: 'Lời mời kết bạn', path: '/contact/friend-requests' },
    { label: 'Lời mời vào nhóm', path: '/contact/group-requests' },
  ]

  return (
    <YStack padding="$3" space="$3">
      {menuItems.map((item) => (
        <Button
          key={item.path}
          justifyContent="flex-start"
          theme={pathname === item.path ? 'blue' : undefined}
          onPress={() => router.push(item.path)} // Chuyển URL ở đây
        >
          {item.label}
        </Button>
      ))}
    </YStack>
  )
}