import { Avatar, Button, Circle, Text, XStack, YStack } from "tamagui"
import { ChevronLeft, Info, Phone, Video } from "@tamagui/lucide-icons"
import { RoomResponse } from "app/types/Response"

type Props = {
  roomData: RoomResponse | undefined,
  isRoomLoading: boolean,
  insets: { top: number; bottom: number; left: number; right: number } | undefined,
  linkProps: React.ComponentProps<typeof Button>
}

export const ChatScreenHeader = ({ roomData, isRoomLoading, insets, linkProps }: Props) => {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      p="$3"
      pt={insets?.top}
      borderColor="$borderColor"
      borderWidth={1}
      borderBottomWidth={1}
      borderLeftWidth={0}
      borderRightWidth={0}
      bg="$color1"
      elevation="$2"
    >
      <XStack alignItems="center" space="$3">
        <Button size="$3" circular chromeless icon={ChevronLeft} {...linkProps} />
        <XStack alignItems="center" space="$2">
          <Avatar circular size="$4" marginRight="$2">
            <Avatar.Image
              src={roomData?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(roomData?.roomName || 'Room')}&background=random`}
            />
            <Avatar.Fallback borderColor="gray" />
          </Avatar>
          <YStack>
            <Text fontWeight="bold" fontSize="$5">
              {isRoomLoading ? 'Đang tải...' : roomData?.roomName || 'Tên phòng'}
            </Text>
            <XStack alignItems="center" space="$1.5">
              <Circle size={8} bg="$green10" />
              <Text fontSize="$2" color="$color10">
                Đang hoạt động
              </Text>
            </XStack>
          </YStack>
        </XStack>
      </XStack>
      <XStack space="$1">
        <Button size="$3" circular chromeless icon={Phone} />
        <Button size="$3" circular chromeless icon={Video} />
        <Button size="$3" circular chromeless icon={Info} />
      </XStack>
    </XStack>
  )
}