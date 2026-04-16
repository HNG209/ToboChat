import { MessageResponse } from 'app/types/Response'

export const generateDirectRoomId = (myId: string, otherUserId: string) => {
  const ids = [myId, otherUserId].sort()
  return `${ids[0]}_${ids[1]}`
}

export const formatPreviewMessage = (message: MessageResponse | null) => {
  if (!message) return 'Chưa có tin nhắn'

  let content = ''

  // Nếu có content thì hiện thị content rút gọn
  if (message.content) {
    content = message.content.length > 15 ? message.content.slice(0, 15) + '...' : message.content
  }

  // Nếu có attachment thì thêm biểu tượng kèm theo
  if (message.attachments && message.attachments.length > 0) {
    content = '📎 ' + content
  }

  // Nếu chỉ có attachment mà không có content thì hiển thị "File đính kèm"
  if (!message.content && message.attachments && message.attachments.length > 0) {
    content = 'File đính kèm'
  }

  if (message.messageStatus === 'REVOKED') return 'Tin nhắn đã được thu hồi'
  return content
}
