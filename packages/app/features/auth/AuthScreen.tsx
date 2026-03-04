import React, { useState, useRef, useEffect } from 'react'
import {
  YStack,
  XStack,
  Input,
  Button,
  Text,
  H3,
  Spinner,
  Paragraph,
  Image,
  Card,
  AlertDialog,
} from 'tamagui'
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
} from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'
import { SwitchThemeButton, useToastController } from '@my/ui'
// import { toast } from 'sonner'

export function AuthScreen() {
  const toast = useToastController()
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'LOGIN' | 'CONFIRM'>('LOGIN')
  const [openForgotDialog, setOpenForgotDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Thêm các state cho quên mật khẩu
  const [forgotStep, setForgotStep] = useState<
    'NONE' | 'SEND_CODE' | 'CONFIRM_CODE' | 'RESET_PASSWORD'
  >('NONE')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Đếm ngược resend
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resendTimer])

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password })
      if (isSignedIn) {
        router.push('/chat')
      } else if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        setStep('CONFIRM')
        setResendTimer(60)
      }
    } catch (error: any) {
      if (error.name === 'UserNotConfirmedException') {
        setStep('CONFIRM')
        setResendTimer(60)
        setError('Tài khoản chưa xác thực. Vui lòng kiểm tra email.')
      } else {
        setError(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Nếu có username thì sử dụng username, nếu không thì lấy email làm username
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email, name }, // Bắt buộc phải có email để xác thực
        },
      })
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        // Chuyển sang bước xác nhận
        setStep('CONFIRM')
        setResendTimer(60)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmSignUp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { isSignUpComplete } = await confirmSignUp({ username: email, confirmationCode: code })
      if (isSignUpComplete) {
        toast.show('Thành công!', { message: 'Đăng ký thành công. Hãy đăng nhập.' })
        setStep('LOGIN')
        setIsSignUp(false)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await resendSignUpCode({ username: email })
      setResendTimer(60)
      toast.show('Thành công!', { message: 'Mã xác nhận mới đã được gửi tới email của bạn.' })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm gửi mã reset mật khẩu
  const handleForgotPassword = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await resetPassword({ username: forgotEmail })
      setForgotStep('CONFIRM_CODE')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm xác nhận mã và đặt lại mật khẩu
  const handleConfirmForgotPassword = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await confirmResetPassword({
        username: forgotEmail,
        confirmationCode: forgotCode,
        newPassword,
      })
      toast.show('Thành công!', {
        message: 'Mật khẩu đã được đặt lại. Hãy đăng nhập với mật khẩu mới.',
      })
      setForgotStep('NONE')
      setStep('LOGIN')
      setIsSignUp(false)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      p="$4"
      backgroundColor="$background"
    >
      <YStack position="absolute" top={40} right={30} zIndex={10}>
        <SwitchThemeButton />
      </YStack>
      <Card
        elevate
        size="$4"
        bordered
        width={350}
        p="$5"
        borderRadius="$6"
        backgroundColor="$color1"
        shadowColor="$shadowColor"
        shadowOpacity={0.08}
        shadowRadius={16}
        shadowOffset={{ width: 0, height: 8 }}
      >
        {/* Tiêu đề và mô tả */}
        {forgotStep === 'NONE' ? (
          <YStack alignItems="center" space="$3" marginBottom="$2">
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/295/295128.png' }}
              width={56}
              height={56}
              borderRadius={28}
              mb="$2"
            />
            <H3 textAlign="center" color="$color12">
              {isSignUp ? (step === 'CONFIRM' ? 'Xác nhận Email' : 'Tạo tài khoản') : 'Đăng nhập'}
            </H3>
            <Paragraph size="$3" color="$color8" textAlign="center">
              {isSignUp
                ? step === 'CONFIRM'
                  ? 'Nhập mã xác nhận đã gửi tới email của bạn.'
                  : 'Tạo tài khoản mới để bắt đầu trò chuyện.'
                : 'Đăng nhập để tiếp tục sử dụng ToboChat.'}
            </Paragraph>
          </YStack>
        ) : (
          <YStack alignItems="center" space="$3" marginBottom="$2">
            <H3 textAlign="center" color="$color12">
              {forgotStep === 'SEND_CODE'
                ? 'Quên mật khẩu'
                : forgotStep === 'CONFIRM_CODE'
                  ? 'Xác nhận mã'
                  : 'Đặt lại mật khẩu'}
            </H3>
            <Paragraph size="$3" color="$color8" textAlign="center">
              {forgotStep === 'SEND_CODE'
                ? 'Nhập email của bạn để nhận mã xác nhận đặt lại mật khẩu.'
                : forgotStep === 'CONFIRM_CODE'
                  ? 'Nhập mã xác nhận đã gửi tới email của bạn.'
                  : 'Đặt mật khẩu mới cho tài khoản của bạn.'}
            </Paragraph>
          </YStack>
        )}

        {/* Hiển thị lỗi nếu có */}
        {error && (
          <YStack bg="$red1" p="$2" borderRadius="$3" mb="$2">
            <Text color="$red10" fontWeight="bold" textAlign="center">
              {error}
            </Text>
          </YStack>
        )}

        {/* Quên mật khẩu */}
        {forgotStep !== 'NONE' && (
          <YStack space="$3" mt="$2">
            {forgotStep === 'SEND_CODE' && (
              <YStack space="$3">
                <Input
                  placeholder="Email"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  size="$4"
                  borderRadius="$4"
                  autoFocus
                />
                <Button
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  size="$4"
                  borderRadius="$4"
                >
                  {isLoading ? (
                    <Spinner color="$color12" />
                  ) : (
                    <Text fontWeight="bold" color="$color12">
                      Gửi mã xác nhận
                    </Text>
                  )}
                </Button>
                <Button
                  onPress={() => setForgotStep('NONE')}
                  size="$4"
                  borderRadius="$4"
                  marginBottom="$2"
                >
                  Hủy
                </Button>
              </YStack>
            )}
            {forgotStep === 'CONFIRM_CODE' && (
              <YStack space="$3">
                <Input
                  placeholder="Mã xác nhận"
                  value={forgotCode}
                  onChangeText={setForgotCode}
                  keyboardType="number-pad"
                  size="$4"
                  borderRadius="$4"
                  autoFocus
                />
                <Input
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  size="$4"
                  borderRadius="$4"
                />
                <Button
                  onPress={handleConfirmForgotPassword}
                  disabled={isLoading}
                  size="$4"
                  borderRadius="$4"
                >
                  {isLoading ? (
                    <Spinner color="$color12" />
                  ) : (
                    <Text fontWeight="bold" color="$color12">
                      Đặt lại mật khẩu
                    </Text>
                  )}
                </Button>
                <Button
                  onPress={() => setForgotStep('SEND_CODE')}
                  size="$4"
                  borderRadius="$4"
                  // variant="outline"
                >
                  Quay lại
                </Button>
              </YStack>
            )}
          </YStack>
        )}

        {/* Nội dung form đăng nhập/đăng ký/xác nhận */}
        {forgotStep === 'NONE' &&
          // Xác nhận đăng ký
          (step === 'CONFIRM' ? (
            <YStack space="$3">
              <Input
                placeholder="Nhập mã xác nhận"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                size="$4"
                borderRadius="$4"
                autoFocus
              />
              <Button
                onPress={handleConfirmSignUp}
                disabled={isLoading}
                size="$4"
                borderRadius="$4"
              >
                {isLoading ? (
                  <Spinner />
                ) : (
                  <Text fontWeight="bold" color="$color12">
                    Xác nhận
                  </Text>
                )}
              </Button>
              <XStack justifyContent="center" alignItems="center" space="$2">
                <Text color="$color8">Chưa nhận được mã?</Text>
                <Button
                  onPress={handleResendCode}
                  disabled={resendTimer > 0 || isLoading}
                  size="$2"
                  borderRadius="$4"
                  // theme="active"
                  opacity={resendTimer > 0 ? 0.5 : 1}
                >
                  {resendTimer > 0 ? `Gửi lại (${resendTimer}s)` : 'Gửi lại mã'}
                </Button>
              </XStack>
            </YStack>
          ) : (
            // Form đăng nhập/đăng ký
            <YStack space="$3">
              {isSignUp && (
                <Input
                  placeholder="Họ và Tên"
                  value={name}
                  onChangeText={setName}
                  size="$4"
                  borderRadius="$4"
                  autoFocus
                />
              )}
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                size="$4"
                borderRadius="$4"
              />
              <Input
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                size="$4"
                borderRadius="$4"
              />
              <Button
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={isLoading}
                size="$4"
                borderRadius="$4"
              >
                {isLoading ? (
                  <Spinner color="$color12" />
                ) : (
                  <Text fontWeight="bold" color="$color12">
                    {isSignUp ? 'Đăng ký' : 'Đăng nhập'}
                  </Text>
                )}
              </Button>
              <XStack justifyContent="center" space="$2" mt="$2">
                <Paragraph size="$2" color="$color8">
                  {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                </Paragraph>
                <Text
                  cursor="pointer"
                  color="$blue10"
                  fontWeight="bold"
                  onPress={() => {
                    setIsSignUp(!isSignUp)
                    setStep('LOGIN')
                    setError(null)
                  }}
                >
                  {isSignUp ? 'Đăng nhập' : 'Tạo mới'}
                </Text>
              </XStack>
              {!isSignUp && (
                <AlertDialog>
                  <AlertDialog.Trigger asChild>
                    <Text
                      color="$blue10"
                      fontWeight="bold"
                      textAlign="center"
                      cursor="pointer"
                      style={{ marginTop: 8 }}
                    >
                      Quên mật khẩu?
                    </Text>
                  </AlertDialog.Trigger>

                  <AlertDialog.Portal>
                    <AlertDialog.Overlay />
                    <AlertDialog.Content>
                      <AlertDialog.Title>Bạn muốn gửi mã xác nhận?</AlertDialog.Title>
                      <AlertDialog.Description>
                        Mã xác nhận đặt lại mật khẩu sẽ được gửi về email của bạn.
                      </AlertDialog.Description>
                      <XStack space="$2" justifyContent="flex-end" mt="$3">
                        <AlertDialog.Cancel asChild>
                          <Button>Hủy</Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <Button
                            onPress={() => {
                              setForgotEmail(email)
                              setForgotStep('SEND_CODE')
                            }}
                          >
                            Gửi mã
                          </Button>
                        </AlertDialog.Action>
                      </XStack>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog>
              )}
            </YStack>
          ))}
      </Card>
    </YStack>
  )
}
