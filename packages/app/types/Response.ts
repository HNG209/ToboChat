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

export interface FriendRequestResponse {
  id: string
  name: string
  avatarUrl?: string
  createdAt: string
}

export interface RoomResponse {
  id: string
  roomName: string
  roomType: RoomType
  latestMessage: MessageResponse
  createdAt: string
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
}
