import { Text, YStack } from '@my/ui'

export function ChatDetailScreenMain({ id }: { id: string }) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center">
      <Text>Đang nhắn tin với người có ID: {id}</Text>
    </YStack>
  )
}
