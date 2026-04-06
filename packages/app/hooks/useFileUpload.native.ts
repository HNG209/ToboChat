import { FilePickerResponse, SelectedFile } from '../types/FilePicker'
import { Alert } from 'react-native'

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

export const useFileUpload = (): FilePickerResponse => {
  const pick = async (): Promise<SelectedFile | null> => {
    try {
      let ImagePicker: any
      try {
        const mod = await import('expo-image-picker')
        ImagePicker = (mod as any)?.default ?? mod
      } catch (err) {
        console.warn('[useFileUpload] expo-image-picker failed to load', err)
        Alert.alert(
          'Chưa hỗ trợ chọn ảnh',
          'Binary hiện tại chưa có expo-image-picker. Hãy build lại Dev Client / app sau khi cài dependency.'
        )
        return null
      }

      if (!ImagePicker?.launchImageLibraryAsync) {
        Alert.alert(
          'Chưa hỗ trợ chọn ảnh',
          'Binary hiện tại chưa có expo-image-picker. Hãy build lại Dev Client / app.'
        )
        return null
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.()
      if (perm && perm.granted === false) {
        Alert.alert(
          'Không có quyền truy cập',
          'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh.'
        )
        return null
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images,
        quality: 1,
      })

      console.log('[useFileUpload] launchImageLibraryAsync result', {
        canceled: result?.canceled,
        assetCount: Array.isArray(result?.assets) ? result.assets.length : undefined,
      })

      if (result.canceled || !result.assets) {
        return null
      }

      const asset = result.assets[0]
      const fileName = asset?.fileName || asset?.name || 'image.jpg'
      const derivedMimeType = guessMimeTypeFromFileName(fileName)
      const mimeType =
        asset?.mimeType || asset?.type || derivedMimeType || 'application/octet-stream'
      const fileSize = asset?.fileSize || asset?.size

      console.log('[useFileUpload] picked asset', {
        uri: asset?.uri,
        scheme: typeof asset?.uri === 'string' ? asset.uri.split(':')[0] : undefined,
        name: fileName,
        mimeType,
        size: fileSize,
      })

      return {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
        size: fileSize,
      }
    } catch (error) {
      console.error('Error picking image:', error)
      return null
    }
  }

  return { pick }
}
