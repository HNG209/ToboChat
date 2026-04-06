'use client'

import {
  Avatar,
  Button,
  DisableMFADialog,
  EnableMFADialog,
  FullSettingsDialog,
  Image,
  Popover,
  ProfileDialog,
  Text,
  Theme,
  Tooltip,
  XStack,
  YStack,
} from '@my/ui'
import { ArrowLeft, Languages, MoreVertical, Sun, User } from '@tamagui/lucide-icons'
import { usePathname, useRouter } from 'solito/navigation'

// Su dung cho dang xuat
import { LogOut } from '@tamagui/lucide-icons'
import { Separator } from '@my/ui'

import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { fetchMFAPreference, signOut } from 'aws-amplify/auth'
import { useAppTheme } from 'app/provider/ThemeContext'
import { useTranslation } from 'react-i18next'
import type { AppDispatch } from 'app/store'
import {
  useGetAvatarUploadUrlMutation,
  useGetProfileQuery,
  useUpdateMeMutation,
  userApi,
} from 'app/services/userApi'
import { uploadToPresignedUrl } from 'app/utils/uploadToPresignedUrl'
import {
  useConfirmMFAMutation,
  useDisableMFAMutation,
  useInitMFAMutation,
} from 'app/services/authApi'

export default function UserDetailScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  // 1. Dùng light/dark đồng bộ với Context mới
  const { theme, setTheme } = useAppTheme()
  // id	          API gọi
  // undefined	  /users/me
  // "abc123"	    /users/abc123
  const { data: userProfile, refetch } = useGetProfileQuery()
  const [avatarCacheKey, setAvatarCacheKey] = useState(0)
  const [optimisticAvatarUrl, setOptimisticAvatarUrl] = useState<string | undefined>(undefined)

  const withCacheBuster = (url?: string) => {
    if (!url || !avatarCacheKey) return url
    return `${url}${url.includes('?') ? '&' : '?'}v=${avatarCacheKey}`
  }

  // Chuyen doi ngon ngu

  const { t, i18n } = useTranslation()
  const toggleLanguage = () => {
    const currentLang = i18n.language || 'vi'
    const newLang = currentLang.includes('vi') ? 'en' : 'vi'
    i18n.changeLanguage(newLang)
  }

  // Phan xu li cho cai dat chung
  const { push } = useRouter()

  const isChat = pathname?.startsWith('/chat') && !pathname?.includes('/friend')
  const isFriend = pathname?.includes('/friend')
  const [initMFA] = useInitMFAMutation()
  const [confirmMFA] = useConfirmMFAMutation()

  const [openSignOut, setOpenSignOut] = useState(false)
  const [openSetting, setOpenSetting] = useState(false)

  const userId = userProfile?.id
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

  // Mo phan edit profile
  const [openProfile, setOpenProfile] = useState(false)
  //dung cho phan update
  const [updateMe] = useUpdateMeMutation()
  const [getAvatarUploadUrl] = useGetAvatarUploadUrlMutation()
  const handleGoToUser = () => {
    push(`/user/me`)
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

  const profileDataForDialog =
    optimisticAvatarUrl && userProfile
      ? { ...userProfile, avatarUrl: optimisticAvatarUrl }
      : userProfile
  const handleSave = async (data: { name?: string; avatar?: File; dateOfBirth?: string }) => {
    try {
      const { name, avatar, dateOfBirth } = data

      const shouldUpdateProfile = Boolean(name) || Boolean(dateOfBirth)
      if (shouldUpdateProfile) {
        await updateMe({ name, dob: dateOfBirth }).unwrap()
      }

      if (avatar) {
        const contentType = avatar.type || 'application/octet-stream'
        console.log('[avatar] requesting presigned url', { contentType })
        const resp = await getAvatarUploadUrl({ contentType }).unwrap()
        const presignedUrl =
          typeof (resp as any)?.presignedUrl === 'string'
            ? (resp as any).presignedUrl
            : typeof (resp as any)?.url === 'string'
              ? (resp as any).url
              : undefined

        const derivedFileUrl =
          typeof presignedUrl === 'string'
            ? (() => {
                try {
                  const u = new URL(presignedUrl)
                  return `${u.origin}${u.pathname}`
                } catch {
                  return presignedUrl.split('?')[0]
                }
              })()
            : undefined

        const fileUrl =
          typeof (resp as any)?.fileUrl === 'string' ? (resp as any).fileUrl : derivedFileUrl

        if (typeof presignedUrl !== 'string' || typeof fileUrl !== 'string') {
          throw new Error(
            `Invalid upload-url response. Expected { presignedUrl, fileUrl } or { url }, got: ${JSON.stringify(resp)}`
          )
        }

        console.log('[avatar] uploading to S3', { fileUrl })
        await uploadToPresignedUrl({ presignedUrl, file: avatar, contentType })

        // Bust image cache so UI picks up the new avatar immediately
        const cacheKey = Date.now()
        setAvatarCacheKey(cacheKey)
        setOptimisticAvatarUrl(fileUrl)
        dispatch(
          userApi.util.updateQueryData('getProfile', undefined, (draft: any) => {
            if (draft) draft.avatarUrl = fileUrl
          })
        )
      }

      await refetch() // 👈 force reload
      console.log('Update success')
    } catch (err) {
      const details =
        err instanceof Error
          ? err.message
          : typeof err === 'object'
            ? JSON.stringify(err)
            : String(err)
      console.warn('Update profile/avatar failed:', details)
    }
  }
  // xac dinh trang thai MFA
  const checkMFA = async () => {
    try {
      const mfa = await fetchMFAPreference()

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
      setOpenSetting(false)
      router.replace('/login') // dùng replace để không back lại được
    } catch (err) {
      console.log('Logout error', err)
    }
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
          <Popover
            size="$5"
            allowFlip
            placement="bottom-end"
            open={openSetting}
            onOpenChange={setOpenSetting}
          >
            <Popover.Trigger asChild>
              <Button
                chromeless
                icon={MoreVertical}
                color="white"
                onPress={() => setOpenSetting(true)}
              />
            </Popover.Trigger>
            <Popover.Content elevate backgroundColor="$background" padding={0}>
              <YStack width={200} paddingVertical="$2">
                {/* thong tin ca nhan */}
                <Tooltip delay={0} placement="right">
                  <Tooltip.Trigger asChild>
                    <XStack
                      paddingHorizontal="$4"
                      height={48}
                      alignItems="center"
                      onPress={() => {
                        setOpenSetting(false)
                        setOpenProfile(true)
                      }}
                    >
                      <YStack width={30} alignItems="center">
                        <User size={20} color="$color" />
                      </YStack>

                      <Text color="$color" fontSize="$4" lineHeight={20} marginLeft="$2">
                        {t('informationAccount')}
                      </Text>
                    </XStack>
                  </Tooltip.Trigger>
                </Tooltip>
                <Separator marginVertical="$2" />
                {/* Nút Đổi Theme */}
                <XStack
                  key="theme"
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
                  key="language"
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

                {/* Cai dat chung */}
                <XStack
                  key="fullSetting"
                  paddingHorizontal="$4"
                  height={48}
                  alignItems="center"
                  onPress={() => {
                    setOpenSetting(false) // Đóng cái popover nhỏ
                    setShowFullSettings(true) // Mở cái khung cài đặt lớn
                  }}
                >
                  <YStack width={30} alignItems="center">
                    <Languages size={20} color="$color" />
                  </YStack>
                  <Text color="$color" fontSize="$4" lineHeight={20} marginLeft="$2">
                    {t('settings')}
                  </Text>
                </XStack>
                <Separator marginVertical="$2" />
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
          <Avatar.Image
            key={
              withCacheBuster(optimisticAvatarUrl ?? userProfile?.avatarUrl) ||
              optimisticAvatarUrl ||
              userProfile?.avatarUrl ||
              'avatar'
            }
            src={
              withCacheBuster(optimisticAvatarUrl ?? userProfile?.avatarUrl) ||
              'https://i.pravatar.cc/300'
            }
          />
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
          {userProfile?.name ?? 'No name'}
        </Text>

        <Text fontSize="$4" color="$color10" textAlign="center">
          Sinh viên năm 4 · Yêu công nghệ · React Native 📱
        </Text>

        {/* ACTIONS */}
        <XStack space="$3" marginTop="$3">
          <Button size="$4" backgroundColor="$blue10" color="white">
            Ket Ban
          </Button>

          <Button size="$4" variant="outlined">
            Nhan tin
          </Button>
        </XStack>
      </YStack>
      <FullSettingsDialog
        showFullSettings={showFullSettings}
        setShowFullSettings={setShowFullSettings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTwoFactorAuth={isTwoFactorAuth}
        handleToggleMFA={handleToggleMFA}
        theme={theme}
        onThemeChange={(nextTheme) => setTheme(nextTheme)}
        language={i18n.language || 'vi'}
        onToggleLanguage={toggleLanguage}
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
      {/* Phan mo cai dat cho cho chinh account */}
      <ProfileDialog
        onSave={handleSave}
        open={openProfile}
        onOpenChange={setOpenProfile}
        profileData={profileDataForDialog}
        avatarCacheKey={avatarCacheKey}
      />
    </YStack>
  )
}
