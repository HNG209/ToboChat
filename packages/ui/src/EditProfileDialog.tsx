import { X } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, Dialog, XStack, YStack, Label, Input } from 'tamagui'
interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onSave: (newName: string) => void
}

export const EditProfileDialog = ({
  open,
  onOpenChange,
  currentName,
  onSave,
}: ProfileDialogProps) => {
  const [tempName, setTempName] = useState(currentName)
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Dialog.Content
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          bordered
          elevate
          key="content"
          animation="quick"
          width={400}
          padding={0}
          borderRadius="$4"
          backgroundColor="$background"
          overflow="hidden"
        >
          {/* Header */}
          <XStack
            padding="$3"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderColor="$borderColor"
          >
            <Dialog.Title fontSize="$5" fontWeight="600">
              Thông tin tài khoản
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="$2" circular icon={X} chromeless />
            </Dialog.Close>
          </XStack>

          {/* Body */}
          <YStack padding="$4" space="$3">
            <YStack space="$2">
              <Label fontSize="$3" color="$colorFocus">
                Tên hiển thị
              </Label>
              <Input
                value={tempName}
                onChangeText={setTempName}
                borderWidth={1}
                focusStyle={{ borderColor: '$blue10' }}
              />
            </YStack>
            <Button
              themeInverse
              borderRadius="$10"
              onPress={() => {
                onSave(tempName)
                onOpenChange(false)
              }}
            >
              Lưu thay đổi
            </Button>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
