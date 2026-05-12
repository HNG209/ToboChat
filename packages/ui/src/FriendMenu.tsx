import { YStack, Button, XStack, Text, Circle } from '@my/ui'
import { useRouter, usePathname } from 'solito/navigation'
import { UserResponse } from 'app/types/Response'
import {
  useGetProfileQuery
} from 'app/services/userApi'

// Icon imports
import { Users, UserPlus, Users2, MailPlus } from '@tamagui/lucide-icons'

const menuIcons = [
  Users,      // Danh sách bạn bè
  Users2,     // Danh sách nhóm
  UserPlus,   // Lời mời kết bạn
  MailPlus,   // Lời mời vào nhóm
]

export default function FriendMenu() {
  const router = useRouter()
  const pathname = usePathname()

  const { data: profileData } = useGetProfileQuery()

  const menuItems = [
    { label: 'Danh sách bạn bè', path: '/contacts/friends' },
    { label: 'Danh sách nhóm', path: '/contacts/groups' },
    { label: 'Lời mời kết bạn', path: '/contacts/friend-requests', badge: profileData?.friendRequestCount },
    { label: 'Lời mời vào nhóm', path: '/contacts/group-requests', badge: profileData?.groupRequestCount },
  ]

  return (
    <YStack padding="$3" space="$3">
      {menuItems.map((item, idx) => {
        const Icon = menuIcons[idx]
        const isActive = pathname === item.path
        return (
          <Button
            key={item.path}
            justifyContent="flex-start"
            backgroundColor={isActive ? "$blue2" : "$color2"}
            hoverStyle={{ backgroundColor: isActive ? "$blue4" : "$color4" }}
            borderRadius={12}
            shadowColor="#000"
            shadowOpacity={isActive ? 0.10 : 0.04}
            shadowRadius={isActive ? 8 : 4}
            theme={isActive ? 'blue' : undefined}
            onPress={() => router.push(item.path)}
            minHeight={48}
            paddingHorizontal={16}
            paddingVertical={10}
            marginBottom={2}
            alignItems="center"
            gap={12}
            pressStyle={{ scale: 0.97 }}
            transition="all 0.15s"
          >
            <XStack flex={1} alignItems="center" justifyContent="space-between" width="100%">
              <XStack alignItems="center" gap={12}>
                <Icon color={isActive ? "#1976d2" : "#888"} size={22} />
                <Text fontSize={15} fontWeight={isActive ? "700" : "500"} color={isActive ? "$blue10" : "$color12"}>
                  {item.label}
                </Text>
              </XStack>
              {(item.badge !== undefined && item.badge > 0) && (
                <Circle
                  size={22}
                  backgroundColor="$red10"
                  animation="bouncy"
                  enterStyle={{ scale: 0 }}
                  borderWidth={2}
                  borderColor={isActive ? "$blue2" : "$color2"}
                  shadowColor="#000"
                  shadowOpacity={0.10}
                  shadowRadius={6}
                >
                  <Text color="white" fontSize={11} fontWeight="700">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </Circle>
              )}
            </XStack>
          </Button>
        )
      })}
    </YStack>
  )
}