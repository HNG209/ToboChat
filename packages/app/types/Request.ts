// ===== Request =====
export interface GetMyFriendsRequest {
  cursor?: string
  limit?: number
}

export interface FindUserByEmailRequest {
  email: string
  cursor?: string
  limit?: number
}

// ===== ENUMS =====
export enum FriendRequestType {
  SENT = 'SENT',
  PENDING = 'PENDING',
}

// ===== Request =====
export interface GetMyFriendRequestsRequest {
  type: FriendRequestType
  cursor?: string
  limit?: number
}

export interface SendFriendRequestRequest {
  otherId: string
}

export interface CancelFriendRequestRequest {
  otherId: string
}

export interface RespondFriendRequestRequest {
  otherId: string
  accepted: boolean
}
