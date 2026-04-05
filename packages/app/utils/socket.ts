import { io, Socket } from 'socket.io-client'
import { Platform } from 'react-native'

let socket: Socket | null = null

// Tham số baseUrl truyền từ ngoài vào vì Next.js và Expo gọi IP khác nhau
export const initSocket = (token: string, baseUrl: string) => {
  if (!socket) {
    socket = io(baseUrl, {
      query: { token },
      // React Native bắt buộc dùng websocket, còn Web thì có thể để tự động (polling -> websocket)
      transports: Platform.OS === 'web' ? ['polling', 'websocket'] : ['websocket'],
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log(`Socket connected on ${Platform.OS}:`, socket?.id)
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected on ${Platform.OS}`)
    })
  }
  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
