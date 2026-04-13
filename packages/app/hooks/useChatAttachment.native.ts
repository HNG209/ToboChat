import { useState } from 'react'
import { DraftFile } from '../types/Chat'
import { useLazyGetPresignedUrlQuery } from 'app/services/chatApi'
import * as DocumentPicker from 'expo-document-picker'

export function useChatAttachment(roomId: string) {
  const [drafts, setDrafts] = useState<DraftFile[]>([])
  const [triggerGetUrl] = useLazyGetPresignedUrlQuery()

  const MAX_FILE_SIZE = 100 * 1024 * 1024
  const MAX_FILES = 20

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      })

      if (!result.canceled) {
        if (result.assets.length + drafts.length > MAX_FILES) {
          alert(`Tối đa chỉ được chọn ${MAX_FILES} tệp tin.`)
          return
        }

        for (const file of result.assets) {
          if (file.size && file.size > MAX_FILE_SIZE) {
            alert(`Tệp "${file.name}" quá lớn.`)
            continue
          }
          processUpload({
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
            size: file.size || 0,
          })
        }
      }
    } catch (err) {
      console.error('Native Pick Error:', err)
    }
  }

  const processUpload = async (fileInfo: any) => {
    const tempId = Math.random().toString(36).substring(7)
    const newDraft: DraftFile = {
      id: tempId,
      localUri: fileInfo.uri,
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      contentType: fileInfo.type,
      isUploading: true,
      fileUrl: '',
    }
    setDrafts((prev) => [...prev, newDraft])

    try {
      const result = await triggerGetUrl({
        roomId,
        fileName: fileInfo.name,
        contentType: fileInfo.type,
      }).unwrap()
      const { uploadUrl, fileUrl } = result

      const response = await fetch(fileInfo.uri)
      const body = await response.blob()

      await fetch(uploadUrl, {
        method: 'PUT',
        body: body,
        headers: { 'Content-Type': fileInfo.type },
      })

      setDrafts((prev) =>
        prev.map((d) => (d.id === tempId ? { ...d, isUploading: false, fileUrl } : d))
      )
    } catch (error) {
      setDrafts((prev) =>
        prev.map((d) => (d.id === tempId ? { ...d, isUploading: false, error: true } : d))
      )
    }
  }

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }

  return { drafts, setDrafts, handlePickFile, removeDraft }
}
