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
      setError(err.message || 'Đăng nhập thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack space="$4" width="100%">
      <YStack space="$1" alignItems="center">
        <H3 fontWeight="900" fontSize="$7" color="$color12" textAlign="center">
          {step === 'SIGNIN' ? 'Đăng nhập' : step === 'CONFIRM_MFA' ? 'MFA OTP' : 'Thiết lập MFA'}
        </H3>
        <Paragraph color="$color10" textAlign="center" fontSize="$3">
          {step === 'SIGNIN' ? 'Bắt đầu cuộc trò chuyện của bạn.' : 'Nhập mã xác thực của bạn.'}
        </Paragraph>
      </YStack>

      {error ? (
        <Text color="$red10" textAlign="center" bg="$red2" p="$2" borderRadius="$4" fontSize="$2">
          {error}
        </Text>
      ) : null}

      {step === 'SIGNIN' ? (
        <YStack space="$3" width="100%">
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            size="$4"
            width="100%"
          />
          <Input
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            size="$4"
            width="100%"
          />
          <Button backgroundColor="$blue10" size="$4" onPress={handleSignIn} disabled={loading} width="100%">
            {loading ? <Spinner color="white" /> : <Text fontWeight="bold" color="white">Đăng nhập</Text>}
          </Button>
        </YStack>
      ) : (
        <YStack space="$3" width="100%">
          <Input
            placeholder="Mã OTP 6 số"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            size="$4"
            width="100%"
          />
          <Button backgroundColor="$blue10" onPress={async () => {
            setLoading(true); setError('')
            try {
              const { isSignedIn } = await confirmSignIn({ challengeResponse: code })
              if (isSignedIn) router.replace('/chat')
            } catch (err: any) { setError(err.message || 'Lỗi xác thực') }
            finally { setLoading(false) }
          }} disabled={loading}>
            {loading ? <Spinner color="white" /> : <Text fontWeight="bold" color="white">Xác nhận</Text>}
          </Button>
          <Button variant="outlined" onPress={() => { setStep('SIGNIN'); setCode(''); setError('') }}>
            <Text>Quay lại</Text>
          </Button>
        </YStack>
      )}

      <Text textAlign="center" color="$blue10" py="$1" onPress={() => router.push('/forgot-password')}>
        Quên mật khẩu?
      </Text>

      <XStack justifyContent="center" alignItems="center" mt="$1" flexWrap="wrap">
        <Paragraph size="$2" color="$gray10">Chưa có tài khoản?</Paragraph>
        <XStack ml="$2" onPress={() => router.push('/signup')} alignItems="center">
          <Text color="$blue10" fontWeight="bold" size="$2">Đăng ký ngay</Text>
          <ChevronRight size={14} color="#1677FF" style={{ marginLeft: 2 }} />
        </XStack>
      </XStack>
    </YStack>
  )
}