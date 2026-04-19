import { FriendStatus, RoomType } from './Enums'

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
  inRoom?: boolean
  allowAutoAddToGroup: boolean
}

export interface UserResponse {
  id: string
  name: string
  email: string
  avatarUrl?: string
  createdAt: string
  friendStatus?: FriendStatus
  totalUnreadMessages: number
}

export interface RoomMemberResponse {
    role: 'ADMIN' | 'VICE_ADMIN' | 'MEMBER'
    roomName: string
    status: 'ACTIVE' | 'PENDING'
    roomType: 'DM' | 'GROUP'
    addedBy?: string
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
  latestMessage: MessageResponse
  createdAt: string

  allowAddMember: boolean
  allowSendMessage: boolean
  allowUpdateMetadata: boolean
  approveMember: boolean

  memberCount: number
  pendingCount: number
  unreadMessages: number
}

export interface MessageResponse {
  id: string
  roomId: string
  user?: UserResponse
  replyTo?: MessageResponse
  content: string
  self: boolean
  createdAt: string
  messageStatus?: 'SENT' | 'REVOKED'
  localStatus?: 'VISIBLE' | 'DELETED'
  attachments?: Attachment[]
}

export interface GroupAcceptRequestResponse {
  roomId: string
  roomName: string
  avatarUrl: string
  inviter: UserResponse
}

export interface Attachment {
  fileUrl: string
  fileName: string
  contentType: string
  fileSize: number
}
