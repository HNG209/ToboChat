import { YStack, Button, XStack, Text, Circle } from '@my/ui'
import { useRouter, usePathname } from 'solito/navigation'
import { UserResponse } from 'app/types/Response'
import {
  useGetProfileQuery
} from 'app/services/userApi'

export default function FriendMenu() {
  const router = useRouter()
  const pathname = usePathname()

  const { data: profileData, refetch } = useGetProfileQuery()

  const menuItems = [
    { label: 'Danh sách bạn bè', path: '/contacts/friends' },
    { label: 'Danh sách nhóm', path: '/contacts/groups' },
    { label: 'Lời mời kết bạn', path: '/contacts/friend-requests', badge: profileData?.friendRequestCount },
    { label: 'Lời mời vào nhóm', path: '/contacts/group-requests', badge: profileData?.groupRequestCount },
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
          <XStack flex={1} alignItems="center" justifyContent="space-between" width="100%">
            <Text fontSize={15}>{item.label}</Text>
            
            {(item.badge !== undefined && item.badge > 0) && (
              <Circle 
                size={22} 
                backgroundColor="$red10" 
                animation="bouncy" 
                enterStyle={{ scale: 0 }}
              >
                <Text color="white" fontSize={11} fontWeight="700">
                  {item.badge > 99 ? '99+' : item.badge}
                </Text>
              </Circle>
            )}
          </XStack>
        </Button>
      ))}
    </YStack>
  )
}