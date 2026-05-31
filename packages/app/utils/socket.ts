import { io, Socket } from 'socket.io-client'
import { Platform } from 'react-native'

let socket: Socket | null = null

export const initSocket = (token: string, baseUrl: string, deviceId: string) => {
  if (!socket) {
    socket = io(baseUrl, {
      query: { token, deviceId },
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
