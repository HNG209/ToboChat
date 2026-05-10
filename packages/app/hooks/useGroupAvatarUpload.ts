import {
  roomApi,
  useGetGroupImageUploadUrlMutation,
  useUpdateRoomAvatarMutation,
} from 'app/services/roomApi'
import { AppDispatch } from 'app/store'
import { uploadToPresignedUrl } from 'app/utils/uploadToPresignedUrl'
import { useState } from 'react'
import { useDispatch } from 'react-redux'

export const useGroupAvatarUpload = (roomId: string) => {
  const dispatch = useDispatch<AppDispatch>()
  const [updateRoomAvatar] = useUpdateRoomAvatarMutation()
  const [avatarCacheKey, setAvatarCacheKey] = useState(0)
  const [optimisticAvatarUrl, setOptimisticAvatarUrl] = useState<string>()

  const [getGroupImageUploadUrl] = useGetGroupImageUploadUrlMutation()

  const withCacheBuster = (url?: string) => {
    if (!url || !avatarCacheKey) return url

    return `${url}${url.includes('?') ? '&' : '?'}v=${avatarCacheKey}`
  }

  const handleSaveAvatar = async ({ avatar }: { avatar?: File }) => {
    try {
      if (!avatar) return

      const confirmed =
        typeof window !== 'undefined' ? window.confirm('Xác nhận tải ảnh nhóm lên?') : true

      if (!confirmed) return
      const contentType = avatar.type || 'application/octet-stream'

      const resp = await getGroupImageUploadUrl({
        roomId,
        contentType,
      }).unwrap()

      const presignedUrl =
        typeof (resp as any)?.presignedUrl === 'string'
          ? (resp as any).presignedUrl
          : typeof (resp as any)?.url === 'string'
            ? (resp as any).url
            : undefined

      const derivedFileUrl =
        typeof presignedUrl === 'string'
          ? (() => {
              try {
                const u = new URL(presignedUrl)
                return `${u.origin}${u.pathname}`
              } catch {
                return presignedUrl.split('?')[0]
              }
            })()
          : undefined

      const fileUrl =
        typeof (resp as any)?.fileUrl === 'string' ? (resp as any).fileUrl : derivedFileUrl

      if (!presignedUrl || !fileUrl) {
        throw new Error('Invalid upload response')
      }

      await uploadToPresignedUrl({
        presignedUrl,
        file: avatar,
        contentType,
      })
      await updateRoomAvatar({
        roomId,
        avatarUrl: fileUrl,
      }).unwrap()

      setAvatarCacheKey(Date.now())
      setOptimisticAvatarUrl(fileUrl)

      dispatch(
        roomApi.util.updateQueryData('getRoomMetadata', { roomId }, (draft: any) => {
          if (draft) {
            draft.avatarUrl = fileUrl
          }
        })
      )
    } catch (err) {
      console.error(err)
    }
  }

  return {
    avatarCacheKey,
    optimisticAvatarUrl,
    withCacheBuster,
    handleSaveAvatar,
  }
}
