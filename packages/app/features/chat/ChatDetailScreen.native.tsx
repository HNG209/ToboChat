import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChatScreen } from './ChatScreen'

export function ChatDetailScreen() {
  const insets = useSafeAreaInsets()

  return <ChatScreen insets={insets} />
}
