import { Tabs } from 'expo-router'
import { MessageCircle, User,List } from '@tamagui/lucide-icons'

export default function MainLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {/* <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      /> */}

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Tin nhắn',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tôi',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="friend"
        options={{
          title: 'Bạn bè',
          tabBarIcon: ({ color, size }) => <List color={color} size={size},
        }}
      />
    </Tabs>
  )
}
