import { YStack, Text, XStack, Button } from '@my/ui'

export default function FriendMenu() {
  return (
    <YStack padding="$3" space="$3">
      <Button justifyContent="flex-start">Danh sách bạn bè</Button>
      <Button justifyContent="flex-start">Danh sách nhóm</Button>
      <Button justifyContent="flex-start">Lời mời kết bạn</Button>
      <Button justifyContent="flex-start">Lời mời vào nhóm</Button>
    </YStack>
  )
}
