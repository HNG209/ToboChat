import { LatestMessage, MessageResponse } from 'app/types/Response'
import { MessageType } from 'app/types/Enums'

export const generateDirectRoomId = (myId: string, otherUserId: string) => {
  const ids = [myId, otherUserId].sort()
  return `${ids[0]}_${ids[1]}`
}

export const formatLatestMessage = (message?: LatestMessage) => {
  if (!message) return 'Chưa có tin nhắn'

  // Tin nhắn đã thu hồi
  if (message.messageStatus === 'REVOKED') return 'Tin nhắn đã được thu hồi'

  // Tin nhắn hệ thống, render tối giản cho từng action
  if (message.messageType === 'SYSTEM') {
    const meta = message.metadata || {}
    switch (message.action) {
      case 'ROOM_CREATED':
        return 'Nhóm đã được tạo'
      case 'ROOM_NAME_CHANGED':
        return `Nhóm đã được đổi tên thành "${meta.newRoomName || 'tên mới'}"`
      case 'ROOM_AVATAR_CHANGED':
        return 'Ảnh đại diện nhóm đã được cập nhật'
      case 'MEMBER_APPROVED':
        return `${meta?.approvedMemberName || 'Thành viên'} đã được phê duyệt`
      case 'MEMBER_ADDED':
        return `${meta?.newMemberName || 'Thành viên'} đã được thêm vào nhóm`
      case 'MEMBER_LEFT':
        return 'Thành viên đã rời nhóm'
      case 'MEMBER_REMOVED':
        return `${meta?.removedMemberName || 'Thành viên'} đã bị xóa khỏi nhóm`
      case 'GROUP_INVITE_ACCEPTED':
        return 'Lời mời tham gia nhóm đã được chấp nhận'
      case 'FRIEND_ACCEPTED':
        return 'Lời mời kết bạn đã được chấp nhận'
      case 'MEMBER_ROLE_UPDATED':
        return 'Vai trò thành viên trong nhóm đã được cập nhật'
      default:
        return message.content || 'Tin nhắn hệ thống'
    }
  }

  // Widget (hiện tại chỉ có cuộc gọi, sau này có thể thêm loại widget khác)
  if (message.messageType === 'WIDGET') {
    const widgetType = message.metadata?.widgetType
    if (widgetType === 'CALL') {
      const status = message.metadata?.status
      const isGroupCall = message.metadata?.isGroupCall === 'true'
      const isVideoCall = message.metadata?.isVideoCall === 'true'
      if (isGroupCall) {
        if (status === 'MISSED') return 'Cuộc gọi nhóm nhỡ'
        return isVideoCall ? 'Cuộc gọi nhóm video' : 'Cuộc gọi nhóm thoại'
      } else {
        if (status === 'MISSED') return 'Cuộc gọi nhỡ'
        return isVideoCall ? 'Cuộc gọi video' : 'Cuộc gọi thoại'
      }
    }
  }

  // Chỉ có file (fileSize > 0, mediaSize = 0, không content)
  if (
    !message.content &&
    message.fileSize > 0 &&
    (!message.mediaSize || message.mediaSize === 0)
  ) {
    return message.fileSize > 1 ? `Đã gửi ${message.fileSize} file` : 'File đính kèm'
  }

  // Nhóm hình ảnh (mediaSize > 1, không content)
  if (
    !message.content &&
    message.mediaSize > 1
  ) {
    return `Đã gửi ${message.mediaSize} ảnh`
  }

  // Văn bản + hình ảnh (có content, mediaSize > 0)
  if (
    message.content &&
    message.mediaSize > 0
  ) {
    const shortContent = message.content.length > 15 ? message.content.slice(0, 15) + '...' : message.content
    return `[Hình ảnh] ${shortContent}`
  }

  // Chỉ có văn bản
  if (message.content) {
    return message.content.length > 15 ? message.content.slice(0, 15) + '...' : message.content
  }

  // Trường hợp còn lại: 1 ảnh, không content
  if (
    !message.content &&
    message.mediaSize === 1
  ) {
    return 'Đã gửi 1 ảnh'
  }

  return 'Tin nhắn'
}

const buildRoleName = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'Quản trị viên'
    case 'VICE_ADMIN':
      return 'Phó quản trị viên'
    case 'MEMBER':
      return 'Thành viên'
    default:
      return 'Vai trò không xác định'
  }
}

export const formatSystemMessage = (msg: MessageResponse, selfUserId?: string) => {
  const actorName = msg.user?.name || 'Ai đó'
  const meta = msg.metadata || {}

  switch (msg.action) {
    case 'ROOM_CREATED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã tạo nhóm này.`
    case 'ROOM_NAME_CHANGED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã đổi tên nhóm thành "${meta.newRoomName || 'tên mới'}".`
    case 'ROOM_AVATAR_CHANGED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã đổi ảnh đại diện nhóm.`
    case 'MEMBER_APPROVED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã phê duyệt ${meta?.approvedMemberId === selfUserId ? 'bạn' : meta?.approvedMemberName || '1 thành viên'} tham gia nhóm.`
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
    case 'MEMBER_ROLE_UPDATED':
      return `${msg.user?.id === selfUserId ? 'Bạn' : `${actorName}`} đã cập nhật vai trò của ${meta?.updatedMemberId === selfUserId ? 'bạn' : meta?.updatedMemberName || '1 thành viên'} trong nhóm thành ${buildRoleName(meta?.newRole) || 'vai trò mới'}.`
    default:
      // Fallback nếu không nhận diện được action
      return msg.content || `${actorName} đã cập nhật nhóm.`
  }
}
