// Chinh sua anh dai dien
import { X } from '@tamagui/lucide-icons'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button, Dialog, Image, Text, View, XStack, YStack } from '@my/ui'
import { Platform } from 'react-native'
interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  currentAvatar?: string
  onSave: (data: { name?: string; avatar?: File }) => void | Promise<void>
}

export const EditAvatar = ({
  open,
  onOpenChange,
  currentName,
  currentAvatar,
  onSave,
}: ProfileDialogProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | undefined>(currentAvatar)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const canSave = Boolean(file) && !isSaving

  useEffect(() => {
    setPreview(currentAvatar)
    setFile(null)
  }, [currentName, currentAvatar])

  // 👉 chọn file + preview luôn
  const handleChooseFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
      console.log('[avatar] selected file', {
        name: selected.name,
        type: selected.type,
        size: selected.size,
      })
    }
  }

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          backgroundColor="#000"
          zIndex={100000}
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
          enterStyle={{ opacity: 0, scale: 0.98, y: -10 }}
          exitStyle={{ opacity: 0, scale: 0.98, y: -10 }}
          width={400}
          padding={0}
          borderRadius="$4"
          backgroundColor="$background"
          overflow="hidden"
        >
          {/* Header */}
          <XStack
            padding="$2"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderColor="$borderColor"
          >
            <Dialog.Title asChild unstyled>
              <Text fontSize="$5" fontWeight="700" color="$color">
                Chỉnh sửa hình ảnh
              </Text>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="$1" circular icon={X} chromeless />
            </Dialog.Close>
          </XStack>

          {/* Body */}
          <YStack padding="$4" space="$4">
            {/* Avatar */}
            <YStack alignItems="center" space="$2">
              <View
                width={100}
                height={100}
                borderRadius={999}
                borderWidth={2}
                borderColor="$borderColor"
                overflow="hidden"
                backgroundColor="$background"
              >
                <Image
                  source={{
                    uri:
                      preview ||
                      currentAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(currentName || 'User')}&background=random`,
                  }}
                  width="100%"
                  height="100%"
                />
              </View>

              {Platform.OS === 'web' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChooseFile}
                    style={{ display: 'none' }}
                  />
                  <Button borderRadius="$10" onPress={handleOpenFilePicker}>
                    Chọn ảnh
                  </Button>
                </>
              )}
            </YStack>

            {/* Button */}
            <Button
              themeInverse
              borderRadius="$10"
              disabled={!canSave}
              onPress={async () => {
                if (!file || isSaving) return

                try {
                  console.log('[avatar] save clicked', {
                    fileName: file.name,
                    type: file.type,
                    size: file.size,
                  })
                  setIsSaving(true)
                  await onSave({ avatar: file || undefined })
                  onOpenChange(false)
                } catch (err) {
                  const details =
                    err instanceof Error
                      ? err.message
                      : typeof err === 'object'
                        ? JSON.stringify(err)
                        : String(err)
                  console.warn('[avatar] EditAvatar save failed:', details)
                } finally {
                  setIsSaving(false)
                }
              }}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
