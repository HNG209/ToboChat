import { Dialog, Text, Button, Image, YStack, Input, XStack } from '@my/ui'
import { X } from '@tamagui/lucide-icons'
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
        setOpenEnableMFA(open)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="100ms"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="#000"
        />

        <Dialog.Content
          key="content"
          bordered
          elevate
          animation="100ms"
          enterStyle={{ opacity: 0, scale: 0.98 }}
          exitStyle={{ opacity: 0, scale: 0.98 }}
          padding="$4"
          width="92%"
          maxWidth={420}
          backgroundColor="$background"
        >
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
            <Text fontWeight="700" fontSize="$6">
              Bảo mật 2 lớp
            </Text>
            <Button
              size="$3"
              circular
              chromeless
              icon={X}
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
              pressStyle={{ opacity: 0.6 }}
              onPress={() => setOpenEnableMFA(false)}
            />
          </XStack>

          {!secretCode && (
            <YStack space="$3">
              <Text color="$color10" fontSize="$2">
                Nhập mật khẩu để bật bảo mật 2 lớp
              </Text>

              <Input
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
              />

              <XStack justifyContent="flex-end" space="$2">
                <Button chromeless onPress={() => setOpenEnableMFA(false)}>
                  Đóng
                </Button>
                <Button themeInverse onPress={handleSubmitPassword}>
                  Tiếp tục
                </Button>
              </XStack>
            </YStack>
          )}

          {secretCode && (
            <YStack space="$3">
              <Text color="$color10" fontSize="$2">
                Quét QR bằng Google Authenticator (hoặc app tương tự), sau đó nhập mã OTP 6 số.
              </Text>

              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    otpUri || ''
                  )}`,
                }}
                style={{ width: 200, height: 200 }}
              />

              <Input
                placeholder="Nhập mã OTP"
                keyboardType="number-pad"
                value={otpCode}
                onChangeText={setOtpCode}
              />

              <XStack justifyContent="flex-end" space="$2">
                <Button chromeless onPress={() => setOpenEnableMFA(false)}>
                  Đóng
                </Button>
                <Button themeInverse onPress={handleVerifyOTP}>
                  Xác nhận
                </Button>
              </XStack>
            </YStack>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
