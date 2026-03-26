import { Tabs } from 'expo-router'
import { MessageCircle, User, List } from '@tamagui/lucide-icons'
import SearchHeader from '@my/ui/src/SearchHeader'
import { useTranslation } from 'react-i18next'
import ChatLayout from 'app/features/chat/ChatLayout'

export default function MainLayout() {
  const { t } = useTranslation()
  return (
    <ChatLayout>
      <Tabs
        screenOptions={{
          header: () => <SearchHeader />,
        }}
      >
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
            title: t('chats'),
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile'),
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="friend"
          options={{
            title: t('friends'),
            tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="test"
          options={{
            title: 'Test',
            tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
          }}
        />
      </Tabs>
    </ChatLayout>
  )
}
