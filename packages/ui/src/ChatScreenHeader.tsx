import { Avatar, Button, Circle, Text, XStack, YStack } from "tamagui"
import { ChevronLeft, Info, Phone, Video } from "@tamagui/lucide-icons"
import { RoomResponse } from "app/types/Response"
import { useGetCallStatusQuery } from "app/services/callApi"
import { getSocket } from "app/utils/socket"

type Props = {
  roomId: string
  roomData: RoomResponse | undefined,
  isRoomLoading: boolean,
  insets: { top: number; bottom: number; left: number; right: number } | undefined,
  linkProps: React.ComponentProps<typeof Button>
  onInfoPress?: () => void
}

export const ChatScreenHeader = ({ roomId, roomData, isRoomLoading, insets, linkProps, onInfoPress }: Props) => {
  const isGroup = roomData?.roomType === 'GROUP';
  const { data: callStatusData } = useGetCallStatusQuery(
    { roomId },
    { skip: !roomId, refetchOnMountOrArgChange: true }
  );

  const handleStartCall = (isVideoCall?: boolean) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('request_call', { roomId: roomId, isVideoCall: isVideoCall ?? true });
    }
  };

  const handleJoinCall = (isVideoCall?: boolean) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('join_ongoing_call', { roomId: roomId, isVideoCall: isVideoCall ?? true });
    }
  }

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
            <Text fontWeight="bold" fontSize="$4">
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
      <XStack space="$1" justifyContent="center" alignItems="center">
        {callStatusData && isGroup ? (
          <Button
            size="$3"
            icon={Phone}
            backgroundColor="$green10"
            color="white"
            borderRadius={20}
            fontWeight="bold"
            paddingHorizontal={16}
            onPress={() => handleJoinCall(false)}
          >
            Tham gia cuộc gọi
          </Button>
        ) : (
          <>
            <Button size="$5" circular chromeless icon={Phone} onPress={() => handleStartCall(false)} />
            <Button size="$5" circular chromeless icon={Video} onPress={() => handleStartCall(true)} />
          </>
        )}
        <Button size="$5" circular chromeless icon={Info} onPress={onInfoPress} />
      </XStack>
    </XStack>
  )
}