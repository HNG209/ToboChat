import { Dialog, Text, Button, Image, YStack } from '@my/ui'
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
        <Dialog.Overlay opacity={0.5} backgroundColor="#000" />

        <Dialog.Content padding="$5" width={400}>
          {!secretCode && (
            <YStack space="$3">
              <Text fontWeight="bold">Nhập lại mật khẩu</Text>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button onPress={handleSubmitPassword}>Xác nhận</Button>
            </YStack>
          )}

          {secretCode && (
            <YStack space="$3">
              <Text fontWeight="bold">Quét mã bằng Google Authenticator</Text>

              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/YourApp?secret=${secretCode}&issuer=YourApp`,
                }}
                style={{ width: 200, height: 200 }}
              />

              <input
                type="text"
                placeholder="Nhập mã OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />

              <Button onPress={handleVerifyOTP}>Xác nhận OTP</Button>
            </YStack>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
