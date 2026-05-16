import React, { useState } from 'react'
import { YStack, Input, Button, Text, Spinner } from 'tamagui'
import { signIn } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'

export function SignInForm({ onForgotPassword, onSwitchSignUp }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password })
      if (isSignedIn) {
        router.push('/chat')
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        // Bạn có thể callback ra ngoài AuthScreen để đổi sang màn MFA
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack space="$3" width="100%" mt="$2">
      {error && <Text color="$red10" size="$2">{error}</Text>}
      <Input width="100%" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Input width="100%" placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />

      <Button width="100%" onPress={handleSignIn} disabled={loading} themeInverse>
        {loading ? <Spinner /> : <Text fontWeight="bold">Đăng nhập</Text>}
      </Button>

      <Text textAlign="center" color="$blue10" size="$2" onPress={onForgotPassword}>
        Quên mật khẩu?
      </Text>
      <Text textAlign="center" color="$gray10" size="$2" onPress={onSwitchSignUp}>
        Chưa có tài khoản? <Text color="$blue10" fontWeight="bold">Đăng ký ngay</Text>
      </Text>
    </YStack>
  )
}