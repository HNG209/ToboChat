'use client'
import { Avatar, Button, ListItem, Popover, Spacer, YStack } from '@my/ui'
import { Contact2, LogOut, MessageSquare, Settings, User } from '@tamagui/lucide-icons'

import { signOut } from 'aws-amplify/auth'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { usePathname, useRouter } from 'solito/navigation'
import { useTranslation } from 'react-i18next'
import { FullSettingsDialog, EnableMFADialog, DisableMFADialog, ProfileDialog } from '@my/ui'
import { useAppTheme } from '../../provider/ThemeContext'
import { fetchMFAPreference } from 'aws-amplify/auth'
import type { AppDispatch } from 'app/store'
import {
  useConfirmMFAMutation,
  useDisableMFAMutation,
  useInitMFAMutation,
} from 'app/services/authApi'
import {
  useGetAvatarUploadUrlMutation,
  useGetProfileQuery,
  useUpdateMeMutation,
  userApi,
} from 'app/services/userApi'
import { uploadToPresignedUrl } from 'app/utils/uploadToPresignedUrl'

export const ZaloSidebar = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { push } = useRouter()
  const router = useRouter()
  const pathname = usePathname()

  const isChat = pathname?.startsWith('/chat')
  const isContacts = pathname?.startsWith('/contacts')
  const [initMFA] = useInitMFAMutation()
  const [confirmMFA] = useConfirmMFAMutation()

  const [openSignOut, setOpenSignOut] = useState(false)

  const { data: profileData, refetch } = useGetProfileQuery()
  const userId = profileData?.id
  // Mo full phan cai dat
  const [showFullSettings, setShowFullSettings] = useState(false)
  const [activeTab, setActiveTab] = React.useState<'general' | 'security' | null>(null)
  // Mo phan edit profile
  const [openProfile, setOpenProfile] = useState(false)

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

  //dung cho phan update
  const [updateMe] = useUpdateMeMutation()
  const [getAvatarUploadUrl] = useGetAvatarUploadUrlMutation()
  const [avatarCacheKey, setAvatarCacheKey] = useState(0)
  const [optimisticAvatarUrl, setOptimisticAvatarUrl] = useState<string | undefined>(undefined)

  const withCacheBuster = (url?: string) => {
    if (!url || !avatarCacheKey) return url
    return `${url}${url.includes('?') ? '&' : '?'}v=${avatarCacheKey}`
  }
  const handleSave = async (data: { name?: string; avatar?: File; dateOfBirth?: string }) => {
    try {
      const { name, avatar, dateOfBirth } = data

      const shouldUpdateProfile = Boolean(name) || Boolean(dateOfBirth)
      if (shouldUpdateProfile) {
        await updateMe({ name, dob: dateOfBirth }).unwrap()
      }

      if (avatar) {
        const confirmed = window.confirm('Xác nhận tải ảnh lên?')
        if (!confirmed) {
          console.log('Upload canceled')
        } else {
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
      }

      await refetch()
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

  const profileDataForDialog =
    optimisticAvatarUrl && profileData
      ? { ...profileData, avatarUrl: optimisticAvatarUrl }
      : profileData

  const activeNavBackground = theme === 'dark' ? '$blue11' : '$blue10'
  const inactiveIconColor = '$color'
  const activeIconColor = 'white'
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

        <YStack
          borderRadius={999}
          backgroundColor="$background"
          padding="$1"
          borderWidth={1}
          borderColor="$borderColor"
          elevation="$4"
          shadowColor="$shadowColor"
          shadowOpacity={0.14}
          shadowRadius={10}
          shadowOffset={{ width: 0, height: 4 }}
        >
          <Avatar circular size="$5">
            <Avatar.Image
              key={
                withCacheBuster(optimisticAvatarUrl ?? profileData?.avatarUrl) ||
                optimisticAvatarUrl ||
                profileData?.avatarUrl ||
                'avatar'
              }
              src={
                withCacheBuster(optimisticAvatarUrl ?? profileData?.avatarUrl) ||
                `https://ui-avatars.com/api/?name=${profileData?.name}&background=random`
              }
            />
            <Avatar.Fallback />
          </Avatar>
        </YStack>

        {/* Nav icons (match bottom layout) */}
        <YStack space="$2" alignItems="center" marginTop="$4">
          <Button
            aria-label={t('messages')}
            borderRadius="$4"
            padding="$3"
            backgroundColor={isChat ? activeNavBackground : 'transparent'}
            onPress={handleGoToChat}
            icon={<MessageSquare size={28} color={isChat ? activeIconColor : inactiveIconColor} />}
          />

          <Button
            aria-label={t('contacts')}
            borderRadius="$4"
            padding="$3"
            backgroundColor={isContacts ? activeNavBackground : 'transparent'}
            onPress={handleGoToFriend}
            icon={<Contact2 size={28} color={isContacts ? activeIconColor : inactiveIconColor} />}
          />
        </YStack>
        <Spacer flex={1} />

        <YStack space="$2" alignItems="center" paddingBottom="$4">
          <Button
            aria-label={t('informationAccount')}
            backgroundColor="transparent"
            onPress={() => setOpenProfile(true)}
            icon={<User size={28} color="$color" />}
          />

          <Button
            aria-label={t('settings')}
            backgroundColor="transparent"
            icon={<Settings size={28} color="$color" />}
            onPress={() => {
              setActiveTab('general')
              setShowFullSettings(true)
            }}
          />
          <Popover open={openSignOut} onOpenChange={setOpenSignOut} placement="right">
            <Popover.Trigger asChild>
              <Button
                aria-label={t('logout')}
                backgroundColor="transparent"
                icon={<LogOut size={28} color="$color" />}
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
      {/* Phan mo cai dat cho cho chinh account */}
      <ProfileDialog
        onSave={handleSave}
        open={openProfile}
        onOpenChange={setOpenProfile}
        profileData={profileDataForDialog}
        avatarCacheKey={avatarCacheKey}
      />

      {/* Phan mo full cai dat */}
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
    </>
  )
}
