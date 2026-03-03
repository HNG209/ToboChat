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
import { useRouter } from 'solito/navigation'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '../../provider/ThemeContext'
import { fetchMFAPreference } from 'aws-amplify/auth'
import { useConfirmMFAMutation, useInitMFAMutation } from 'app/store/api'
import { useGetProfileQuery } from 'app/store/api'
export const ZaloSidebar = () => {
  const { push } = useRouter()
  const router = useRouter()

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
        userId,
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

  const disableMFA = async () => {
    console.log('Disable MFA chưa implement')
  }

  const handleToggleMFA = async (val: boolean) => {
    // Nếu bật MFA
    if (val) {
      openEnableMFADialog()
      return
    }

    // Nếu tắt MFA → Optimistic update
    const prev = isTwoFactorAuth
    setIsTwoFactorAuth(false)

    try {
      await disableMFA()
    } catch (err) {
      console.error('Disable MFA failed', err)
      // rollback nếu lỗi
      setIsTwoFactorAuth(prev)
    }
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
      <Dialog
        key="settings-dialog"
        modal
        open={showFullSettings}
        onOpenChange={setShowFullSettings}
      >
        <Dialog.Portal>
          <Dialog.Overlay
            key="settings-overlay"
            animation="quick"
            opacity={0.5}
            backgroundColor="#000"
            zIndex={100000} // Ép số thật lớn để chặn mọi cú click
          />

          <Dialog.Content
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            bordered
            elevate
            animation="quick"
            width={800}
            height={600}
            padding={0}
            overflow="hidden"
            backgroundColor="$background"
            $sm={{
              width: '80vw',
              height: '80vh',
              borderRadius: 0,
            }}
          >
            <XStack height="100%">
              {/* ===== LEFT MENU ===== */}
              <YStack
                width={250}
                flexShrink={0}
                backgroundColor="$background"
                padding="$4"
                borderRightWidth={1}
                borderColor="$borderColor"
                $sm={{
                  width: '100%',
                  height: '100%',
                  display: activeTab ? 'none' : 'flex',
                }}
              >
                <Text fontSize={18} fontWeight="bold" mb="$4">
                  Cài đặt
                </Text>

                <ListItem
                  title="Cài đặt chung"
                  hoverStyle={{ backgroundColor: '$backgroundHover', cursor: 'pointer' }}
                  onPress={() => setActiveTab('general')}
                />

                <ListItem
                  title="Tài khoản & bảo mật"
                  hoverStyle={{ backgroundColor: '$backgroundHover', cursor: 'pointer' }}
                  onPress={() => setActiveTab('security')}
                />
              </YStack>
              <Dialog.Close asChild>
                <Button
                  position="absolute"
                  top="$3"
                  right="$3"
                  zIndex={1000} // Đảm bảo nằm trên các thành phần khác
                  size="$3"
                  circular
                  icon={X} // Icon X từ lucide-icons bạn đã import
                  backgroundColor="transparent"
                  hoverStyle={{ backgroundColor: '$backgroundHover' }}
                  pressStyle={{ opacity: 0.5 }}
                  borderWidth={0}
                />
              </Dialog.Close>

              {/* ===== RIGHT CONTENT ===== */}
              <YStack
                flex={1}
                padding="$5"
                $sm={{
                  display: activeTab ? 'flex' : 'none',
                  width: '100%',
                }}
              >
                {/* MOBILE BACK BUTTON */}
                <XStack display="none" alignItems="center" mb="$4" $sm={{ display: 'flex' }}>
                  <Button size="$2" onPress={() => setActiveTab(null)}>
                    ← Quay lại
                  </Button>
                </XStack>

                {activeTab === 'general' && (
                  <>
                    <Text fontSize={18} fontWeight="bold">
                      Cài đặt chung
                    </Text>
                  </>
                )}

                {activeTab === 'security' && (
                  <>
                    {/* Section: Bảo mật 2 lớp (Phần bạn yêu cầu) */}
                    <YStack space="$3">
                      <Text fontWeight="bold">Bảo mật 2 lớp</Text>

                      <XStack
                        backgroundColor="$backgroundHover"
                        padding="$4"
                        borderRadius="$4"
                        jc="space-between"
                        ai="flex-start" // Để text dài không bị lệch nút
                        space="$4"
                      >
                        <YStack flex={1} space="$1">
                          <Text lineHeight={20}>
                            Sau khi bật, bạn sẽ được yêu cầu nhập mã OTP hoặc xác thực từ thiết bị
                            di động sau khi đăng nhập trên thiết bị lạ.
                          </Text>
                        </YStack>

                        {/* Nút Switch xanh chuẩn Zalo */}
                        <Switch
                          size="$3"
                          checked={isTwoFactorAuth}
                          onCheckedChange={handleToggleMFA}
                          backgroundColor={isTwoFactorAuth ? '#0068ff' : '$backgroundPress'}
                        >
                          <Switch.Thumb animation="quick" />
                        </Switch>
                      </XStack>
                    </YStack>
                  </>
                )}
              </YStack>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
      <Dialog
        key="enable-mfa-dialog"
        open={openEnableMFA}
        onOpenChange={(open) => {
          if (!open) {
            // nếu user đóng dialog mà chưa verify → giữ switch OFF
            if (!isTwoFactorAuth) {
              setSecretCode(null)
              setPassword('')
              setOtpCode('')
            }
          }
          setOpenEnableMFA(open)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay key="mfa-overlay" opacity={0.5} backgroundColor="#000" />

          <Dialog.Content padding="$5" width={400}>
            {!secretCode && (
              <YStack space="$3">
                <Text fontWeight="bold">Nhập lại mật khẩu</Text>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Button onPress={handleSubmitPassword}>Xác nhận</Button>
              </YStack>
            )}

            {secretCode && (
              <YStack space="$3">
                <Text fontWeight="bold">Quét mã bằng Google Authenticator</Text>

                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/YourApp?secret=${secretCode}&issuer=YourApp`,
                  }}
                  style={{ width: 200, height: 200 }}
                />

                <input
                  type="text"
                  placeholder="Nhập mã OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />

                <Button onPress={handleVerifyOTP} disabled={isVerifying}>
                  {isVerifying ? 'Đang xử lý...' : 'Xác nhận OTP'}
                </Button>
              </YStack>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
