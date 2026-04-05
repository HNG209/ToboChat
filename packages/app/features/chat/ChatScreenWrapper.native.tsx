import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChatScreen } from './ChatScreen'

export function ChatScreenWrapper({ roomId }: { roomId: string }) {
  const insets = useSafeAreaInsets()

  return <ChatScreen insets={insets} roomId={roomId} />
}
