import { ChatScreen } from './ChatScreen'

export function ChatScreenWrapper({ roomId }: { roomId: string }) {
  return <ChatScreen roomId={roomId} />
}
