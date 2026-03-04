import { Text, Theme } from '@my/ui'
import { Button, Image, ListItem, Popover, Spacer, View, YStack } from '@my/ui'
import {
  Contact2,
  Languages,
  LogOut,
  MessageSquare,
  Settings,
  Sun,
  User,
} from '@tamagui/lucide-icons'
import { signOut } from 'aws-amplify/auth'
import { useState } from 'react'
import { useRouter } from 'solito/navigation'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '../../provider/ThemeContext'
export const ZaloSidebar = () => {
  const { push } = useRouter()
  const router = useRouter()
  const [openSignOut, setOpenSignOut] = useState(false)
  const [openSetting, setOpenSetting] = useState(false)
  // 1. Dùng light/dark đồng bộ với Context mới
  const { theme, setTheme } = useAppTheme()
  const handleGoToUser = () => {
    push(`/user/me`)
  }

  // Phan chuyen doi ngon ngu
  const { t, i18n } = useTranslation()
  const toggleLanguage = () => {
    const currentLang = i18n.language || 'vi'
    const newLang = currentLang.includes('vi') ? 'en' : 'vi'
    console.log('Switching to:', newLang)
    i18n.changeLanguage(newLang)
  }
  // ham dang xuat
  const handleLogout = async () => {
    try {
      await signOut()
      setOpenSignOut(false)
      router.replace('/') // dùng replace để không back lại được
    } catch (err) {
      console.log('Logout error', err)
    }
  }
  return (
    <YStack
      width={64}
      height="100vh"
      backgroundColor="$background" // Màu xanh đặc trưng của Zalo
      alignItems="center"
      paddingVertical="$4"
    >
      {/* Avatar */}

      <View
        width={45}
        height={45}
        borderRadius={100}
        borderWidth={1}
        borderColor="$color"
        overflow="hidden"
      >
        <Image source={{ uri: 'https://your-avatar-link.png', width: 45, height: 45 }} />
      </View>

      {/* Icon Tin nhan */}

      <Button
        marginTop={20}
        size="$5"
        title={t('messages')}
        backgroundColor="#005ae0" // Màu xanh đậm hơn khi được chọn
        icon={<MessageSquare size={24} color="$color" />}
        borderRadius={0} // Zalo thường dùng dạng khối vuông cho item đang chọn
      />
      <Button
        size="$5"
        backgroundColor="transparent"
        icon={<Contact2 size={24} color="$color" />}
      />
      <Spacer flex={1} />

      <YStack space="$2" alignItems="center" paddingBottom="$4">
        <Button
          title={t('profile')}
          backgroundColor="transparent"
          onPress={() => handleGoToUser()}
          icon={<User size={24} color="$color" />}
        />
        {/* Cai dat phan chuyen mau cho phan setting */}
        <Popover open={openSetting} onOpenChange={setOpenSetting} placement="right">
          <Popover.Trigger asChild>
            <Button
              title={t('settings')}
              backgroundColor="transparent"
              icon={<Settings size={24} color="$color" />}
            />
          </Popover.Trigger>
          <Theme name={theme}>
            <Popover.Content elevate backgroundColor="$background">
              <YStack width={160}>
                <Popover.Close asChild>
                  <ListItem
                    pressTheme
                    icon={Sun}
                    title={theme === 'light' ? t('darkMode') : t('lightMode')}
                    onPress={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                  />
                </Popover.Close>
                {/* nut chuyen doi ngon ngu */}
                <Popover.Close asChild>
                  <ListItem
                    pressTheme
                    icon={Languages}
                    title={i18n.language === 'vi' ? 'English' : 'Tieng Viet'}
                    onPress={toggleLanguage}
                  ></ListItem>
                </Popover.Close>
              </YStack>
            </Popover.Content>
          </Theme>
        </Popover>
        <Popover open={openSignOut} onOpenChange={setOpenSignOut} placement="right">
          <Popover.Trigger asChild>
            <Button
              title={t('logout')}
              backgroundColor="transparent"
              icon={<LogOut size={24} color="$color" />}
            />
          </Popover.Trigger>

          <Popover.Content elevate>
            <YStack width={160}>
              <Popover.Close asChild>
                <ListItem pressTheme icon={LogOut} title={t('logout')} onPress={handleLogout} />
              </Popover.Close>
            </YStack>
          </Popover.Content>
        </Popover>
      </YStack>
    </YStack>
  )
}
