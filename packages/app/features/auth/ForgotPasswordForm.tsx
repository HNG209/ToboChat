import React, { useState } from 'react'
import { YStack, Input, Button, Text, Spinner, Paragraph } from 'tamagui'
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth'
import { useToastController } from '@my/ui'

export function ForgotPasswordForm({ onBackToSignIn }) {
  const toast = useToastController()
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
      onBackToSignIn()
    } catch (err: any) {
      setError(err.message || 'Mã xác nhận không đúng hoặc đã hết hạn.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack space="$4" width="100%" mt="$2">
      <Paragraph size="$3" color="$color10" textAlign="center" px="$2">
        {step === 'SEND_CODE'
          ? 'Nhập email để nhận mã xác thực đặt lại mật khẩu.'
          : `Mã xác nhận đã được gửi đến: ${email}`}
      </Paragraph>

      {error && (
        <Text color="$red10" size="$2" textAlign="center" bg="$red2" p="$2" borderRadius="$4">
          {error}
        </Text>
      )}

      {step === 'SEND_CODE' ? (
        <YStack space="$3">
          <Input
            height={50}
            width="100%"
            placeholder="Email của bạn"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button height={50} width="100%" onPress={handleSendCode} disabled={loading} themeInverse>
            {loading ? <Spinner /> : "Gửi mã xác nhận"}
          </Button>
        </YStack>
      ) : (
        <YStack space="$3">
          <Input
            height={50}
            width="100%"
            placeholder="Mã xác nhận (6 số)"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
          />
          <Input
            height={50}
            width="100%"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Button height={50} width="100%" onPress={handleResetPassword} disabled={loading} themeInverse>
            {loading ? <Spinner /> : "Xác nhận đổi mật khẩu"}
          </Button>

          <Text
            textAlign="center"
            size="$2"
            color="$blue10"
            onPress={() => setStep('SEND_CODE')}
            mt="$2"
          >
            Gửi lại mã khác?
          </Text>
        </YStack>
      )}

      <Button width="100%" variant="outline" onPress={onBackToSignIn} borderSize={0}>
        Quay lại đăng nhập
      </Button>
    </YStack>
  )
}