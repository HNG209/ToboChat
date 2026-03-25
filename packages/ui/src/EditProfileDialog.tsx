import { X } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'
import { Button, Dialog, XStack, YStack, Label, Input, Image } from 'tamagui'
import { Platform } from 'react-native'
interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  currentAvatar?: string
  onSave: (data: { name?: string; avatar?: File }) => void
}

export const EditProfileDialog = ({
  open,
  onOpenChange,
  currentName,
  currentAvatar,
  onSave,
}: ProfileDialogProps) => {
  const [tempName, setTempName] = useState(currentName)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | undefined>(currentAvatar)

  useEffect(() => {
    setTempName(currentName)
    setPreview(currentAvatar)
    setFile(null)
  }, [currentName, currentAvatar])

  // 👉 chọn file + preview luôn
  const handleChooseFile = (e: any) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }
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
              Chỉnh sửa thông tin cá nhân
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="$2" circular icon={X} chromeless />
            </Dialog.Close>
          </XStack>

          {/* Body */}
          <YStack padding="$4" space="$4">
            {/* Avatar */}
            <YStack alignItems="center" space="$2">
              <Image
                source={{
                  uri: preview || currentAvatar || 'https://i.pravatar.cc/300',
                }}
                width={100}
                height={100}
                borderRadius={50}
              />

              {Platform.OS === 'web' && <input type="file" onChange={handleChooseFile} />}
            </YStack>

            {/* Name */}
            <YStack space="$2">
              <Label>Tên hiển thị</Label>
              <Input value={tempName} onChangeText={setTempName} />
            </YStack>

            {/* Button */}
            <Button
              themeInverse
              borderRadius="$10"
              onPress={() => {
                onSave({ name: tempName, avatar: file || undefined })
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
