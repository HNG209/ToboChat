import React, { useState } from 'react'
import { YStack, Input, Button, Text, Spinner, Paragraph, H3 } from 'tamagui'
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth'
import { useToastController } from '@my/ui'
import { useRouter } from 'solito/navigation'

export function ForgotPasswordForm() {
  const toast = useToastController()
  const router = useRouter()
  const [step, setStep] = useState<'SEND_CODE' | 'CONFIRM_RESET'>('SEND_CODE')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async () => {
    if (!email) return setError('Vui lòng nhập email hợp lệ')
    setLoading(true)
    setError('')
    try {
      // Amplify cần email để gửi code
      await resetPassword({ username: email.trim() })
      setStep('CONFIRM_RESET')
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!code || !newPassword) return setError('Vui lòng nhập đủ mã và mật khẩu mới')
    if (newPassword.length < 8) return setError('Mật khẩu phải ít nhất 8 ký tự')

    setLoading(true)
    setError('')
    try {
      await confirmResetPassword({
        // QUAN TRỌNG: Phải có email ở đây
        username: email.trim(),
        confirmationCode: code.trim(),
        newPassword,
      })
      toast.show('Thành công!', { message: 'Mật khẩu đã được thay đổi.' })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:switch-view', { detail: 'SIGNIN' }))
      } else {
        router.push('/login')
      }
    } catch (err: any) {
      setError(err.message || 'Mã xác nhận không đúng hoặc đã hết hạn.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack space="$4" width='100%' alignItems='center' flex={1} pt="$2" justifyContent="center">
      <YStack space="$1" mb="$2" alignItems="center">
        <H3 fontWeight="700" fontSize="$8" color="$color12" letterSpacing={-0.5}>
          {step === 'SEND_CODE' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
        </H3>
        <Paragraph color="$color10" textAlign="center">
          {step === 'SEND_CODE'
            ? 'Nhập email để nhận mã xác thực đặt lại mật khẩu.'
            : `Mã xác nhận đã được gửi đến: ${email}`}
        </Paragraph>
      </YStack>

      {error ? (
        <Text color="$red10" textAlign="center" bg="$red2" p="$2" borderRadius="$4">
          {error}
        </Text>
      ) : null}

      {step === 'SEND_CODE' ? (
        < YStack space="$1" mb="$2" alignItems="center">
          <Input
            height={50}
            width='100%'
            placeholder="Email của bạn"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button mt="$4" height={50} justifyContent="center" alignItems="center" width='60%' onPress={handleSendCode} disabled={loading} themeInverse>
            {loading ? <Spinner /> : <Text>Gửi mã xác nhận</Text>}
          </Button>
        </YStack>
      ) : (
        <YStack space="$3" alignItems="center">
          <Input
            height={50}
            width="60%"
            $sm={{ width: '40%' }}
            placeholder="Mã xác nhận (6 số)"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
          />
          <Input
            height={50}
            width="60%"
            $sm={{ width: '40%' }}
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Button height={50} width="60%" onPress={handleResetPassword} disabled={loading} themeInverse>
            {loading ? <Spinner /> : <Text>Xác nhận đổi mật khẩu</Text>}
          </Button>

          <Text
            textAlign="center"
            color="$blue10"
            onPress={() => setStep('SEND_CODE')}
            mt="$2"
          >
            Gửi lại mã khác?
          </Text>
        </YStack>
      )}

      <Button
        $sm={{ width: '40%' }}
        variant="outlined"
        onPress={() => {
          router.push('/login')
        }}
      >
        <Text>Quay lại đăng nhập</Text>
      </Button>
    </YStack>
  )
}