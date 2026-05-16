import React, { useState } from 'react'
import { YStack, Input, Button, Text, Spinner } from 'tamagui'
import { signUp, confirmSignUp } from 'aws-amplify/auth'

export function SignUpForm({ onSignUpSuccess, onSwitchSignIn }) {
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
      if (isSignUpComplete) onSignUpSuccess()
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (step === 'CONFIRM') {
    return (
      <YStack space="$3" width="100%">
        <Text size="$2" textAlign="center">Nhập mã xác nhận đã gửi đến email</Text>
        <Input width="100%" placeholder="Mã xác nhận" onChangeText={(txt) => setForm({ ...form, code: txt })} />
        <Button width="100%" onPress={handleConfirm}>{loading ? <Spinner /> : "Xác nhận"}</Button>
      </YStack>
    )
  }

  return (
    <YStack space="$3" width="100%">
      {error && <Text color="$red10" size="$2">{error}</Text>}
      <Input width="100%" placeholder="Họ tên" onChangeText={(txt) => setForm({ ...form, name: txt })} />
      <Input width="100%" placeholder="Email" onChangeText={(txt) => setForm({ ...form, email: txt })} />
      <Input width="100%" placeholder="Mật khẩu" secureTextEntry onChangeText={(txt) => setForm({ ...form, password: txt })} />
      <Button width="100%" onPress={handleSignUp}>{loading ? <Spinner /> : "Đăng ký"}</Button>
      <Text textAlign="center" color="$blue10" size="$2" onPress={onSwitchSignIn}>
        Đã có tài khoản? Đăng nhập
      </Text>
    </YStack>
  )
}