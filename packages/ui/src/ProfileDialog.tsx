import { Camera, Edit3, Pen, Settings, X } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, Dialog, Image, Text, View, XStack, YStack, Spacer } from '@my/ui'
import { EditProfileDialog } from './EditProfileDialog'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileData?: any
}

export const ProfileDialog = ({ open, onOpenChange, profileData }: ProfileDialogProps) => {
  const userData = profileData?.result
  const [openEditName, setOpenEditName] = useState(false)
  const [displayName, setDisplayName] = useState(userData?.name || 'Le Ngoc Dung')

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
            <Dialog.Title fontSize="$5" fontWeight="500">
              Thông tin tài khoản
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="$2" circular icon={X} chromeless />
            </Dialog.Close>
          </XStack>

          {/* Body */}
          <YStack>
            {/* Phần ảnh bìa và Avatar */}
            <View height={160} width="100%" position="relative">
              {/* Ảnh bìa */}
              <Image
                source={{ uri: 'https://picsum.photos/400/200' }} // Thay bằng link ảnh bìa thật
                width="100%"
                height="100%"
                objectFit="cover"
              />

              {/* Avatar lồng vào ảnh bìa */}
              <View position="absolute" bottom={-35} left={20} zIndex={10}>
                <View
                  width={80}
                  height={80}
                  borderRadius={100}
                  borderWidth={3}
                  borderColor="$background"
                  overflow="hidden"
                  backgroundColor="$background"
                >
                  <Image source={{ uri: userData?.avatar }} width="100%" height="100%" />
                </View>
                {/* Nút camera sửa avatar */}
                <Button
                  position="absolute"
                  bottom={0}
                  right={0}
                  size="$2"
                  circular
                  icon={Camera}
                  scale={0.8}
                  backgroundColor="$background"
                  borderWidth={1}
                  borderColor="$borderColor"
                />
              </View>
            </View>

            {/* Tên và thông tin phía dưới */}
            <YStack paddingHorizontal="$4" marginTop="$10" space="$3">
              <XStack alignItems="center" space="$2">
                <Text fontWeight="700" fontSize="$6">
                  {userData?.name || 'No Name'}
                </Text>
                <Button
                  size="$1"
                  onPress={() => setOpenEditName(true)}
                  chromeless
                  icon={Pen}
                  padding={0}
                />
              </XStack>

              <YStack space="$2" marginTop="$2">
                <Text fontWeight="600" fontSize="$4">
                  Thông tin cá nhân
                </Text>

                <InfoRow label="Bio" value="ジュン 🌿" isBlue />
                <InfoRow label="Giới tính" value="Nữ" />
                <InfoRow label="Ngày sinh" value="21 tháng 03, 2004" />
                <InfoRow label="Điện thoại" value="+84 374 288 019" />
                <Text fontSize="$2" color="$colorFocus" marginTop="$1">
                  Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này
                </Text>
              </YStack>

              <Spacer size="$4" />

              {/* Nút chỉnh sửa dưới cùng */}
              <Button
                themeInverse
                icon={Pen}
                borderRadius="$10"
                marginBottom="$4"
                // Form mo edit name
                onPress={() => setOpenEditName(true)}
              >
                Cập nhật
              </Button>
            </YStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
      <EditProfileDialog
        open={openEditName}
        onOpenChange={setOpenEditName}
        currentName={displayName}
        onSave={(newName: string) => setDisplayName(newName)}
      ></EditProfileDialog>
    </Dialog>
  )
}

// Component phụ để render dòng thông tin
const InfoRow = ({ label, value, isBlue }: { label: string; value: string; isBlue?: boolean }) => (
  <XStack space="$4" paddingVertical="$1">
    <Text width={80} color="$colorFocus" fontSize="$3">
      {label}
    </Text>
    <Text fontSize="$3" color={isBlue ? '$blue10' : '$color'}>
      {value}
    </Text>
  </XStack>
)
