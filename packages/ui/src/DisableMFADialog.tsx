import { Dialog, Text, Button, Image, YStack } from '@my/ui'
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
        <Dialog.Overlay opacity={0.5} backgroundColor="#000" />

        <Dialog.Content padding="$5" width={400}>
          <YStack space="$3">
            <Text fontWeight="bold">Nhập mật khẩu để tắt xác thực 2 lớp</Text>

            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
            />

            <Button onPress={handleDisableMFA} disabled={isDisabling}>
              {isDisabling ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
