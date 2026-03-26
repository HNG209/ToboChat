export interface ApiResponse<T = unknown> {
  code: number
  message?: string
  result: T
}

export interface PageResponse<T> {
  items: T[]
  nextCursor?: string
}

// ===== Response item =====
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
  friend: boolean
}

export interface FriendRequestResponse {
  id: string
  name: string
  avatarUrl?: string
  createdAt: string
}
