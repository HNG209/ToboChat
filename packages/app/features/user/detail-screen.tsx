'use client'

import { Avatar, Button, Image, Popover, Text, Theme, XStack, YStack } from '@my/ui'
import { ArrowLeft, Languages, MoreVertical, Sun } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

import { useGetProfileQuery } from '../../store/api'
// Su dung cho dang xuat
import { LogOut } from '@tamagui/lucide-icons'
import { ListItem, Separator } from '@my/ui'

import { useState } from 'react'
import { signOut } from 'aws-amplify/auth'
import { useAppTheme } from 'app/provider/ThemeContext'
import { useTranslation } from 'react-i18next'

export default function UserDetailScreen({ id }: { id?: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  // 1. Dùng light/dark đồng bộ với Context mới
  const { theme, setTheme } = useAppTheme()
  // id	          API gọi
  // undefined	  /users/me
  // "abc123"	    /users/abc123
  const { data } = useGetProfileQuery(id)

  const handleLogout = async () => {
    try {
      await signOut()
      setOpen(false)
      router.replace('/')
    } catch (err) {
      console.log('Logout error', err)
    }
  }

  // Chuyen doi ngon ngu

  const { t, i18n } = useTranslation()
  const toggleLanguage = () => {
    const currentLang = i18n.language || 'vi'
    const newLang = currentLang.includes('vi') ? 'en' : 'vi'
    console.log('Switching to:', newLang)
    i18n.changeLanguage(newLang)
  }
  return (
    <YStack flex={1} backgroundColor="$background">
      {/* COVER */}
      <YStack position="relative">
        <Image source={{ uri: 'https://picsum.photos/800/400' }} height={220} width="100%" />

        {/* HEADER ICONS */}
        <XStack
          position="absolute"
          top={40}
          left={0}
          right={0}
          paddingHorizontal="$4"
          justifyContent="space-between"
          alignItems="center"
        >
          <Button chromeless onPress={() => router.back()}>
            <ArrowLeft color="white" />
          </Button>

          {/* SỬ DỤNG POPOVER TẠI ĐÂY */}
          <Popover size="$5" allowFlip placement="bottom-end">
            <Popover.Trigger asChild>
              <Button chromeless icon={MoreVertical} color="white" />
            </Popover.Trigger>
            <Popover.Content elevate backgroundColor="$background" padding={0}>
              <YStack width={200} paddingVertical="$2">
                {/* Nút Đăng xuất */}
                <XStack
                  paddingHorizontal="$4"
                  height={48} // Ép chiều cao hàng cố định
                  alignItems="center" // Căn giữa theo chiều dọc
                  onPress={handleLogout}
                >
                  <YStack width={30} alignItems="center">
                    <LogOut size={20} color="$color" />
                  </YStack>
                  <Text
                    color="$color"
                    fontSize="$4"
                    lineHeight={20} // Ép độ cao dòng bằng đúng size icon
                    marginLeft="$2"
                  >
                    {t('logout')}
                  </Text>
                </XStack>

                <Separator marginVertical="$2" />

                {/* Nút Đổi Theme */}
                <XStack
                  paddingHorizontal="$4"
                  height={48}
                  alignItems="center"
                  onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  <YStack width={30} alignItems="center">
                    <Sun size={20} color="$color" />
                  </YStack>
                  <Text color="$color" fontSize="$4" lineHeight={20} marginLeft="$2">
                    {theme === 'light' ? t('darkMode') : t('lightMode')}
                  </Text>
                </XStack>
                <Separator marginVertical="$2" />
                {/* chuyen doi ngon ngu */}
                <XStack
                  paddingHorizontal="$4"
                  height={48}
                  alignItems="center"
                  onPress={toggleLanguage}
                >
                  <YStack width={30} alignItems="center">
                    <Languages size={20} color="$color" />
                  </YStack>
                  <Text color="$color" fontSize="$4" lineHeight={20} marginLeft="$2">
                    {i18n.language === 'vi' ? 'English' : 'Tieng Viet'}
                  </Text>
                </XStack>
                <Separator marginVertical="$2" />
                <Popover.Close asChild>
                  <XStack paddingHorizontal="$4" height={48}>
                    <Text
                      color="$color"
                      fontSize="$4"
                      lineHeight={30} // Ép độ cao dòng bằng đúng size icon
                      marginLeft="$2"
                    >
                      Hủy
                    </Text>
                  </XStack>
                </Popover.Close>
              </YStack>
            </Popover.Content>
          </Popover>
        </XStack>

        {/* AVATAR */}
        <Avatar
          size="$10"
          circular
          position="absolute"
          bottom={-50}
          left="50%"
          transform={[{ translateX: -50 }]}
          borderWidth={4}
          borderColor="white"
        >
          <Avatar.Image src="https://i.pravatar.cc/300" />
        </Avatar>
      </YStack>

      {/* INFO CARD */}
      <YStack
        marginTop={60}
        padding="$4"
        space="$3"
        alignItems="center"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Text fontSize="$8" fontWeight="700">
          {data?.result?.name ?? 'No name'}
        </Text>

        <Text fontSize="$4" color="$color10" textAlign="center">
          Sinh viên năm 4 · Yêu công nghệ · React Native 📱
        </Text>

        {/* ACTIONS */}
        <XStack space="$3" marginTop="$3">
          <Button size="$4" theme="active">
            Ket Ban
          </Button>

          <Button size="$4" variant="outlined">
            Nhan tin
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}
