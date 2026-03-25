import { Dialog, Text, Button, Image, YStack, Input } from '@my/ui'
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
        if (!open) {
          setDisablePassword('')
          setIsTwoFactorAuth(true) // rollback switch
        }
        setOpenDisableMFA(open)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" opacity={0.5} backgroundColor="#000" />

        <Dialog.Content key="content" padding="$5" width={400}>
          <YStack space="$3">
            <Text fontWeight="bold">Nhập mật khẩu để tắt xác thực 2 lớp</Text>

            <Input secureTextEntry value={disablePassword} onChangeText={setDisablePassword} />

            <Button onPress={handleDisableMFA} disabled={isDisabling}>
              {isDisabling ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
