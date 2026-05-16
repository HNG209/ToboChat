import React, { useState } from 'react'
import { YStack, Input, Button, Text, Spinner, H3, Paragraph } from 'tamagui'
import { signUp, confirmSignUp } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'

export function SignUpForm() {
  const router = useRouter()
  const [step, setStep] = useState<'FILL' | 'CONFIRM'>('FILL')
  const [form, setForm] = useState({ email: '', password: '', name: '', code: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async () => {
    setLoading(true)
    try {
      await signUp({
        username: form.email,
        password: form.password,
        options: { userAttributes: { email: form.email, name: form.name } }
      })
      setStep('CONFIRM')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: form.email,
        confirmationCode: form.code
      })
      if (isSignUpComplete) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:switch-view', { detail: 'SIGNIN' }))
        } else {
          router.replace('/login')
        }
      }
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (step === 'CONFIRM') {
    return (
      <YStack space="$3" width="100%" flex={1} justifyContent="flex-start" pt="$2">
        <YStack space="$1" mb="$2" alignItems="center">
          <H3 fontWeight="700" fontSize="$8" color="$color12" letterSpacing={-0.5}>
            Xác nhận Email
          </H3>
          <Paragraph color="$color10" textAlign="center">
            Nhập mã xác nhận đã gửi đến email của bạn.
          </Paragraph>
        </YStack>
        <Input width="100%" placeholder="Mã xác nhận" onChangeText={(txt) => setForm({ ...form, code: txt })} />
        <Button width="100%" onPress={handleConfirm}>{loading ? <Spinner /> : <Text>Xác nhận</Text>}</Button>
      </YStack>
    )
  }

  return (
    <YStack space="$3" width="100%" flex={1} justifyContent="flex-start" pt="$2">
      <YStack space="$1" mb="$2" alignItems="center">
        <H3 fontWeight="900" fontSize="$8" color="$color12" letterSpacing={-0.5}>
          Tạo tài khoản
        </H3>
        <Paragraph color="$color10" textAlign="center">
          Điền thông tin để bắt đầu trò chuyện.
        </Paragraph>
      </YStack>

      {error ? <Text color="$red10">{error}</Text> : null}
      <Input width="100%" placeholder="Họ tên" onChangeText={(txt) => setForm({ ...form, name: txt })} />
      <Input width="100%" placeholder="Email" onChangeText={(txt) => setForm({ ...form, email: txt })} />
      <Input width="100%" placeholder="Mật khẩu" secureTextEntry onChangeText={(txt) => setForm({ ...form, password: txt })} />
      <Button width="100%" onPress={handleSignUp}>{loading ? <Spinner /> : <Text>Đăng ký</Text>}</Button>
      <Text
        textAlign="center"
        color="$blue10"
        onPress={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:switch-view', { detail: 'SIGNIN' }))
          } else {
            router.replace('/login')
          }
        }}
      >
        Đã có tài khoản? Đăng nhập
      </Text>
    </YStack>
  )
}