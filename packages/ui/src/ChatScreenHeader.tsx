import React from 'react'
import { Button, Circle, Text, XStack, YStack } from "tamagui"
import { ChevronLeft, Info, Phone, Video } from "@tamagui/lucide-icons"
import { RoomResponse } from "app/types/Response"
import { useGetCallStatusQuery } from "app/services/callApi"
import { getSocket } from "app/utils/socket"
import { formatLastSeen } from 'app/utils/chatHelper'
import { UserAvatar } from './UserAvatar'
import { Platform } from 'react-native'
type Props = {
  roomId: string
  roomData: RoomResponse | undefined,
  isRoomLoading: boolean,
  insets: { top: number; bottom: number; left: number; right: number } | undefined,
  linkProps: React.ComponentProps<typeof Button>
  avatarSeed?: string
  onInfoPress?: () => void
}

export const ChatScreenHeader = ({ roomId, roomData, isRoomLoading, insets, linkProps, avatarSeed, onInfoPress }: Props) => {
  const isGroup = roomData?.roomType === 'GROUP';
  const userPresence = roomData?.userPresence;

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
      p="$2"
      pt={insets?.top}
      borderColor="$borderColor"
      borderWidth={1}
      borderBottomWidth={1}
      borderLeftWidth={0}
      borderRightWidth={0}
      bg="$color1"
      elevation="$2"
    >
      <XStack alignItems="center" space="$2" flex={1} minWidth={0}>
        <Button size="$3" circular chromeless icon={ChevronLeft} {...linkProps} />
        <XStack alignItems="center" space="$2" flex={1} minWidth={0}>
          <XStack marginRight="$2">
            <UserAvatar
              id={avatarSeed ?? roomData?.id}
              name={roomData?.roomName || 'Room'}
              avatarUrl={roomData?.avatarUrl}
              size="$4"
            />
          </XStack>
          <YStack flex={1} minWidth={0}>
            <Text
              fontWeight="bold"
              fontSize="$4"
              numberOfLines={1}
              flexShrink={1}
            >
              {isRoomLoading ? 'Đang tải...' : roomData?.roomName || 'Tên phòng'}
            </Text>
            {
              userPresence?.status === 'ONLINE' ?
                <XStack alignItems="center" space="$1.5">
                  <Circle size={8} bg="$green10" />
                  <Text fontSize="$2" color="$color10">
                    Đang hoạt động
                  </Text>
                </XStack> :
                <XStack alignItems="center" space="$1.5">
                  <Circle size={8} bg="$gray10" />
                  <Text fontSize="$2" color="$color10">
                    {formatLastSeen(userPresence?.lastSeen)}
                  </Text>
                </XStack>
            }
          </YStack>
        </XStack>
      </XStack>

      <XStack justifyContent="center" alignItems="center">
        {callStatusData === 'IN_CALL' ? (
          <XStack alignItems="center" space="$2" px="$2">
            <Phone color="#22c55e" size={16} />
            {Platform.OS === 'web' ? (
              <Text fontSize="$2" color="$green10" fontWeight="600">
                Đang trong cuộc gọi
              </Text>
            ) : null}
          </XStack>
        ) : isGroup ? (
          callStatusData === 'ACTIVE' ? (
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
              <Button size="$4" circular chromeless icon={Phone} onPress={() => handleStartCall(false)} />
              <Button size="$4" circular chromeless icon={Video} onPress={() => handleStartCall(true)} />
            </>
          )
        ) : (
          <>
            <Button size="$5" circular chromeless icon={Phone} onPress={() => handleStartCall(false)} />
            <Button size="$5" circular chromeless icon={Video} onPress={() => handleStartCall(true)} />
          </>
        )}
        <Button size="$5" circular chromeless icon={Info} onPress={onInfoPress} />
      </XStack>
    </XStack >
  )
}
