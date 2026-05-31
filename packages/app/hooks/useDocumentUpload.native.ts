import { FilePickerResponse, SelectedFile } from '../types/FilePicker'
import * as DocumentPicker from 'expo-document-picker'

export const useDocumentUpload = (): FilePickerResponse => {
  const pick = async (): Promise<SelectedFile | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf', // Chỉ cho chọn PDF
        multiple: false,
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets) {
        return null
      }

      const asset = result.assets[0]

      return {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/pdf',
        size: asset.size,
      }
    } catch (error) {
      console.error('[useDocumentUpload] Error picking document:', error)
      return null
    }
  }

  return { pick }
}