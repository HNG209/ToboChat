import { Camera, X } from '@tamagui/lucide-icons'
import { useMemo, useState } from 'react'
import { Button, Dialog, Image, Text, View, XStack, YStack, Spacer } from '@my/ui'
import { EditProfileDialog } from './EditProfileDialog'
import { EditAvatar } from './EditAvatar'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileData?: any
  onSave: (data: { name?: string; avatar?: File; dateOfBirth?: string }) => void
  avatarCacheKey?: number
  avatarUrlOverride?: string
}

export const ProfileDialog = ({
  open,
  onOpenChange,
  profileData,
  onSave,
  avatarCacheKey,
  avatarUrlOverride,
}: ProfileDialogProps) => {
  const userData = profileData?.result ?? profileData

  const withCacheBuster = (url?: string) => {
    if (!url || !avatarCacheKey) return url
    return `${url}${url.includes('?') ? '&' : '?'}v=${avatarCacheKey}`
  }

  const [openEditProfile, setOpenEditProfile] = useState(false)
  const [openEditAvatar, setOpenEditAvatar] = useState(false)

  const effectiveAvatarUrl = avatarUrlOverride ?? userData?.avatarUrl

  const formattedDob = useMemo(() => {
    const raw = userData?.dateOfBirth
    if (!raw) return undefined
    // Nếu backend trả ISO, thử format nhẹ cho dễ đọc
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) {
      const day = `${d.getDate()}`.padStart(2, '0')
      const month = `${d.getMonth() + 1}`.padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    }
    return raw
  }, [userData?.dateOfBirth])

  return (
    <>
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
              <Dialog.Title asChild>
                <Text fontSize="$3" fontWeight="700" color="$color">
                  Thông tin tài khoản
                </Text>
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button size="$1" circular icon={X} chromeless />
              </Dialog.Close>
            </XStack>

            {/* Body */}
            <YStack padding="$4" space="$4">
              {/* Avatar center */}
              <YStack alignItems="center" space="$2">
                <View position="relative">
                  <View
                    width={96}
                    height={96}
                    borderRadius={999}
                    borderWidth={2}
                    borderColor="$borderColor"
                    overflow="hidden"
                    backgroundColor="$background"
                  >
                    <Image
                      key={
                        withCacheBuster(effectiveAvatarUrl) ||
                        effectiveAvatarUrl ||
                        userData?.avatarUrl ||
                        'avatar'
                      }
                      source={{
                        uri:
                          withCacheBuster(effectiveAvatarUrl) ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=random`,
                      }}
                      width="100%"
                      height="100%"
                    />
                  </View>

                  {/* Edit avatar button */}
                  <Button
                    position="absolute"
                    bottom={0}
                    right={0}
                    size="$2"
                    circular
                    icon={Camera}
                    backgroundColor="$background"
                    borderWidth={1}
                    borderColor="$borderColor"
                    onPress={() => {
                      setOpenEditAvatar(true)
                      setOpenEditProfile(false)
                      onOpenChange(false)
                    }}
                    aria-label="Chỉnh sửa avatar"
                  />
                </View>
              </YStack>

              {/* Personal info */}
              <YStack space="$2">
                <Text fontWeight="600" fontSize="$4">
                  Thông tin cá nhân
                </Text>

                <InfoRow label="Họ tên" value={userData?.name} optional />
                <InfoRow label="Ngày sinh" value={formattedDob} optional />
              </YStack>

              <Spacer size="$2" />

              {/* Update button */}
              <Button
                themeInverse
                borderRadius="$10"
                onPress={() => {
                  setOpenEditProfile(true)
                  setOpenEditAvatar(false)
                  onOpenChange(false)
                }}
              >
                Cập nhật
              </Button>
            </YStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <EditAvatar
        open={openEditAvatar}
        onOpenChange={setOpenEditAvatar}
        currentAvatar={withCacheBuster(effectiveAvatarUrl)}
        currentName={userData?.name}
        onSave={onSave}
      />
      <EditProfileDialog
        open={openEditProfile}
        onOpenChange={setOpenEditProfile}
        currentName={userData?.name}
        currentDateOfBirth={userData?.dateOfBirth}
        onSave={onSave}
      />
    </>
  )
}

// Component phụ để render dòng thông tin
const InfoRow = ({
  label,
  value,
  optional,
}: {
  label: string
  value?: string
  optional?: boolean
}) => {
  const displayValue = value?.trim() ? value : optional ? 'Chưa cập nhật' : ''

  return (
    <XStack space="$4" paddingVertical="$1" alignItems="flex-start">
      <Text width={110} color="$colorFocus" fontSize="$3">
        {label}
      </Text>
      <Text fontSize="$3" color={displayValue === 'Chưa cập nhật' ? '$color10' : '$color'}>
        {displayValue}
      </Text>
    </XStack>
  )
}
