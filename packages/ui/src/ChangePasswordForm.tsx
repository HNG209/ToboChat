import React, { useState } from 'react'
import { YStack, Text, Button, Input, Label } from '@my/ui'
import { updatePassword } from 'aws-amplify/auth'

const ChangePasswordForm = ({ onBack }) => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChangePassword = async () => {
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận không khớp.')
      return
    }

    setLoading(true)
    try {
      await updatePassword({ oldPassword, newPassword })

      setSuccess('Đổi mật khẩu thành công!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        setSuccess('')
        if (onBack) onBack()
      }, 1500)
    } catch (err) {
      setError(err.message || 'Đổi mật khẩu thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack space="$2">
      <Text fontSize={18} fontWeight="bold" mb="$2">
        Đổi mật khẩu
      </Text>

      <YStack>
        <Label htmlFor="old-password">Mật khẩu cũ</Label>
        <Input
          id="old-password"
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Nhập mật khẩu cũ"
          size="$4"
        />
      </YStack>

      <YStack>
        <Label htmlFor="new-password">Mật khẩu mới</Label>
        <Input
          id="new-password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nhập mật khẩu mới"
          size="$4"
        />
      </YStack>

      <YStack>
        <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
        <Input
          id="confirm-password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu mới"
          size="$4"
        />
      </YStack>

      {error && (
        <Text textAlign="center" marginTop="$2" color="red" fontSize={14}>
          {error}
        </Text>
      )}

      {success && (
        <Text textAlign="center" marginTop="$2" color="green" fontSize={14}>
          {success}
        </Text>
      )}

      <YStack space="$2" mt="$4">
        <Button theme="blue" onPress={handleChangePassword} disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Xác nhận'}
        </Button>
        <Button onPress={onBack} disabled={loading}>
          Quay lại
        </Button>
      </YStack>
    </YStack>
  )
}

export default ChangePasswordForm
