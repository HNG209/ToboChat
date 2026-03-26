import * as DocumentPicker from 'expo-document-picker'
import { FilePickerResponse, SelectedFile } from '../types/FilePicker'

export const useFileUpload = (): FilePickerResponse => {
  const pick = async (): Promise<SelectedFile | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets) {
        return null
      }

      const asset = result.assets[0]

      return {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      }
    } catch (error) {
      console.error('Error picking document:', error)
      return null
    }
  }

  return { pick }
}
