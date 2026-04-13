import { useState } from 'react'
import { DraftFile } from '../types/Chat'
import { useLazyGetPresignedUrlQuery } from 'app/services/chatApi'

export function useChatAttachment(roomId: string) {
  const [drafts, setDrafts] = useState<DraftFile[]>([])
  const [triggerGetUrl] = useLazyGetPresignedUrlQuery()

  const MAX_FILE_SIZE = 100 * 1024 * 1024
  const MAX_FILES = 20

  const handlePickFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files) as File[]
      for (const file of files) {
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
      await fetch(result.uploadUrl, {
        method: 'PUT',
        body: fileInfo.raw,
        headers: { 'Content-Type': fileInfo.type },
      })
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === tempId ? { ...d, isUploading: false, fileUrl: result.fileUrl } : d
        )
      )
    } catch (error) {
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