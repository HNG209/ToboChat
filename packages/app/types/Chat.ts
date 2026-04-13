// app/types/Chat.ts
export interface Attachment {
  fileUrl: string
  fileName: string
  contentType: string
  fileSize: number
}

export interface DraftFile extends Attachment {
  id: string
  localUri: string
  file?: File // Cho Web
  isUploading: boolean
}
