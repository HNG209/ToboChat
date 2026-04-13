import { Dialog, Text, Button, YStack, Input, XStack } from '@my/ui'
import { X } from '@tamagui/lucide-icons'
import React from 'react'

export const DisableMFADialog = ({
  openDisableMFA,
  setOpenDisableMFA,
  disablePassword,
  setDisablePassword,
  handleDisableMFA,
  isDisabling,
  setIsTwoFactorAuth,
}) => {
  return (
    <Dialog
      open={openDisableMFA}
      onOpenChange={(open) => {
        setOpenDisableMFA(open)

        if (!open) {
          requestAnimationFrame(() => {
            setDisablePassword('')
            setIsTwoFactorAuth(true) // rollback switch
          })
        }
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
              Tắt bảo mật 2 lớp
            </Text>
            <Button
              size="$3"
              circular
              chromeless
              icon={X}
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
              pressStyle={{ opacity: 0.6 }}
              onPress={() => setOpenDisableMFA(false)}
            />
          </XStack>

          <YStack space="$3">
            <Text color="$color10" fontSize="$2">
              Nhập mật khẩu để xác nhận tắt bảo mật 2 lớp
            </Text>

            <Input
              secureTextEntry
              value={disablePassword}
              onChangeText={setDisablePassword}
              placeholder="Nhập mật khẩu"
            />

            <XStack justifyContent="flex-end" space="$2">
              <Button chromeless onPress={() => setOpenDisableMFA(false)}>
                Đóng
              </Button>
              <Button themeInverse onPress={handleDisableMFA} disabled={isDisabling}>
                {isDisabling ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
