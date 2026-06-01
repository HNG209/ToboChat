import { LatestMessage, MessageResponse } from 'app/types/Response'
import { MessageType } from 'app/types/Enums'

export const generateDirectRoomId = (myId: string, otherUserId: string) => {
  const ids = [myId, otherUserId].sort()
  return `${ids[0]}_${ids[1]}`
}

export const formatLastSeen = (lastSeen?: number): string => {
  if (!lastSeen) return 'Bấm để xem thông tin';

  const now = Date.now();
  const diffInSeconds = Math.floor((now - lastSeen) / 1000);

  // Xử lý trường hợp thời gian âm do sai lệch đồng hồ client/server
  if (diffInSeconds < 0) return 'Vừa mới truy cập';

  if (diffInSeconds < 60) {
    return 'Vừa mới truy cập';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hoạt động ${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hoạt động ${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Hoạt động ${diffInDays} ngày trước`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Hoạt động ${diffInMonths} tháng trước`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `Hoạt động ${diffInYears} năm trước`;
};

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
