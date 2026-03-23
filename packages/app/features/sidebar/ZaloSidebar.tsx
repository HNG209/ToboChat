"use client"

import { Dialog, Switch, Text, Theme, XStack } from '@my/ui'
import { Button, Image, ListItem, Popover, Spacer, View, YStack } from '@my/ui'
import {
  Contact2,
  Languages,
  LogOut,
  MessageSquare,
  Settings,
  Sun,
  User,
  X,
} from '@tamagui/lucide-icons'
import { signOut } from 'aws-amplify/auth'
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'solito/navigation'
import { useTranslation } from 'react-i18next'
import { FullSettingsDialog, EnableMFADialog, DisableMFADialog } from '@my/ui'
import { useAppTheme } from '../../provider/ThemeContext'
import { fetchMFAPreference } from 'aws-amplify/auth'
import { useConfirmMFAMutation, useDisableMFAMutation, useInitMFAMutation } from 'app/store/api'
import { useGetProfileQuery } from 'app/store/api'
export const ZaloSidebar = () => {
  const { push } = useRouter()
  const router = useRouter()
  const pathname = usePathname()

  const isChat = pathname?.startsWith('/chat') && !pathname?.includes('/contacts')
  const isFriend = pathname?.includes('/friends')
  const [initMFA] = useInitMFAMutation()
  const [confirmMFA] = useConfirmMFAMutation()

  const [openSignOut, setOpenSignOut] = useState(false)
  const [openSetting, setOpenSetting] = useState(false)

  const { data: profileData } = useGetProfileQuery()
  const userId = profileData?.result?.pk?.replace('USER#', '')
  // Mo full phan cai dat
  const [showFullSettings, setShowFullSettings] = useState(false)
  const [activeTab, setActiveTab] = React.useState<'general' | 'security' | null>(null)

  // Su dung cho phan bac xac thuc
  const [isTwoFactorAuth, setIsTwoFactorAuth] = useState(false) // Mặc định là dang tat
  const [openEnableMFA, setOpenEnableMFA] = useState(false)
  const [password, setPassword] = useState('')
  const [secretCode, setSecretCode] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')

  // Tat phan MFA
  const [disableMFAApi] = useDisableMFAMutation()
  const [isDisabling, setIsDisabling] = useState(false)
  const [openDisableMFA, setOpenDisableMFA] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')

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

  useEffect(() => {
    if (showFullSettings && activeTab === 'security') {
      checkMFA()
    }
  }, [showFullSettings, activeTab])

  const openEnableMFADialog = () => {
    setPassword('')
    setSecretCode(null)
    setOtpCode('')
    setOpenEnableMFA(true)
  }

  const handleSubmitPassword = async () => {
    try {
      const res = await initMFA({
        userId: userId!,
        password,
      }).unwrap()

      setSecretCode(res.secret)
    } catch (err) {
      console.error('Sai mật khẩu', err)
    }
  }

  // Ham kiem tra ma OTP
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerifyOTP = async () => {
    if (isVerifying) return

    try {
      setIsVerifying(true)

      await confirmMFA({
        userId: userId!,
        otp: otpCode,
      }).unwrap()

      setIsTwoFactorAuth(true)
      setOpenEnableMFA(false)
      setSecretCode(null)
      setPassword('')
      setOtpCode('')
    } catch (err) {
      console.error('OTP sai', err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisableMFA = async () => {
    if (isDisabling) return

    try {
      setIsDisabling(true)

      await disableMFAApi({
        userId: userId!,
        password: disablePassword,
      }).unwrap()

      // cập nhật UI
      setIsTwoFactorAuth(false)

      // reset state
      setOpenDisableMFA(false)
      setDisablePassword('')
    } catch (err) {
      console.error('Disable MFA failed', err)
    } finally {
      setIsDisabling(false)
    }
  }

  const handleToggleMFA = async (val: boolean) => {
    // Nếu bật MFA
    if (val) {
      openEnableMFADialog()
      return
    }

    setOpenDisableMFA(true)
  }

  // xac dinh trang thai MFA
  const checkMFA = async () => {
    try {
      const mfa = await fetchMFAPreference()

      console.log('MFA preference:', mfa)
      const enabled = mfa?.enabled ?? []
      /*
      mfa sẽ trả về dạng:
      {
        enabled: ['SMS', 'TOTP'],
        preferred: 'TOTP'
      }
    */

      if (enabled.length > 0) {
        setIsTwoFactorAuth(true)
      } else {
        setIsTwoFactorAuth(false)
      }
    } catch (err) {
      console.error(err)
    }
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

  const handleGoToFriend = () => {
    push('/contacts')
  }
  const handleGoToChat = () => {
    push('/chat')
  }
  return (
    <>
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
          size="$4"
          borderRadius={0}
          paddingVertical={30}
          title={t('messages')}
          backgroundColor={isChat ? '#005ae0' : 'transparent'}
          icon={<MessageSquare size={24} color="$color" />}
          onPress={handleGoToChat}
        />
        <Button
          size="$4"
          borderRadius={0}
          title={t('contacts')}
          paddingVertical={30}
          backgroundColor={isFriend ? '#005ae0' : 'transparent'}
          icon={<Contact2 size={24} color="$color" />}
          onPress={() => handleGoToFriend()}
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
                  {/* Phan cai dat */}
                  <Popover.Close asChild>
                    <ListItem
                      pressTheme
                      icon={Settings}
                      title={t('settings')}
                      onPress={() => {
                        setOpenSetting(false) // Đóng cái popover nhỏ
                        setShowFullSettings(true) // Mở cái khung cài đặt lớn
                      }}
                    />
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
      {/* Phan mo full cai dat */}
      <FullSettingsDialog
        showFullSettings={showFullSettings}
        setShowFullSettings={setShowFullSettings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTwoFactorAuth={isTwoFactorAuth}
        handleToggleMFA={handleToggleMFA}
      />
      <EnableMFADialog
        openEnableMFA={openEnableMFA}
        setOpenEnableMFA={setOpenEnableMFA}
        isTwoFactorAuth={isTwoFactorAuth}
        secretCode={secretCode}
        password={password}
        otpCode={otpCode}
        setPassword={setPassword}
        setOtpCode={setOtpCode}
        setSecretCode={setSecretCode}
        handleSubmitPassword={handleSubmitPassword}
        handleVerifyOTP={handleVerifyOTP}
      />
      <DisableMFADialog
        openDisableMFA={openDisableMFA}
        setOpenDisableMFA={setOpenDisableMFA}
        disablePassword={disablePassword}
        setDisablePassword={setDisablePassword}
        handleDisableMFA={handleDisableMFA}
        isDisabling={isDisabling}
        setIsTwoFactorAuth={setIsTwoFactorAuth}
      />
    </>
  )
}
