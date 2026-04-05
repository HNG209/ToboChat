import { X } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'

import { Button, Dialog, XStack, YStack, Label, Input, Text } from '@my/ui'
import { DatePickerField } from './DatePickerField'
interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  currentDateOfBirth?: string
  onSave: (data: { name?: string; dateOfBirth?: string }) => void
}

export const EditProfileDialog = ({
  open,
  onOpenChange,
  currentName,
  currentDateOfBirth,
  onSave,
}: ProfileDialogProps) => {
  const [tempName, setTempName] = useState(currentName)
  const [tempDob, setTempDob] = useState(currentDateOfBirth || '')

  const normalizeDobForInput = (dob?: string) => {
    if (!dob) return ''
    // ISO -> YYYY-MM-DD (để input type=date nhận)
    if (dob.includes('T')) return dob.slice(0, 10)
    return dob
  }

  useEffect(() => {
    setTempName(currentName)
    setTempDob(normalizeDobForInput(currentDateOfBirth))
  }, [currentName, currentDateOfBirth])

  const handleSave = () => {
    const dob = tempDob.trim()
    onSave({ name: tempName, dateOfBirth: dob ? dob : undefined })
    onOpenChange(false)
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
            padding="$2"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderColor="$borderColor"
          >
            <Dialog.Title asChild>
              <Text fontSize="$3" fontWeight="700" color="$color">
                Chỉnh sửa thông tin cá nhân
              </Text>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="$1" circular icon={X} chromeless />
            </Dialog.Close>
          </XStack>

          {/* Body */}
          <YStack padding="$4" space="$4">
            {/* Name */}
            <YStack space="$2">
              <Label>Tên hiển thị</Label>
              <Input value={tempName} onChangeText={setTempName} />
            </YStack>

            {/* DOB */}
            <YStack space="$2">
              <Label>Ngày sinh</Label>
              <DatePickerField value={tempDob} onChange={setTempDob} placeholder="YYYY-MM-DD" />
              <Text fontSize="$2" color="$color10">
                Trống nếu bạn chưa muốn cập nhật
              </Text>
            </YStack>

            {/* Button */}
            <Button themeInverse borderRadius="$10" onPress={handleSave}>
              Lưu thay đổi
            </Button>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
