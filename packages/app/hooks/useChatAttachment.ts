import { useState } from 'react'
import { DraftFile } from '../types/Chat'
import { useLazyGetPresignedUrlQuery } from 'app/services/chatApi'

export function useChatAttachment(roomId: string) {
  const [drafts, setDrafts] = useState<DraftFile[]>([])
  const [triggerGetUrl] = useLazyGetPresignedUrlQuery()

  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  const MAX_FILES = 20

  const handlePickFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    // Bạn có thể giới hạn loại file ở đây nếu muốn
    input.accept = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt'

    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files) as File[]

      // 1. Kiểm tra tổng số lượng file (đã chọn + đang có trong nháp)
      if (files.length + drafts.length > MAX_FILES) {
        alert(`Bạn chỉ được phép chọn tối đa ${MAX_FILES} tệp tin.`)
        return
      }

      for (const file of files) {
        // 2. Kiểm tra kích thước từng file
        if (file.size > MAX_FILE_SIZE) {
          alert(`Tệp "${file.name}" vượt quá giới hạn 100MB và sẽ bị bỏ qua.`)
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

    setDrafts((prev) => [
      ...prev,
      {
        id: tempId,
        localUri: fileInfo.uri,
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        contentType: fileInfo.type,
        isUploading: true,
        fileUrl: '',
      },
    ])

    try {
      const result = await triggerGetUrl({
        roomId,
        fileName: fileInfo.name,
        contentType: fileInfo.type,
      }).unwrap()

      const uploadResponse = await fetch(result.uploadUrl, {
        method: 'PUT',
        body: fileInfo.raw,
        headers: { 'Content-Type': fileInfo.type },
      })

      if (!uploadResponse.ok) throw new Error('Upload failed')

      setDrafts((prev) =>
        prev.map((d) =>
          d.id === tempId ? { ...d, isUploading: false, fileUrl: result.fileUrl } : d
        )
      )
    } catch (error) {
      console.error('Lỗi upload file:', error)
      setDrafts((prev) =>
        prev.map((d) => (d.id === tempId ? { ...d, isUploading: false, error: true } : d))
      )
    }
  }

  const removeDraft = (id: string) => {
    setDrafts((prev) => {
      const draft = prev.find((d) => d.id === id)
      if (draft?.localUri) URL.revokeObjectURL(draft.localUri)
      return prev.filter((d) => d.id !== id)
    })
  }

  return { drafts, setDrafts, handlePickFile, removeDraft }
}
