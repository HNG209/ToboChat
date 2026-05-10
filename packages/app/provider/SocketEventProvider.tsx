import { AppDispatch, RootState } from "app/store"
import { getSocket } from "app/utils/socket"
import { useEffect, useState } from "react"
import { Dialog, Button, Text, XStack, YStack, Avatar } from "@my/ui"
import { useDispatch, useSelector } from "react-redux"
import { VideoCall } from "app/features/call/VideoCall"
import { Check, X as XIcon } from "@tamagui/lucide-icons"
import { CallResponse, IncomingCallDto, RoomResponse } from "app/types/Response"
import { CallRequest } from "app/types/Request"

export const SocketEventProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>()
  const roomId = useSelector((state: RootState) => state.chat.activeRoomId)
  const [isSocketReady, setIsSocketReady] = useState(false)
  const [callToken, setCallToken] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingCallDto | null>(null)
  const [currentCallRoomId, setCurrentCallRoomId] = useState<string | null>(null)

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

    const handleCallStarted = (data: CallResponse) => {
      setCallToken(data.token);
      setCurrentCallRoomId(data.roomId);
    };

    const handleIncomingCall = (data: IncomingCallDto) => {
      setIncomingCall(data);
    };

    const handleCallCancelled = (data: CallRequest) => {
      setIncomingCall((prev) => {
        // Kiểm tra xem ID phòng bị hủy có khớp với phòng đang đổ chuông không
        if (prev && prev.room.id === data.roomId) {
          return null; // Hủy khớp -> Tắt popup
        }
        return prev;
      });
    };

    socket.on('call_started', handleCallStarted);
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_cancelled', handleCallCancelled);
    return () => {
      socket.off('call_started', handleCallStarted);
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_cancelled', handleCallCancelled);
    }
  }, [roomId, isSocketReady, dispatch])

  const handleAcceptCall = () => {
    if (incomingCall) {
      setCallToken(incomingCall.token)
      setCurrentCallRoomId(incomingCall.room.id)
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
        onLeave={() => {
          const socket = getSocket();
          // Nếu đang gọi mà tắt máy, gửi sự kiện báo cho server biết để server báo cho những người chưa bắt máy
          if (socket && currentCallRoomId) {
            socket.emit('cancel_call', { roomId: currentCallRoomId });
          }
          setCallToken(null)
          setCurrentCallRoomId(null)
        }}
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