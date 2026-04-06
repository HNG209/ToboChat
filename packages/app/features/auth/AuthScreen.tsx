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
  confirmSignIn,
  getCurrentUser,
} from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'
import { SwitchThemeButton, useToastController } from '@my/ui'
import { QRCodeSVG } from 'qrcode.react'
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
  const [step, setStep] = useState<'LOGIN' | 'CONFIRM' | 'CONFIRM_MFA' | 'SETUP_MFA'>('LOGIN')
  const [openForgotDialog, setOpenForgotDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // Input nhập lại mật khẩu cho phần signup
  const [confirmPassword, setConfirmPassword] = useState('')
  // Thêm các state cho quên mật khẩu
  const [forgotStep, setForgotStep] = useState<
    'NONE' | 'SEND_CODE' | 'CONFIRM_CODE' | 'RESET_PASSWORD'
  >('NONE')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [totpDetails, setTotpDetails] = useState<any>(null)

  // Nếu đã có session (đã đăng nhập), đi thẳng vào app để tránh lỗi
  // "There is already a signed in user" khi người dùng bấm đăng nhập lại.
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await getCurrentUser()
        if (cancelled) return
        router.replace('/chat')
      } catch {
        // not signed in
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router])
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
      // Tránh gọi signIn khi session đã tồn tại
      try {
        await getCurrentUser()
        router.replace('/chat')
        return
      } catch {
        // continue
      }

      const { isSignedIn, nextStep } = await signIn({ username: email, password })
      console.log('Next Step:', nextStep)
      if (isSignedIn) {
        router.push('/chat')
      }

      switch (nextStep?.signInStep) {
        case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
          setStep('CONFIRM_MFA')
          break

        case 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP':
          setTotpDetails(nextStep.totpSetupDetails)
          setStep('SETUP_MFA')
          break

        case 'CONFIRM_SIGN_UP':
          setStep('CONFIRM')
          setResendTimer(60)
          break

        default:
          console.log('Unhandled step:', nextStep)
      }
    } catch (error: any) {
      const msg = String(error?.message ?? '')
      const name = String(error?.name ?? '')

      // Amplify sẽ throw nếu đã có user signed-in.
      if (
        name === 'UserAlreadyAuthenticatedException' ||
        msg.toLowerCase().includes('already a signed in user')
      ) {
        router.replace('/chat')
        return
      }

      setError(msg)
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
      // kiem tra xem mat khau vs phan xac nhan mat khau khop hay khong
      if (password !== confirmPassword) {
        setError('Password did not match when re-entered.')
        return
      }
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

  // là bước cuối cùng trong luồng xác thực hai lớp (MFA)
  const handleConfirmMFA = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // confirmSignIn() gửi mã OTP lên Cognito
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: code, // 'code' là mã 6 số người dùng nhập
      })
      console.log('MFA result:', isSignedIn)
      if (isSignedIn) {
        console.log('Redirecting...')
        router.replace('/chat')
      }
    } catch (error: any) {
      setError(getMFAErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }
  // bat mot so loi
  const getMFAErrorMessage = (error: any) => {
    switch (error.name) {
      case 'CodeMismatchException':
        return 'Mã OTP không đúng. Vui lòng thử lại.'
      case 'ExpiredCodeException':
        return 'Mã OTP đã hết hạn. Vui lòng nhập mã mới.'
      case 'TooManyRequestsException':
        return 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.'
      case 'InvalidSessionException':
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      default:
        return error.message || 'Đã xảy ra lỗi.'
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
          ) : step === 'CONFIRM_MFA' ? (
            // Giao diện nhập mã OTP cho MFA
            <YStack space="$3">
              <Text textAlign="center" fontWeight="bold">
                Nhập mã xác thực (MFA)
              </Text>
              <Input
                placeholder="Mã OTP 6 số"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                size="$4"
              />
              <Button onPress={handleConfirmMFA} disabled={isLoading}>
                {isLoading ? <Spinner /> : <Text color="white">Xác nhận đăng nhập</Text>}
              </Button>
              <Button variant="outline" onPress={() => setStep('LOGIN')}>
                Quay lại
              </Button>
            </YStack>
          ) : step === 'SETUP_MFA' ? (
            <YStack space="$3">
              <Text textAlign="center" fontWeight="bold">
                Thiết lập Google Authenticator
              </Text>

              {totpDetails && (
                <YStack space="$2">
                  <Text size="$2" color="$color8">
                    Bước 1: Quét mã này bằng Google Authenticator
                  </Text>
                  <QRCodeSVG value={totpDetails.getSetupUri('ToboChat').toString()} size={180} />
                </YStack>
              )}

              <Input
                placeholder="Nhập mã OTP 6 số sau khi quét"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                size="$4"
              />

              <Button onPress={handleConfirmMFA} disabled={isLoading}>
                {isLoading ? <Spinner /> : <Text>Xác nhận kích hoạt</Text>}
              </Button>

              <Button variant="outline" onPress={() => setStep('LOGIN')}>
                Hủy
              </Button>
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
              {isSignUp && (
                <Input
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  size="$4"
                  borderRadius="$4"
                />
              )}
              {/* Input nhap lai mat khau */}
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
