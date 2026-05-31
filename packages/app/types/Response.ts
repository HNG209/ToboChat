import {
  FriendStatus,
  MemberRole,
  MemberStatus,
  MessageStatus,
  MessageType,
  RoomType,
  SystemAction,
} from './Enums'

export interface ApiResponse<T = unknown> {
  code: number
  message?: string
  result: T
}

export interface PageResponse<T> {
  items: T[]
  nextCursor?: string
  prevCursor?: string
}

export interface FriendResponse {
  id: string
  name: string
  avatarUrl?: string
  createdAt: string
  allowAutoAddToGroup: boolean

  // Trạng thái trong phòng
  memberStatus?: MemberStatus
}

export interface UserResponse {
  id: string
  name: string
  email: string
  avatarUrl?: string
  createdAt: string
  friendStatus?: FriendStatus
  totalUnreadMessages?: number
  friendRequestCount?: number
  groupRequestCount?: number
  allowAutoAddToGroup?: boolean
}

export interface RoomMemberResponse {
  id: string
  roomId: string
  role: MemberRole
  roomName: string
  roomType: RoomType
  addedBy?: string

  // Thông tin cá nhân
  member?: UserResponse

  // Permissions trong phòng
  permissions?: MemberPermissionsResponse
}

export interface MemberPermissionsResponse {
  canUpdateRoomSettings: boolean
  canAddMember: boolean
  canSendMessage: boolean
  canUpdateMetadata: boolean
  canDisbandGroup: boolean
  canApproveMember: boolean
  canUpdateMemberRole: boolean
  canRemoveMember: boolean
  canGetPendingRequests: boolean
}

export interface FriendRequestResponse {
  id: string
  name: string
  avatarUrl?: string
  createdAt: string
}

export interface RoomResponse {
  id: string
  roomName: string
  avatarUrl?: string
  roomType: RoomType
  latestMessage?: LatestMessage
  createdAt: string

  allowAddMember: boolean
  allowSendMessage: boolean
  allowUpdateMetadata: boolean
  approveMember: boolean

  memberCount: number
  pendingCount: number
  unreadMessages: number
}

export interface LatestMessage {
  roomId: string
  userId: string
  messageId: string
  content: string
  fileSize: number // số lượng file trong tin nhắn
  mediaSize: number // số lượng ảnh/video
  createdAt: string
  messageType: MessageType
  messageStatus: MessageStatus
  metadata: Record<string, string>
  action: SystemAction
}

export interface MessageResponse {
  id: string
  tempId: string
  roomId: string
  user?: UserResponse
  replyTo?: MessageResponse
  content: string
  createdAt: string
  messageStatus?: MessageStatus
  attachments?: Attachment[]
  reactionsSummary: Record<string, number>;
  myReactions: string[]
  // Tin nhắn hệ thống
  messageType: MessageType
  action?: SystemAction
  metadata?: Record<string, string>
}

export interface GroupAcceptRequestResponse {
  roomId: string
  roomName: string
  avatarUrl: string
  inviter: UserResponse
}

export interface LeaveCheckResponse {
  canLeave: boolean
  reason?: string
}

export interface Attachment {
  fileUrl: string
  fileName: string
  contentType: string
  fileSize: number
}

export interface GroupPendingRequestResponse {
  roomId: string
  roomName: string
  user: UserResponse
  inviter: UserResponse
}

export interface CallResponse {
  token: string
  roomId: string
  isVideoCall?: boolean
}

export interface IncomingCallDto {
  token: string
  callerId: string
  room: RoomResponse
  isVideoCall?: boolean
}
export interface MessageReactionResponse {
  user: UserResponse
  reactions: string[]
}

export interface PresignedUrlResponse {
  uploadUrl: string; // Link có chữ ký dùng để Frontend PUT file lên
  fileUrl: string;
}