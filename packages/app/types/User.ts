export interface User {
  id: number
  fullName: string
  email: string
  createdAt: string
  friend: boolean | null // true: đã là bạn bè, false: đã gửi yêu cầu kết bạn nhưng chưa được chấp nhận, null: chưa có kết nối gì
}
