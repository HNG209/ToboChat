import { useState } from 'react'
import { Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import axios from 'axios'
import { DraftFile } from '../types/Chat'
import { useSelector } from 'react-redux'
import { RootState } from 'app/store'
import { useLazyGetPresignedUrlQuery } from 'app/services/chatApi'
export function useChatAttachment(roomId: string) {
  const [drafts, setDrafts] = useState<DraftFile[]>([])
  const [triggerGetUrl] = useLazyGetPresignedUrlQuery()
  const handlePickFile = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    // Cho phép chọn ảnh, video và cả các file tài liệu phổ biến
    input.accept = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx'
    input.multiple = true

    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files)
      if (files.length > 0) {
        files.forEach((file: any) => {
          processUpload({
            uri: URL.createObjectURL(file),
            name: file.name,
            type: file.type, // type này sẽ là 'video/mp4' hoặc 'application/pdf'...
            size: file.size,
            raw: file,
          })
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
      fileName: fileInfo.name, // Kiểm tra xem fileInfo.name có tồn tại không
      fileSize: fileInfo.size,
      contentType: fileInfo.type,
      isUploading: true,
      fileUrl: '',
    }
    setDrafts((prev) => [...prev, newDraft])

    try {
      // 1. Gọi API qua RTK Query (Tự động kèm Token, không lo 403)
      const result = await triggerGetUrl({
        roomId,
        fileName: fileInfo.name,
        contentType: fileInfo.type,
      }).unwrap()
      console.log('Dữ liệu nhận được từ RTK:', result)
      const { uploadUrl, fileUrl } = result

      // 2. Phần PUT lên S3 giữ nguyên vì S3 không dùng Token của Backend mình
      let body = Platform.OS === 'web' ? fileInfo.raw : await (await fetch(fileInfo.uri)).blob()
      if (!result || !result.uploadUrl) {
        throw new Error('Không lấy được URL từ server')
      }

      await fetch(uploadUrl, {
        method: 'PUT',
        body: body,
        headers: { 'Content-Type': fileInfo.type },
      })

      // 3. Cập nhật UI
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === tempId
            ? {
                ...d, // GIỮ LẠI fileName, fileSize, contentType cũ
                isUploading: false,
                fileUrl: fileUrl, // Cập nhật link S3 mới
              }
            : d
        )
      )
    } catch (error) {
      console.error('Lỗi rồi:', error)
      setDrafts((prev) => prev.filter((d) => d.id !== tempId))
    }
  }
  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }

  return { drafts, setDrafts, handlePickFile, removeDraft }
}
