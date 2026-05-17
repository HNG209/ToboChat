import React, { useState } from 'react'
import { YStack, XStack, Input, Button, Text, Spinner, H3, Paragraph } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'
import { signUp, confirmSignUp } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'

export function SignUpForm() {
  const router = useRouter()
  const [step, setStep] = useState<'FILL' | 'CONFIRM'>('FILL')
  const [form, setForm] = useState({ email: '', password: '', name: '', code: '' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async () => {
    // client-side validation before calling signUp
    setError('')
    if (!form.name?.trim()) {
      setError('Vui lòng nhập họ tên.')
      return
    }
    if (!form.email?.trim()) {
      setError('Vui lòng nhập email.')
      return
    }
    if (!form.password || form.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (form.password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    try {
      await signUp({
        username: form.email,
        password: form.password,
        options: { userAttributes: { email: form.email, name: form.name } }
      })
      setStep('CONFIRM')
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại.')
    } finally { setLoading(false) }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: form.email,
        confirmationCode: form.code
      })
      if (isSignUpComplete) {
        router.push('/login')
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
    <YStack space="$3" flex={1} alignItems="center" justifyContent="center" pt="$2">
      <YStack space="$1" mb="$2" alignItems="center">
        <H3 fontWeight="900" fontSize="$8" color="$color12" letterSpacing={-0.5}>
          Tạo tài khoản
        </H3>
        <Paragraph color="$color10" textAlign="center">
          Điền thông tin để bắt đầu trò chuyện.
        </Paragraph>
      </YStack>

      {error ? <Text color="$red10">{error}</Text> : null}
      <Input $sm={{ width: '40%' }} placeholder="Họ tên" onChangeText={(txt) => setForm({ ...form, name: txt })} />
      <Input $sm={{ width: '40%' }} placeholder="Email" onChangeText={(txt) => setForm({ ...form, email: txt })} />
      <Input $sm={{ width: '40%' }} placeholder="Mật khẩu" secureTextEntry value={form.password} onChangeText={(txt) => setForm({ ...form, password: txt })} />
      <Input $sm={{ width: '40%' }} placeholder="Nhập lại mật khẩu" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
      <Button $sm={{ width: '40%' }} themeInverse onPress={handleSignUp} disabled={loading}>{loading ? <Spinner /> : <Text>Đăng ký</Text>}</Button>
      <XStack justifyContent="center" alignItems="center">
        <Paragraph size="$2" color="$gray10">Đã có tài khoản?</Paragraph>
        <XStack
          ml="$2"
          cursor="pointer"
          onPress={() => router.push('/login')}
          hoverStyle={{ scale: 1.03 }}
          pressStyle={{ scale: 0.97, opacity: 0.85 }}
          alignItems="center"
        >
          <Text color="$blue10" fontWeight="bold">Đăng nhập</Text>
          <ChevronRight size={16} color="#1677FF" style={{ marginLeft: 6 }} />
        </XStack>
      </XStack>
    </YStack>
  )
}