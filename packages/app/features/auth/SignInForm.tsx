"use client"
import React, { useState } from 'react'
import { YStack, XStack, Input, Button, Text, Spinner, H3, Paragraph } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'
import { signIn, confirmSignIn } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'
export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'SIGNIN' | 'CONFIRM_MFA' | 'SETUP_MFA'>('SIGNIN')
  const [code, setCode] = useState('')
  const [totpDetails, setTotpDetails] = useState<any>(null)

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password })
      if (isSignedIn) {
        router.replace('/chat')
      } else if (nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        setStep('CONFIRM_MFA')
      } else if (nextStep?.signInStep === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP') {
        setTotpDetails(nextStep.totpSetupDetails)
        setStep('SETUP_MFA')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getMFAErrorMessage = (error: any) => {
    switch (error?.name) {
      case 'CodeMismatchException':
        return 'Mã OTP không đúng. Vui lòng thử lại.'
      case 'ExpiredCodeException':
        return 'Mã OTP đã hết hạn. Vui lòng nhập mã mới.'
      case 'TooManyRequestsException':
        return 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.'
      case 'InvalidSessionException':
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      default:
        return error?.message || 'Đã xảy ra lỗi.'
    }
  }



  return (
    <YStack space="$3" width="100%" flex={1} justifyContent="flex-start" pt="$2">
      <YStack space="$1" mb="$2" alignItems="center">
        <H3 fontWeight="900" fontSize="$8" color="$color12" letterSpacing={-0.5}>
          {step === 'SIGNIN' ? 'Đăng nhập' : step === 'CONFIRM_MFA' ? 'Nhập mã xác thực (MFA)' : 'Thiết lập MFA'}
        </H3>
        <Paragraph color="$color10" textAlign="center">
          {step === 'SIGNIN' ? 'Đăng nhập để bắt đầu trò chuyện.' : step === 'CONFIRM_MFA' ? 'Nhập mã OTP 6 số từ ứng dụng xác thực.' : 'Quét mã QR và nhập mã để kích hoạt MFA.'}
        </Paragraph>
      </YStack>

      {error ? <Text color="$red10">{error}</Text> : null}

      {step === 'SIGNIN' ? (
        <>
          <Input width="100%" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <Input width="100%" placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />

          <Button width="100%" onPress={handleSignIn} disabled={loading} themeInverse>
            {loading ? <Spinner /> : <Text fontWeight="bold">Đăng nhập</Text>}
          </Button>
        </>
      ) : step === 'CONFIRM_MFA' ? (
        <>
          <Input width="100%" placeholder="Mã OTP 6 số" value={code} onChangeText={setCode} keyboardType="number-pad" />
          <Button width="100%" onPress={async () => {
            setLoading(true); setError('')
            try {
              const { isSignedIn } = await confirmSignIn({ challengeResponse: code })
              if (isSignedIn) router.replace('/chat')
            } catch (err: any) {
              setError(getMFAErrorMessage(err))
            } finally { setLoading(false) }
          }} disabled={loading}>
            {loading ? <Spinner /> : <Text>Xác nhận</Text>}
          </Button>
          <Button variant="outlined" onPress={() => { setStep('SIGNIN'); setCode(''); setError('') }}>
            Quay lại
          </Button>
        </>
      ) : (
        <>
          {totpDetails ? (
            <YStack alignItems="center" mb="$2">
              {/* QR code UI could be added here using totpDetails.getSetupUri(...) */}
              <Text size="$2" color="$color8">Quét mã QR bằng ứng dụng Authenticator</Text>
            </YStack>
          ) : null}
          <Input width="100%" placeholder="Mã OTP 6 số" value={code} onChangeText={setCode} keyboardType="number-pad" />
          <Button width="100%" onPress={async () => {
            setLoading(true); setError('')
            try {
              const { isSignedIn } = await confirmSignIn({ challengeResponse: code })
              if (isSignedIn) router.replace('/chat')
            } catch (err: any) {
              setError(getMFAErrorMessage(err))
            } finally { setLoading(false) }
          }} disabled={loading}>
            {loading ? <Spinner /> : <Text>Xác nhận kích hoạt</Text>}
          </Button>
          <Button variant="outlined" onPress={() => { setStep('SIGNIN'); setCode(''); setError('') }}>
            Hủy
          </Button>
        </>
      )}

      <Text textAlign="center" color="$blue10" onPress={() => router.push('/forgot-password')}>
        Quên mật khẩu?
      </Text>

      <XStack justifyContent="center" alignItems="center">
        <Paragraph size="$2" color="$gray10">Chưa có tài khoản?</Paragraph>
        <XStack
          ml="$2"
          cursor="pointer"
          onPress={() => router.push('/signup')}
          hoverStyle={{ scale: 1.03 }}
          pressStyle={{ scale: 0.97, opacity: 0.85 }}
          alignItems="center"
        >
          <Text color="$blue10" fontWeight="bold">Đăng ký ngay</Text>
          <ChevronRight size={16} color="#1677FF" style={{ marginLeft: 6 }} />
        </XStack>
      </XStack>
    </YStack>
  )
}