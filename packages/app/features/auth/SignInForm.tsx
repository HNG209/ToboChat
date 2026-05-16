import React, { useEffect, useState } from 'react'
import { YStack, Input, Button, Text, Spinner, H3, Paragraph } from 'tamagui'
import { signIn } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'

import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

type View = 'SIGNIN' | 'SIGNUP' | 'FORGOT'

export function SignInForm() {
  const router = useRouter()
  const [view, setView] = useState<View>('SIGNIN')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<View>).detail
      if (detail === 'SIGNIN' || detail === 'SIGNUP' || detail === 'FORGOT') {
        setView(detail)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:switch-view', handler)
      return () => window.removeEventListener('auth:switch-view', handler)
    }

    return undefined
  }, [])

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password })
      if (isSignedIn) {
        router.replace('/chat')
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        // Xử lý MFA ở đây nếu có
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  if (view === 'SIGNUP') return <SignUpForm />
  if (view === 'FORGOT') return <ForgotPasswordForm />

  return (
    <YStack space="$3" width="100%" flex={1} justifyContent="flex-start" pt="$2">
      <YStack space="$1" mb="$2" alignItems="center">
        <H3 fontWeight="900" fontSize="$8" color="$color12" letterSpacing={-0.5}>
          Đăng nhập
        </H3>
        <Paragraph color="$color10" textAlign="center">
          Đăng nhập để bắt đầu trò chuyện.
        </Paragraph>
      </YStack>

      {error ? <Text color="$red10">{error}</Text> : null}

      <Input width="100%" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Input width="100%" placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />

      <Button width="100%" onPress={handleSignIn} disabled={loading} themeInverse>
        {loading ? <Spinner /> : <Text fontWeight="bold">Đăng nhập</Text>}
      </Button>

      {/* Đổi từ window.dispatchEvent sang setView trực tiếp */}
      <Text
        textAlign="center"
        color="$blue10"
        onPress={() => setView('FORGOT')}
      >
        Quên mật khẩu?
      </Text>

      <Text
        textAlign="center"
        color="$gray10"
        onPress={() => setView('SIGNUP')}
      >
        Chưa có tài khoản? <Text color="$blue10" fontWeight="bold">Đăng ký ngay</Text>
      </Text>
    </YStack>
  )
}