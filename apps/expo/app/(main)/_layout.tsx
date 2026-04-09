import { Tabs, usePathname } from 'expo-router'
import { MessageCircle, User, Users, Settings } from '@tamagui/lucide-icons'
import SearchHeader from '@my/ui/src/SearchHeader'
import { useTranslation } from 'react-i18next'
import ChatLayout from 'app/features/chat/ChatLayout'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function MainLayout() {
  const { t } = useTranslation()
  const pathname = usePathname()

  const isChatThreadScreen = /^\/chat\/[^/]+$/.test(pathname)
  const shouldShowSearchHeader =
    !isChatThreadScreen && (pathname === '/chat' || pathname.startsWith('/contacts'))

  return (
    // <ChatLayout>
    <Tabs
      screenOptions={{
        headerShown: shouldShowSearchHeader,
        header: shouldShowSearchHeader
          ? () => (
              <SafeAreaView edges={['top']}>
                <SearchHeader />
              </SafeAreaView>
            )
          : undefined,
        tabBarStyle: isChatThreadScreen ? { display: 'none' } : undefined,
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: t('chats'),
          tabBarIcon: ({ color, size }) => <MessageCircle color={color as any} size={size} />,
        }}
      />

      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Kết nối',
          tabBarIcon: ({ color, size }) => <Users color={color as any} size={size} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User color={color as any} size={size} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Settings color={color as any} size={size} />,
        }}
      />
    </Tabs>
    // </ChatLayout>
  )
}
