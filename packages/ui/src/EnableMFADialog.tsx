import { Dialog, Text, Button, Image, YStack, Input, InputFrame } from '@my/ui'
import React from 'react'

export const EnableMFADialog = ({
  openEnableMFA,
  setOpenEnableMFA,
  isTwoFactorAuth,
  secretCode,
  password,
  otpCode,
  setPassword,
  setOtpCode,
  setSecretCode,
  handleSubmitPassword,
  handleVerifyOTP,
}) => {
  const otpUri = secretCode
    ? `otpauth://totp/ToboChat?secret=${secretCode}&issuer=ToboChat`
    : undefined

  return (
    <Dialog
      open={openEnableMFA}
      onOpenChange={(open) => {
        if (!open) {
          if (!isTwoFactorAuth) {
            setSecretCode(null)
            setPassword('')
            setOtpCode('')
          }
        }
        setOpenEnableMFA(open)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" opacity={0.5} backgroundColor="#000" />

        <Dialog.Content key="content" padding="$5" width={400}>
          {!secretCode && (
            <YStack space="$3">
              <Text fontWeight="bold">Nhập lại mật khẩu</Text>

              <Input secureTextEntry value={password} onChangeText={setPassword} />

              <Button onPress={handleSubmitPassword}>Xác nhận</Button>
            </YStack>
          )}

          {secretCode && (
            <YStack space="$3">
              <Text fontWeight="bold">Quét mã bằng Google Authenticator</Text>

              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    otpUri || ''
                  )}`,
                }}
                style={{ width: 200, height: 200 }}
              />

              <Input placeholder="Nhập mã OTP" value={otpCode} onChangeText={setOtpCode} />

              <Button onPress={handleVerifyOTP}>Xác nhận OTP</Button>
            </YStack>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
