import { Languages, LogOut, Moon, Sun } from '@tamagui/lucide-icons'
import {
  Button,
  Input,
  Label,
  DisableMFADialog,
  EnableMFADialog,
  ListItem,
  Separator,
  Switch,
  Text,
  XStack,
  YStack,
} from '@my/ui'
import { useAppTheme } from 'app/provider/ThemeContext'
import { fetchMFAPreference, signOut, updatePassword } from 'aws-amplify/auth'
import React from 'react'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'solito/navigation'
import {
  useConfirmMFAMutation,
  useDisableMFAMutation,
  useInitMFAMutation,
} from 'app/services/authApi'
import { useSelector } from 'react-redux'
import type { RootState } from 'app/store'
import { useGetProfileQuery } from 'app/services/userApi'

export default function SettingsScreen() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useAppTheme()

  const hasSession = useSelector((s: RootState) => s.auth.hasSession)
  const userIdFromStore = useSelector((s: RootState) => s.auth.user?.id)
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !hasSession })
  const userId =
    userIdFromStore ??
    ((profileData as any)?.id as string | undefined) ??
    ((profileData as any)?.result?.id as string | undefined) ??
    undefined

  const [showChangePassword, setShowChangePassword] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [nextPassword, setNextPassword] = React.useState('')
  const [confirmNextPassword, setConfirmNextPassword] = React.useState('')
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)

  const [initMFA] = useInitMFAMutation()
  const [confirmMFA] = useConfirmMFAMutation()
  const [disableMFAApi] = useDisableMFAMutation()

  const [isTwoFactorAuth, setIsTwoFactorAuth] = React.useState(false)
  const [openEnableMFA, setOpenEnableMFA] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [secretCode, setSecretCode] = React.useState<string | null>(null)
  const [otpCode, setOtpCode] = React.useState('')
  const [isVerifying, setIsVerifying] = React.useState(false)

  const [openDisableMFA, setOpenDisableMFA] = React.useState(false)
  const [disablePassword, setDisablePassword] = React.useState('')
  const [isDisabling, setIsDisabling] = React.useState(false)

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'vi'
    const newLang = currentLang.includes('vi') ? 'en' : 'vi'
    i18n.changeLanguage(newLang)
  }

  const handleLogout = async () => {
    await signOut()
    router.replace('/login')
  }

  const refreshMfaStatus = async () => {
    try {
      const mfa = await fetchMFAPreference()
      const enabled = (mfa as any)?.enabled ?? []
      setIsTwoFactorAuth(Array.isArray(enabled) && enabled.length > 0)
    } catch {
      // If we can't read preference, keep current UI state.
    }
  }

  React.useEffect(() => {
    if (!hasSession) {
      setIsTwoFactorAuth(false)
      setOpenEnableMFA(false)
      setOpenDisableMFA(false)
      setPassword('')
      setSecretCode(null)
      setOtpCode('')
      setDisablePassword('')
      return
    }
    refreshMfaStatus()
  }, [hasSession])

  const handleCancelChangePassword = () => {
    setCurrentPassword('')
    setNextPassword('')
    setConfirmNextPassword('')
    setShowChangePassword(false)
  }

  const handleChangePassword = async () => {
    if (isChangingPassword) return

    const oldPassword = currentPassword
    const newPassword = nextPassword

    if (!oldPassword.trim() || !newPassword.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.')
      return
    }

    if (newPassword !== confirmNextPassword) {
      Alert.alert('Không khớp', 'Mật khẩu mới và xác nhận mật khẩu không khớp.')
      return
    }

    try {
      setIsChangingPassword(true)
      await updatePassword({ oldPassword, newPassword } as any)
      Alert.alert('Thành công', 'Mật khẩu đã được cập nhật.')
      handleCancelChangePassword()
    } catch (err: any) {
      const msg = String(err?.message ?? 'Đổi mật khẩu thất bại. Vui lòng thử lại.')
      Alert.alert('Lỗi', msg)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const openEnableMFADialog = () => {
    setPassword('')
    setSecretCode(null)
    setOtpCode('')
    setOpenEnableMFA(true)
  }

  const handleSubmitPassword = async () => {
    if (!userId) {
      Alert.alert('Thiếu thông tin', 'Chưa lấy được thông tin người dùng. Vui lòng thử lại.')
      return
    }
    if (!password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu để tiếp tục.')
      return
    }

    try {
      const res = await initMFA({ userId, password }).unwrap()
      setSecretCode(res.secret)
    } catch (err: any) {
      const msg = String(err?.message ?? 'Sai mật khẩu hoặc không thể khởi tạo bảo mật 2 lớp.')
      Alert.alert('Lỗi', msg)
    }
  }

  const handleVerifyOTP = async () => {
    if (isVerifying) return
    if (!userId) {
      Alert.alert('Thiếu thông tin', 'Chưa lấy được thông tin người dùng. Vui lòng thử lại.')
      return
    }
    if (!otpCode.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã OTP 6 số.')
      return
    }

    try {
      setIsVerifying(true)
      await confirmMFA({ userId, otp: otpCode }).unwrap()
      setIsTwoFactorAuth(true)
      setOpenEnableMFA(false)
      setSecretCode(null)
      setPassword('')
      setOtpCode('')
      Alert.alert('Thành công', 'Đã bật bảo mật 2 lớp.')
      await refreshMfaStatus()
    } catch (err: any) {
      const msg = String(err?.message ?? 'Mã OTP không đúng. Vui lòng thử lại.')
      Alert.alert('Lỗi', msg)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisableMFA = async () => {
    if (isDisabling) return
    if (!userId) {
      Alert.alert('Thiếu thông tin', 'Chưa lấy được thông tin người dùng. Vui lòng thử lại.')
      return
    }
    if (!disablePassword.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu để tắt bảo mật 2 lớp.')
      return
    }

    try {
      setIsDisabling(true)
      await disableMFAApi({ userId, password: disablePassword }).unwrap()
      setIsTwoFactorAuth(false)
      setOpenDisableMFA(false)
      setDisablePassword('')
      Alert.alert('Thành công', 'Đã tắt bảo mật 2 lớp.')
      await refreshMfaStatus()
    } catch (err: any) {
      const msg = String(err?.message ?? 'Không thể tắt bảo mật 2 lớp. Vui lòng thử lại.')
      Alert.alert('Lỗi', msg)
    } finally {
      setIsDisabling(false)
    }
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

      <YStack space="$2">
        <Text fontSize="$5" fontWeight="700">
          Tài khoản & bảo mật
        </Text>

        <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$6" overflow="hidden">
          <ListItem
            pressTheme
            title="Đổi mật khẩu"
            onPress={() => setShowChangePassword((v) => !v)}
          />

          {showChangePassword ? (
            <>
              <Separator />
              <YStack padding="$3" space="$3">
                <YStack space="$2">
                  <Label>Mật khẩu hiện tại</Label>
                  <Input
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Nhập mật khẩu hiện tại"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </YStack>

                <YStack space="$2">
                  <Label>Mật khẩu mới</Label>
                  <Input
                    value={nextPassword}
                    onChangeText={setNextPassword}
                    placeholder="Nhập mật khẩu mới"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </YStack>

                <YStack space="$2">
                  <Label>Xác nhận mật khẩu mới</Label>
                  <Input
                    value={confirmNextPassword}
                    onChangeText={setConfirmNextPassword}
                    placeholder="Nhập lại mật khẩu mới"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </YStack>

                <XStack space="$2" justifyContent="flex-end">
                  <Button chromeless onPress={handleCancelChangePassword}>
                    Hủy
                  </Button>
                  <Button themeInverse onPress={handleChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword ? 'Đang đổi...' : 'Cập nhật mật khẩu'}
                  </Button>
                </XStack>
              </YStack>
            </>
          ) : null}

          <Separator />

          <XStack padding="$3" alignItems="center" justifyContent="space-between" space="$3">
            <YStack flex={1} space="$1">
              <Text fontWeight="700">Bảo mật 2 lớp</Text>
              <Text fontSize="$2" color="$color10">
                {isTwoFactorAuth ? 'Đang bật' : 'Đang tắt'}
              </Text>
            </YStack>

            <Switch
              size="$3"
              checked={isTwoFactorAuth}
              onCheckedChange={(checked) => {
                if (checked) {
                  // Don't flip the switch until confirm success
                  openEnableMFADialog()
                } else {
                  setOpenDisableMFA(true)
                }
              }}
              backgroundColor={isTwoFactorAuth ? '$blue11' : '$backgroundPress'}
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          </XStack>
        </YStack>
      </YStack>

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
    </YStack>
  )
}
