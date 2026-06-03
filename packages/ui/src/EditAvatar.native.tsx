import { X } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'
import { Button, Dialog, Text, UserAvatar, XStack, YStack } from '@my/ui'
import * as ImagePicker from 'expo-image-picker'

type NativeAvatarFile = {
  uri: string
  name: string
  type: string
}

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName?: string
  currentAvatar?: string
  onSave: (data: { name?: string; avatar?: NativeAvatarFile }) => void | Promise<void>
}

export const EditAvatar = ({
  open,
  onOpenChange,
  currentName,
  currentAvatar,
  onSave,
}: ProfileDialogProps) => {
  const [file, setFile] = useState<NativeAvatarFile | null>(null)
  const [preview, setPreview] = useState<string | undefined>(currentAvatar)
  const [isSaving, setIsSaving] = useState(false)

  const canSave = Boolean(file) && !isSaving

  useEffect(() => {
    setPreview(currentAvatar)
    setFile(null)
  }, [currentName, currentAvatar, open])

  const handleChooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })

    if (result.canceled) return

    const asset = result.assets[0]
    if (!asset?.uri) return

    const selectedFile = {
      uri: asset.uri,
      name: asset.fileName || `avatar-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    }

    setFile(selectedFile)
    setPreview(asset.uri)
  }

  const handleSave = async () => {
    if (!file || isSaving) return

    try {
      setIsSaving(true)
      await onSave({ avatar: file })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <YStack
        position="absolute"
        fullscreen
        zIndex={100000}
        alignItems="center"
        justifyContent="center"
      >
        <Dialog.Overlay
          opacity={0.5}
          backgroundColor="#000"
          zIndex={100000}
        />

        <Dialog.Content
          bordered
          elevate
          width="90%"
          maxWidth={400}
          padding={0}
          borderRadius="$4"
          backgroundColor="$background"
          overflow="hidden"
          zIndex={100001}
        >
          <XStack
            padding="$2"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderColor="$borderColor"
          >
            <Dialog.Title asChild unstyled>
              <Text fontSize="$5" fontWeight="700">
                Chỉnh sửa hình ảnh
              </Text>
            </Dialog.Title>

            <Button
              size="$1"
              circular
              icon={X}
              chromeless
              onPress={() => onOpenChange(false)}
            />
          </XStack>

          <YStack padding="$4" space="$4">
            <YStack alignItems="center" space="$2">
              <UserAvatar
                name={currentName}
                avatarUrl={preview || currentAvatar}
                size={100}
                borderWidth={2}
                borderColor="$borderColor"
              />

              <Button borderRadius="$10" onPress={handleChooseImage}>
                Chọn ảnh
              </Button>
            </YStack>

            <Button
              themeInverse
              borderRadius="$10"
              disabled={!canSave}
              opacity={!canSave ? 0.6 : 1}
              onPress={handleSave}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </YStack>
        </Dialog.Content>
      </YStack>
    </Dialog>
  )
}
