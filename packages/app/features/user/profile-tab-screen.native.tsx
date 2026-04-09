import { Camera, Check, X } from '@tamagui/lucide-icons'
import {
  Button,
  DatePickerField,
  Dialog,
  Image,
  Input,
  Label,
  ScrollView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
  Spacer,
} from '@my/ui'
import {
  useGetAvatarUploadUrlMutation,
  useGetProfileQuery,
  useUpdateMeMutation,
  userApi,
} from 'app/services/userApi'
import { getApiBaseUrl } from 'app/store/axiosClient'
import { uploadToPresignedUrl } from 'app/utils/uploadToPresignedUrl'
import type { AppDispatch } from 'app/store'
import React, { useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'

function guessMimeTypeFromFileName(fileName?: string): string | undefined {
  if (!fileName) return undefined
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.heic')) return 'image/heic'
  if (lower.endsWith('.heif')) return 'image/heif'
  return undefined
}

function normalizeDobForInput(dob?: string): string {
  if (!dob) return ''
  if (dob.includes('T')) return dob.slice(0, 10)
  return dob
}

function formatDobForDisplay(dob?: string): string | undefined {
  if (!dob) return undefined
  const d = new Date(dob)
  if (!Number.isNaN(d.getTime())) {
    const day = `${d.getDate()}`.padStart(2, '0')
    const month = `${d.getMonth() + 1}`.padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }
  return dob
}

function deriveFileUrlFromPresignedUrl(presignedUrl: string): string {
  try {
    const u = new URL(presignedUrl)
    return `${u.origin}${u.pathname}`
  } catch {
    return presignedUrl.split('?')[0]
  }
}

export default function ProfileTabScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const insets = useSafeAreaInsets()
  const {
    data: userProfileData,
    isFetching,
    isLoading,
    error: profileError,
    refetch,
  } = useGetProfileQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  })
  const userData = (userProfileData as any)?.result ?? userProfileData

  const [updateMe, { isLoading: isUpdatingMe }] = useUpdateMeMutation()
  const [getAvatarUploadUrl] = useGetAvatarUploadUrlMutation()

  const [avatarCacheKey, setAvatarCacheKey] = useState(0)
  const [optimisticAvatarUrl, setOptimisticAvatarUrl] = useState<string | undefined>(undefined)

  const [pendingAvatar, setPendingAvatar] = useState<
    | {
        uri: string
        fileName: string
        contentType: string
      }
    | undefined
  >(undefined)

  const [isAvatarConfirmOpen, setIsAvatarConfirmOpen] = useState(false)

  const withCacheBuster = (url?: string) => {
    if (!url || !avatarCacheKey) return url
    if (!/^https?:\/\//i.test(url)) return url
    return `${url}${url.includes('?') ? '&' : '?'}v=${avatarCacheKey}`
  }

  const effectiveAvatarUrl = optimisticAvatarUrl ?? userData?.avatarUrl
  const effectiveDobRaw = userData?.dob ?? userData?.dateOfBirth

  // Khi đổi tài khoản (A -> B) hoặc logout, phải reset optimistic state
  // để tránh hiển thị avatar của user cũ.
  React.useEffect(() => {
    setOptimisticAvatarUrl(undefined)
    setPendingAvatar(undefined)
    setAvatarCacheKey(0)
    setIsEditing(false)
  }, [userData?.id])

  const formattedDob = useMemo(() => formatDobForDisplay(effectiveDobRaw), [effectiveDobRaw])

  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState<string>('')
  const [tempDob, setTempDob] = useState<string>('')

  React.useEffect(() => {
    setTempName(userData?.name ?? '')
    setTempDob(normalizeDobForInput(effectiveDobRaw))
  }, [userData?.name, effectiveDobRaw])

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const handleCancelEdit = () => {
    setTempName(userData?.name ?? '')
    setTempDob(normalizeDobForInput(effectiveDobRaw))
    setIsEditing(false)
  }

  const patchProfileCache = (patch: (draft: any) => void) => {
    dispatch(
      userApi.util.updateQueryData('getProfile', undefined, (draft: any) => {
        if (!draft) return
        patch(draft)
      })
    )
  }

  const handlePickAvatar = async () => {
    if (isUploadingAvatar) return

    let ImagePicker: any | null = null
    try {
      const mod = await import('expo-image-picker')
      ImagePicker = (mod as any)?.default ?? mod
    } catch (err) {
      console.warn('[profile] expo-image-picker failed to load', err)
      Alert.alert(
        'Chưa hỗ trợ chọn ảnh',
        'Binary hiện tại chưa có expo-image-picker. Hãy build lại Dev Client / app sau khi cài dependency.'
      )
      return
    }

    if (!ImagePicker?.launchImageLibraryAsync) {
      console.warn('[profile] expo-image-picker is not available in this build')
      Alert.alert(
        'Chưa hỗ trợ chọn ảnh',
        'Binary hiện tại chưa có expo-image-picker. Hãy build lại Dev Client / app.'
      )
      return
    }

    let result: any
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.()
      if (perm && perm.granted === false) {
        Alert.alert(
          'Không có quyền truy cập',
          'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh.'
        )
        return
      }

      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images,
        quality: 1,
      })
    } catch (err) {
      console.warn('[profile] picking image failed', err)
      Alert.alert('Không thể chọn ảnh', 'Vui lòng thử lại sau khi build lại app.')
      return
    }

    if (result.canceled || !result.assets?.length) return

    const asset = result.assets[0]
    const fileName = asset.fileName || asset.name || 'avatar.jpg'
    const contentType =
      asset.mimeType || guessMimeTypeFromFileName(fileName) || 'application/octet-stream'

    if (!asset?.uri) return

    setPendingAvatar({
      uri: asset.uri,
      fileName,
      contentType,
    })
    setOptimisticAvatarUrl(asset.uri)
    setIsAvatarConfirmOpen(true)
  }

  const handleCancelPendingAvatar = () => {
    setPendingAvatar(undefined)
    setOptimisticAvatarUrl(undefined)
    setIsAvatarConfirmOpen(false)
  }

  const handleUploadPendingAvatar = async () => {
    if (!pendingAvatar || isUploadingAvatar) return

    try {
      setIsUploadingAvatar(true)

      console.log('[profile] uploading avatar', {
        uri: pendingAvatar.uri,
        scheme: pendingAvatar.uri.split(':')[0],
        name: pendingAvatar.fileName,
        contentType: pendingAvatar.contentType,
      })

      const uploadUrlRes = await getAvatarUploadUrl({
        contentType: pendingAvatar.contentType,
      }).unwrap()
      const presignedUrl =
        'presignedUrl' in uploadUrlRes ? uploadUrlRes.presignedUrl : (uploadUrlRes as any).url
      const fileUrlFromApi = (uploadUrlRes as any).fileUrl as string | undefined
      const resolvedFileUrl =
        typeof fileUrlFromApi === 'string' && fileUrlFromApi.length
          ? fileUrlFromApi
          : deriveFileUrlFromPresignedUrl(presignedUrl)

      let blob: Blob
      try {
        const res = await fetch(pendingAvatar.uri)
        blob = await res.blob()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn('[profile] failed to read picked file as blob', {
          uri: pendingAvatar.uri,
          err: msg,
        })
        Alert.alert(
          'Không thể đọc ảnh đã chọn',
          pendingAvatar.uri.startsWith('content://')
            ? 'Android trả URI dạng content:// nên fetch().blob() có thể thất bại. Hãy thử chọn lại; nếu vẫn lỗi, hãy rebuild Dev Client và đảm bảo expo-image-picker đã được cài và build vào app.'
            : 'Vui lòng thử chọn lại hoặc thử ảnh khác.'
        )
        return
      }

      await uploadToPresignedUrl({
        presignedUrl,
        file: blob,
        contentType: pendingAvatar.contentType,
      })

      setAvatarCacheKey(Date.now())
      setPendingAvatar(undefined)

      setIsAvatarConfirmOpen(false)

      setOptimisticAvatarUrl(resolvedFileUrl)
      patchProfileCache((draft) => {
        if (draft?.result) {
          draft.result.avatarUrl = resolvedFileUrl
        } else {
          draft.avatarUrl = resolvedFileUrl
        }
      })

      await refetch()
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    const name = tempName.trim()
    const dob = tempDob.trim()

    await updateMe({
      name: name ? name : undefined,
      dob: dob ? dob : undefined,
    }).unwrap()

    patchProfileCache((draft) => {
      const target = draft?.result ?? draft
      if (name) target.name = name
      if (dob) target.dob = dob
    })

    setIsEditing(false)
    await refetch()
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <Dialog
        modal
        open={isAvatarConfirmOpen && Boolean(pendingAvatar)}
        onOpenChange={(open) => {
          setIsAvatarConfirmOpen(open)
          if (!open) handleCancelPendingAvatar()
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.12}
            backgroundColor="#000"
            zIndex={100000}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />

          <Dialog.Content
            key="content"
            bordered
            elevate
            animation="quick"
            enterStyle={{ opacity: 0, scale: 0.98, y: 10 }}
            exitStyle={{ opacity: 0, scale: 0.98, y: 10 }}
            width="100%"
            padding={0}
            borderTopLeftRadius="$4"
            borderTopRightRadius="$4"
            backgroundColor="$background"
            overflow="hidden"
            position="absolute"
            bottom={insets.bottom}
            left={0}
            right={0}
          >
            <YStack padding="$4" space="$3">
              <Text fontSize="$5" fontWeight="700" color="$color" textAlign="center">
                Cập nhật ảnh đại diện
              </Text>

              <YStack alignItems="center" space="$2">
                <View
                  width={84}
                  height={84}
                  borderRadius={999}
                  borderWidth={2}
                  borderColor="$borderColor"
                  overflow="hidden"
                  backgroundColor="$background"
                >
                  <Image
                    source={{
                      uri:
                        optimisticAvatarUrl ||
                        effectiveAvatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=random`,
                    }}
                    width="100%"
                    height="100%"
                  />
                </View>

                <Text fontSize="$3" color="$color10" textAlign="center">
                  Bạn có muốn cập nhật avatar không?
                </Text>

                {isUploadingAvatar ? <Spinner size="small" /> : null}
              </YStack>

              <XStack space="$2">
                <Button
                  flex={1}
                  theme="red"
                  variant="outlined"
                  borderRadius="$10"
                  icon={X}
                  onPress={handleCancelPendingAvatar}
                  disabled={isUploadingAvatar}
                >
                  Hủy
                </Button>
                <Button
                  flex={1}
                  themeInverse
                  borderRadius="$10"
                  icon={Check}
                  onPress={handleUploadPendingAvatar}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </XStack>
            </YStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* Header giống ProfileDialog nhưng không dùng Dialog */}
      <XStack
        padding="$2"
        alignItems="center"
        justifyContent="center"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <Text fontSize="$6" fontWeight="700" color="$color">
          Thông tin tài khoản
        </Text>
      </XStack>

      <ScrollView flex={1}>
        <YStack padding="$4" space="$4" paddingBottom="$6">
          {/* Fetch status */}
          {profileError ? (
            <YStack
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              padding="$3"
              space="$2"
              backgroundColor="$background"
            >
              <Text fontWeight="700">Không tải được hồ sơ</Text>
              <Text fontSize="$2" color="$color10">
                API: {getApiBaseUrl()}
              </Text>
              <Text fontSize="$2" color="$color10">
                {(() => {
                  const e: any = profileError
                  const status = e?.status
                  const data = e?.data

                  if (typeof data === 'string') {
                    const trimmed = data.trim()
                    const isHtml =
                      trimmed.startsWith('<!DOCTYPE html') ||
                      trimmed.startsWith('<html') ||
                      trimmed.includes('<head')

                    const ngrokCodeMatch = /ERR_NGROK_\d+/.exec(trimmed)

                    if (isHtml) {
                      if (ngrokCodeMatch) {
                        return (
                          `Ngrok đang offline (${ngrokCodeMatch[0]}). ` +
                          'Hãy bật lại tunnel ngrok cho backend và cập nhật EXPO_PUBLIC_API_URL theo URL mới, rồi chạy expo lại với -c.'
                        )
                      }

                      return (
                        'Server trả về HTML (không phải JSON). Thường là do API URL đang trỏ nhầm sang web/ngrok/metro. ' +
                        'Hãy cấu hình EXPO_PUBLIC_API_URL hoặc expo.extra.apiUrl trỏ đúng backend.'
                      )
                    }

                    return trimmed.length > 400 ? `${trimmed.slice(0, 400)}…` : trimmed
                  }
                  if (data && typeof data === 'object') {
                    try {
                      return JSON.stringify(data)
                    } catch {
                      return 'Không đọc được chi tiết lỗi'
                    }
                  }
                  return status ? `HTTP ${status}` : 'Lỗi mạng hoặc cấu hình API'
                })()}
              </Text>
              <Button size="$2" onPress={() => refetch()}>
                Thử lại
              </Button>
            </YStack>
          ) : null}

          {(isLoading || isFetching) && !userProfileData ? (
            <XStack alignItems="center" space="$2">
              <Spinner size="small" />
              <Text color="$color10">Đang tải hồ sơ...</Text>
            </XStack>
          ) : null}

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
                onPress={handlePickAvatar}
                disabled={isUploadingAvatar}
                aria-label="Chỉnh sửa avatar"
              />
            </View>

            {isUploadingAvatar ? <Spinner size="small" /> : null}
          </YStack>

          {/* Personal info */}
          <YStack space="$2">
            <Text fontWeight="600" fontSize="$4">
              Thông tin cá nhân
            </Text>

            {!isEditing ? (
              <>
                <InfoRow label="Họ tên" value={userData?.name} optional />
                <InfoRow label="Ngày sinh" value={formattedDob} optional />
              </>
            ) : (
              <YStack space="$4">
                <YStack space="$2">
                  <Label>Tên hiển thị</Label>
                  <Input
                    value={tempName}
                    onChangeText={setTempName}
                    placeholder="Nhập họ tên"
                    autoCapitalize="words"
                  />
                </YStack>

                <YStack space="$2">
                  <Label>Ngày sinh</Label>
                  <DatePickerField value={tempDob} onChange={setTempDob} placeholder="DD/MM/YYYY" />
                </YStack>
              </YStack>
            )}
          </YStack>

          <Spacer size="$2" />

          {!isEditing ? (
            <Button
              themeInverse
              borderRadius="$10"
              onPress={() => setIsEditing(true)}
              disabled={isFetching || isUpdatingMe}
            >
              Cập nhật
            </Button>
          ) : (
            <XStack space="$2">
              <Button
                flex={1}
                theme="red"
                variant="outlined"
                borderRadius="$10"
                icon={X}
                onPress={handleCancelEdit}
                disabled={isUpdatingMe}
              >
                Hủy
              </Button>
              <Button
                flex={1}
                themeInverse
                borderRadius="$10"
                icon={Check}
                onPress={handleSaveProfile}
                disabled={isUpdatingMe}
              >
                {isUpdatingMe ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </XStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

function InfoRow({
  label,
  value,
  optional,
}: {
  label: string
  value?: string
  optional?: boolean
}) {
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
