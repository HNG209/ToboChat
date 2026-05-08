import { MessageResponse, UserResponse } from 'app/types/Response'

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

export const formatSystemMessage = (msg: MessageResponse, selfUserId?: string) => {
  const actorName = msg.user?.name || 'Ai đó'
  const meta = msg.metadata || {}

  switch (msg.action) {
    case 'ROOM_CREATED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã tạo nhóm này.`
    case 'ROOM_NAME_CHANGED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã đổi tên nhóm thành "${meta.newRoomName || 'tên mới'}".`
    case 'MEMBER_ADDED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã thêm ${meta?.newMemberId === selfUserId ? 'bạn' : meta?.newMemberName || '1 thành viên'} vào nhóm.`
    case 'MEMBER_LEFT':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã rời nhóm.`
    case 'MEMBER_REMOVED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã xóa ${meta?.removedMemberId === selfUserId ? 'bạn' : meta?.removedMemberName || '1 thành viên'} khỏi nhóm.`
    case 'GROUP_INVITE_ACCEPTED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã chấp nhận lời mời tham gia nhóm.`
    case 'FRIEND_ACCEPTED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã chấp nhận lời mời kết bạn.`
    default:
      // Fallback nếu không nhận diện được action
      return msg.content || `${actorName} đã cập nhật nhóm.`
  }
}
