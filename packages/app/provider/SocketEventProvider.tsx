import { AppDispatch, RootState } from "app/store"
import { getSocket } from "app/utils/socket"
import { useEffect, useState } from "react"
import { Dialog, Button, Text, XStack, YStack, Avatar } from "@my/ui"
import { useDispatch, useSelector } from "react-redux"
import { VideoCall } from "app/features/call/VideoCall"
import { Check, X as XIcon } from "@tamagui/lucide-icons"
import { RoomResponse } from "app/types/Response"

export const SocketEventProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>()
  const roomId = useSelector((state: RootState) => state.chat.activeRoomId)
  const [isSocketReady, setIsSocketReady] = useState(false)
  const [callToken, setCallToken] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<{ token: string; callerId: string; room: RoomResponse } | null>(null)

  // 4. Socket Connection & Listeners
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const checkSocket = () => {
      const socket = getSocket()
      if (socket) setIsSocketReady(true)
      else timeoutId = setTimeout(checkSocket, 200)
    }
    checkSocket()
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!isSocketReady) return
    const socket = getSocket()
    if (!socket) return

    const handleCallStarted = (data: { token: string; roomId: string }) => {
      setCallToken(data.token);
    };

    const handleIncomingCall = (data: { callerId: string; token: string; room: RoomResponse }) => {
      setIncomingCall({ token: data.token, callerId: data.callerId, room: data.room });
    };

    socket.on('call_started', handleCallStarted);
    socket.on('incoming_call', handleIncomingCall);
    return () => {
      socket.off('call_started', handleCallStarted);
      socket.off('incoming_call', handleIncomingCall);
    }
  }, [roomId, isSocketReady, dispatch])

  const handleAcceptCall = () => {
    if (incomingCall) {
      setCallToken(incomingCall.token)
      setIncomingCall(null)
    }
  }

  const handleRejectCall = () => {
    setIncomingCall(null)
  }

  if (callToken) {
    return (
      <VideoCall
        token={callToken}
        onLeave={() => setCallToken(null)} // Bấm tắt gọi thì xóa token để về lại màn hình chat
      />
    );
  }

  return <>
    {children}
    <Dialog open={!!incomingCall} onOpenChange={open => { if (!open) setIncomingCall(null) }}>
      <Dialog.Portal>
        <Dialog.Overlay backgroundColor="rgba(0,0,0,0.4)" />
        <Dialog.Content elevate width={320} p="$5" borderRadius="$6">
          <YStack alignItems="center" space="$4">
            {incomingCall?.room && (
              <YStack alignItems="center" space="$2">
                <Avatar circular size="$7">
                  <Avatar.Image
                    src={incomingCall.room.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.room.roomName)}&background=random`}
                  />
                </Avatar>
                <Text fontSize="$6" fontWeight="bold">
                  {incomingCall.room.roomName}
                </Text>
              </YStack>
            )}
            <Text fontSize="$4" textAlign="center" color="$color11">
              Cuộc gọi đến
            </Text>
            <XStack space="$8" justifyContent="center" alignItems="center">
              <YStack alignItems="center" space="$2">
                <Button
                  circular
                  size="$6"
                  theme="green"
                  icon={<Check size={32} />}
                  onPress={handleAcceptCall}
                />
                <Text fontSize="$4" color="$color11">Chấp nhận</Text>
              </YStack>
              <YStack alignItems="center" space="$2">
                <Button
                  circular
                  size="$6"
                  theme="red"
                  icon={<XIcon size={32} />}
                  onPress={handleRejectCall}
                />
                <Text fontSize="$4" color="$color11">Từ chối</Text>
              </YStack>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  </>
}