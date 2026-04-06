import { Languages, LogOut, Moon, Sun } from '@tamagui/lucide-icons'
import { ListItem, Separator, Text, XStack, YStack } from '@my/ui'
import { useAppTheme } from 'app/provider/ThemeContext'
import { signOut } from 'aws-amplify/auth'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'solito/navigation'

export default function SettingsScreen() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useAppTheme()

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'vi'
    const newLang = currentLang.includes('vi') ? 'en' : 'vi'
    i18n.changeLanguage(newLang)
  }

  const handleLogout = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" space="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$7" fontWeight="700">
          {t('settings')}
        </Text>
      </XStack>

      <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$6" overflow="hidden">
        <ListItem
          pressTheme
          icon={theme === 'light' ? Moon : Sun}
          title={theme === 'light' ? t('darkMode') : t('lightMode')}
          onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />
        <Separator />
        <ListItem
          pressTheme
          icon={Languages}
          title={i18n.language?.includes('vi') ? 'English' : 'Tiếng Việt'}
          onPress={toggleLanguage}
        />
        <Separator />
        <ListItem pressTheme icon={LogOut} title={t('logout')} onPress={handleLogout} />
      </YStack>
    </YStack>
  )
}
