import { io, Socket } from 'socket.io-client'
import { Platform } from 'react-native'

let socket: Socket | null = null
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export const initSocket = (token: string, baseUrl: string, deviceId: string) => {
  if (!socket) {
    socket = io(baseUrl, {
      query: { token, deviceId },
      transports: Platform.OS === 'web' ? ['polling', 'websocket'] : ['websocket'],
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log(`Socket connected on ${Platform.OS}:`, socket?.id)

      // Ping trạng thái để server biết còn đang hoạt động
      if (!heartbeatInterval) {
        heartbeatInterval = setInterval(() => {
          if (socket && socket.connected) {
            socket.emit('client_heartbeat');
          }
        }, 30000);
      }
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected on ${Platform.OS}`)

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    })
  }
  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    socket.disconnect()
    socket = null
  }
}
