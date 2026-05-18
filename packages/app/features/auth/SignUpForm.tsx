"use client"
import React, { useState } from 'react'
import { YStack, XStack, Input, Button, Text, Spinner, H3, Paragraph } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'
// THÊM: resendSignUpCode để kích hoạt gửi lại mã
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'

export function SignUpForm() {
  const router = useRouter()
  const [step, setStep] = useState<'FILL' | 'CONFIRM'>('FILL')
  const [form, setForm] = useState({ email: '', password: '', name: '', code: '' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('') // Quản lý thông báo gửi lại mã thành công

  const handleSignUp = async () => {
    setError('')
    setSuccessMessage('')
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
        username: form.email.trim(),
        password: form.password,
        options: { userAttributes: { email: form.email.trim(), name: form.name.trim() } }
      })
      setStep('CONFIRM')
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại.')
    } finally { setLoading(false) }
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: form.email.trim(),
        confirmationCode: form.code.trim()
      })
      if (isSignUpComplete) {
        router.push('/login')
      }
    } catch (err: any) {
      setError(err.message || 'Mã xác nhận không hợp lệ.')
    } finally { setLoading(false) }
  }

  // HÀM XỬ LÝ GỬI LẠI MÃ XÁC NHẬN
  const handleResendCode = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      await resendSignUpCode({ username: form.email.trim() })
      setSuccessMessage('Mã xác nhận mới đã được gửi vào email của bạn!')
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã xác nhận lúc này.')
    } finally {
      setLoading(false)
    }
  }

  // Giao diện Bước 2: Nhập mã OTP xác nhận đăng ký
  if (step === 'CONFIRM') {
    return (
      <YStack space="$4" width="100%" px="$2">
        <YStack space="$1" alignItems="center" mb="$2">
          <H3 fontWeight="900" fontSize="$9" color="$color12" textAlign="center">
            Xác nhận Email
          </H3>
          <Paragraph color="$color10" textAlign="center" fontSize="$3">
            Nhập mã xác nhận đã gửi đến email của bạn.
          </Paragraph>
        </YStack>

        {error ? (
          <Text color="$red10" textAlign="center" bg="$red2" p="$2" borderRadius="$4" fontSize="$2" width="100%">
            {error}
          </Text>
        ) : null}

        {successMessage ? (
          <Text color="$green10" textAlign="center" bg="$green2" p="$2" borderRadius="$4" fontSize="$2" width="100%">
            {successMessage}
          </Text>
        ) : null}

        <Input
          width="100%"
          placeholder="Mã xác nhận (6 số)"
          backgroundColor="$background"
          keyboardType="number-pad"
          size="$4"
          value={form.code}
          onChangeText={(txt) => setForm({ ...form, code: txt })}
        />

        <Button
          width="100%"
          backgroundColor="$blue10"
          size="$4"
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? <Spinner color="white" /> : <Text fontWeight="bold" color="white">Xác nhận tài khoản</Text>}
        </Button>

        {/* NÚT BẤM GỬI LẠI MÃ */}
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
        <Button variant="outlined" size="$4" width="100%" onPress={() => setStep('FILL')} disabled={loading}>
          <Text color="$color12">Quay lại</Text>
        </Button>
      </YStack>
    )
  }

  // Giao diện Bước 1: Điền thông tin tạo tài khoản
  return (
    <YStack space="$3" width="100%" px="$2">
      <YStack space="$3" alignItems="center" mb="$2">
        <H3 fontWeight="900" fontSize="$9" color="$color12" textAlign="center">
          Tạo tài khoản
        </H3>
        <Paragraph color="$color10" textAlign="center" fontSize="$3">
          Điền thông tin để bắt đầu trò chuyện.
        </Paragraph>
      </YStack>

      {error ? (
        <Text color="$red10" textAlign="center" bg="$red2" p="$2" borderRadius="$4" fontSize="$2" width="100%">
          {error}
        </Text>
      ) : null}

      <Input
        width='100%'
        placeholder="Họ tên"
        backgroundColor="$background"
        size="$4"
        onChangeText={(txt) => setForm({ ...form, name: txt })}
      />
      <Input
        width='100%'
        placeholder="Email"
        backgroundColor="$background"
        size="$4"
        autoCapitalize="none"
        onChangeText={(txt) => setForm({ ...form, email: txt })}
      />
      <Input
        width='100%'
        placeholder="Mật khẩu"
        backgroundColor="$background"
        size="$4"
        secureTextEntry
        value={form.password}
        onChangeText={(txt) => setForm({ ...form, password: txt })}
      />
      <Input
        width='100%'
        placeholder="Nhập lại mật khẩu"
        backgroundColor="$background"
        size="$4"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Button
        width='100%'
        backgroundColor="$blue10"
        size="$4"
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? <Spinner color="white" /> : <Text fontWeight="bold" color="white">Đăng ký</Text>}
      </Button>

      <XStack justifyContent="center" alignItems="center" mt="$1" flexWrap="wrap">
        <Paragraph size="$2" color="$gray10">Đã có tài khoản?</Paragraph>
        <XStack
          ml="$2"
          onPress={() => router.push('/login')}
          alignItems="center"
        >
          <Text cursor='pointer' color="$blue10" fontWeight="bold" size="$2">Đăng nhập</Text>
        </XStack>
      </XStack>
    </YStack>
  )
}