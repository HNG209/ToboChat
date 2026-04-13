import { useState } from 'react'
import { Platform } from 'react-native'
import { DraftFile } from '../types/Chat'
import { useLazyGetPresignedUrlQuery } from 'app/services/chatApi'

export function useChatAttachment(roomId: string) {
  const [drafts, setDrafts] = useState<DraftFile[]>([])
  const [triggerGetUrl] = useLazyGetPresignedUrlQuery()

  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 5MB
  const MAX_FILES = 20

  const handlePickFile = async () => {
    // --- XỬ LÝ CHO MOBILE (NATIVE) ---
    if (Platform.OS !== 'web') {
      try {
        // Chỉ require khi thực sự chạy trên Native môi trường Mobile
        const DocumentPicker = require('expo-document-picker')

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
              alert(`Tệp "${file.name}" vượt quá 5MB.`)
              continue
            }

            processUpload({
              uri: file.uri,
              name: file.name,
              type: file.mimeType || 'application/octet-stream',
              size: file.size || 0,
              raw: null,
            })
          }
        }
      } catch (err) {
        console.error('Lỗi chọn file Native:', err)
      }
      return
    }

    // --- XỬ LÝ CHO WEB (Next.js) ---
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx'
    input.multiple = true

    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files) as File[]

      if (files.length + drafts.length > MAX_FILES) {
        alert(`Tối đa chỉ được chọn ${MAX_FILES} tệp tin.`)
        return
      }

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          alert(`Tệp "${file.name}" vượt quá 5MB.`)
          continue
        }

        processUpload({
          uri: URL.createObjectURL(file),
          name: file.name,
          type: file.type,
          size: file.size,
          raw: file,
        })
      }
    }
    input.click()
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

      let body: any
      if (Platform.OS === 'web') {
        body = fileInfo.raw
      } else {
        const response = await fetch(fileInfo.uri)
        body = await response.blob()
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: body,
        headers: {
          'Content-Type': fileInfo.type,
        },
      })

      if (!uploadResponse.ok) throw new Error('S3 Upload Failed')

      setDrafts((prev) =>
        prev.map((d) => (d.id === tempId ? { ...d, isUploading: false, fileUrl: fileUrl } : d))
      )

      if (Platform.OS === 'web') {
        URL.revokeObjectURL(fileInfo.uri)
      }
    } catch (error) {
      console.error('Lỗi quy trình upload:', error)
      setDrafts((prev) =>
        prev.map((d) => (d.id === tempId ? { ...d, isUploading: false, error: true } : d))
      )
    }
  }

  const removeDraft = (id: string) => {
    setDrafts((prev) => {
      const draftToRemove = prev.find((d) => d.id === id)
      if (Platform.OS === 'web' && draftToRemove?.localUri) {
        URL.revokeObjectURL(draftToRemove.localUri)
      }
      return prev.filter((d) => d.id !== id)
    })
  }

  return { drafts, setDrafts, handlePickFile, removeDraft }
}
