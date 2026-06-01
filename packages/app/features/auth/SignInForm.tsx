
"use client"

import React, { useState, useEffect } from 'react'
import { YStack, XStack, Input, Button, Text, Spinner, H3, Paragraph } from 'tamagui'
import {
  signIn,
  confirmSignIn,
  confirmSignUp,
  resendSignUpCode,
} from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'

export function SignInForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [step, setStep] = useState<
    'SIGNIN' | 'CONFIRM_SIGNUP' | 'CONFIRM_MFA' | 'SETUP_MFA'
  >('SIGNIN')

  const [code, setCode] = useState('')
  const [totpDetails, setTotpDetails] = useState<any>(null)

  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    if (resendTimer <= 0) return

    const timer = setTimeout(() => {
      setResendTimer((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [resendTimer])

  const handleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      })

      if (isSignedIn) {
        router.replace('/chat')
        return
      }

      switch (nextStep?.signInStep) {
        case 'CONFIRM_SIGN_UP':
          setStep('CONFIRM_SIGNUP')
          setResendTimer(60)
          break

        case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
          setStep('CONFIRM_MFA')
          break

        case 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP':
          setTotpDetails(nextStep.totpSetupDetails)
          setStep('SETUP_MFA')
          break

        default:
          console.log('Unhandled step:', nextStep)
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSignUp = async () => {
    setLoading(true)
    setError('')

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      })

      if (isSignUpComplete) {
        setStep('SIGNIN')
        setCode('')
        setError('')

        alert('Xác thực email thành công. Vui lòng đăng nhập lại.')
      }
    } catch (err: any) {
      setError(err.message || 'Xác thực email thất bại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setError('')

    try {
      await resendSignUpCode({
        username: email,
      })

      setResendTimer(60)
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã xác nhận.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmMFA = async () => {
    setLoading(true)
    setError('')

    try {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: code,
      })

      if (isSignedIn) {
        router.replace('/chat')
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi xác thực MFA.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack space="$3" width="100%">
      <YStack space="$3" alignItems="center">
        <H3 fontWeight="900" fontSize="$9" color="$color12" textAlign="center">
          {step === 'SIGNIN'
            ? 'Đăng nhập'
            : step === 'CONFIRM_SIGNUP'
              ? 'Xác nhận Email'
              : step === 'CONFIRM_MFA'
                ? 'MFA OTP'
                : 'Thiết lập MFA'}
        </H3>

        <Paragraph color="$color10" textAlign="center" fontSize="$3" mb="$3">
          {step === 'SIGNIN'
            ? 'Bắt đầu cuộc trò chuyện của bạn.'
            : step === 'CONFIRM_SIGNUP'
              ? 'Nhập mã xác nhận đã gửi đến email của bạn.'
              : 'Nhập mã xác thực của bạn.'}
        </Paragraph>
      </YStack>

      {error ? (
        <Text
          color="$red10"
          textAlign="center"
          bg="$red2"
          p="$2"
          borderRadius="$4"
          fontSize="$2"
        >
          {error}
        </Text>
      ) : null}

      {step === 'SIGNIN' && (
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

          <Button
            backgroundColor="$blue10"
            size="$4"
            onPress={handleSignIn}
            disabled={loading}
            width="100%"
          >
            {loading ? (
              <Spinner color="white" />
            ) : (
              <Text fontWeight="bold" color="white">
                Đăng nhập
              </Text>
            )}
          </Button>

          <Text
            textAlign="center"
            cursor="pointer"
            color="$blue10"
            onPress={() => router.push('/forgot-password')}
            hoverStyle={{
              color: '$blue11',
              textDecorationLine: 'underline',
            }}
          >
            Quên mật khẩu?
          </Text>

          <XStack justifyContent="center" alignItems="center" width="100%">
            <Paragraph size="$4" color="$gray10" textAlign="center">
              Chưa có tài khoản?{' '}
              <Text
                color="$blue10"
                fontWeight="bold"
                size="$4"
                cursor="pointer"
                hoverStyle={{
                  color: '$blue11',
                  textDecorationLine: 'underline',
                }}
                onPress={() => router.push('/signup')}
              >
                Đăng ký ngay
              </Text>
            </Paragraph>
          </XStack>

        </YStack>
      )}

      {step === 'CONFIRM_SIGNUP' && (
        <YStack space="$3" width="100%">
          <Input
            placeholder="Mã xác nhận (6 số)"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            size="$4"
            width="100%"
          />

          <Button
            width="100%"
            backgroundColor="$blue10"
            size="$4"
            onPress={handleConfirmSignUp}
            disabled={loading}
          >
            {loading ? <Spinner color="white" /> : <Text fontWeight="bold" color="white">Xác nhận tài khoản</Text>}
          </Button>

          <XStack justifyContent="center" alignItems="center" mt="$1" flexWrap="wrap">
            <Paragraph size="$2" color="$gray10">Không nhận được mã?</Paragraph>
            <XStack
              ml="$2"
              alignItems="center"
            >
              <Text cursor='pointer' color="$blue10" fontWeight="bold" size="$2" onPress={handleResendCode}
                disabled={loading}>Gửi lại mã</Text>
            </XStack>
          </XStack>
          <Button variant="outlined" size="$4" width="100%" onPress={() => setStep('SIGNIN')} disabled={loading}>
            <Text color="$color12">Quay lại</Text>
          </Button>
        </YStack>
      )}

      {step === 'CONFIRM_MFA' && (
        <YStack space="$3" width="100%">
          <Input
            placeholder="Mã OTP 6 số"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            size="$4"
            width="100%"
          />

          <Button
            backgroundColor="$blue10"
            onPress={handleConfirmMFA}
            disabled={loading}
          >
            {loading ? (
              <Spinner color="white" />
            ) : (
              <Text fontWeight="bold" color="white">
                Xác nhận
              </Text>
            )}
          </Button>

          <Button
            variant="outlined"
            onPress={() => {
              setStep('SIGNIN')
              setCode('')
            }}
          >
            <Text>Quay lại</Text>
          </Button>
        </YStack>
      )}


    </YStack>
  )
}