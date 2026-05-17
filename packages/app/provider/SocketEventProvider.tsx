import { AppDispatch, RootState } from "app/store"
import { getSocket } from "app/utils/socket"
import { useEffect, useState } from "react"
import { Dialog, Button, Text, XStack, YStack, Avatar } from "@my/ui"
import { useDispatch, useSelector } from "react-redux"
import { VideoCall } from "app/features/call/VideoCall"
import { Check, X as XIcon } from "@tamagui/lucide-icons"
import { CallResponse, IncomingCallDto, MessageResponse, RoomResponse } from "app/types/Response"
import { CallRequest } from "app/types/Request"
import { callApi } from "app/services/callApi"
import { roomApi } from "app/services/roomApi"
import { userApi } from "app/services/userApi"
import { RoomStatus } from "app/types/Enums"
import { RoomUpdateEvent } from "app/types/Events"
import { useRouter } from "solito/navigation"

type InboxUpdatedPayload = {
  message: MessageResponse
  inboxStatus: RoomStatus
}

type NewRoomPayload = {
  room: RoomResponse
  inboxStatus: RoomStatus
}

export const SocketEventProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const activeRoomId = useSelector((state: RootState) => state.chat.activeRoomId)
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
      dispatch(callApi.util.updateQueryData('getCallStatus', { roomId: data.room.id }, () => true));
    };

    const handleCallCancelled = (data: CallRequest) => {
      setIncomingCall((prev) => {
        // Kiểm tra xem ID phòng bị hủy có khớp với phòng đang đổ chuông không
        if (prev && prev.room.id === data.roomId) {
          return null; // Hủy khớp -> Tắt popup
        }
        return prev;
      });

      setCallToken((prevToken) => {
        if (prevToken && currentCallRoomId === data.roomId) {
          return null; // Xóa token -> Component VideoCall bị unmount -> Trở về giao diện bình thường
        }
        return prevToken;
      });

      // Reset lại ID phòng đang gọi
      setCurrentCallRoomId((prevId) => prevId === data.roomId ? null : prevId);
      dispatch(callApi.util.updateQueryData('getCallStatus', { roomId: data.roomId }, () => false));
    };

    const handleCallJoined = (data: CallResponse) => {
      setCallToken(data.token);
      setCurrentCallRoomId(data.roomId);
      // Ghi chú: Vì tham gia trễ nên không có incomingCall (không có popup),
      // chỉ cần set token là component <VideoCall /> sẽ tự động hiện lên!
    };

    const handleUnreadUpdate = (roomId: string) => {
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          if (!draft?.items) return

          const roomIndex = draft.items.findIndex((r) => r.id === roomId)

          if (roomIndex !== -1) {
            draft.items[roomIndex].unreadMessages =
              (draft.items[roomIndex].unreadMessages || 0) + 1
          }
        })
      )

      dispatch(
        userApi.util.updateQueryData('getProfile', undefined, (draft) => {
          if (!draft) return
          draft.totalUnreadMessages = (draft.totalUnreadMessages || 0) + 1
        })
      )
    };

    const handleInboxUpdated = (payload: InboxUpdatedPayload) => {
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: payload.inboxStatus }, (draft) => {
          if (!draft?.items) return

          const roomIndex = draft.items.findIndex((r) => r.id === payload.message.roomId)

          if (roomIndex !== -1) {
            draft.items[roomIndex].latestMessage = payload.message

            const [updatedRoom] = draft.items.splice(roomIndex, 1)
            draft.items.unshift(updatedRoom)
          }
        })
      )
    }

    const handleRoomUpdated = (event: RoomUpdateEvent) => {
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          const roomIndex = draft?.items.findIndex((r) => r.id === event.roomId)
          if (roomIndex !== undefined && roomIndex !== -1) {
            const room = draft.items[roomIndex]

            if (event.newRoomName) {
              room.roomName = event.newRoomName
            }

            if (event.newRoomAvatar) {
              room.avatarUrl = event.newRoomAvatar
            }
          }
        })
      );
    }

    // Self remove: người bị đá khỏi phòng
    const handleSelfRemoved = (roomId: string) => {
      // TODO: thêm thông báo đã bị xoá khỏi nhóm
      if (activeRoomId === roomId) {
        router.replace("/chat")
      }

      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          const index = draft.items?.findIndex((r) => r.id === roomId);
          if (index !== -1 && index !== undefined) {
            draft.items.splice(index, 1);
          }
        })
      );

      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'PENDING' }, (draft) => {
          const index = draft.items?.findIndex((r) => r.id === roomId);
          if (index !== -1 && index !== undefined) {
            draft.items.splice(index, 1);
          }
        })
      );

    };

    const handleNewRoom = (payload: NewRoomPayload) => {
      // Cập nhật cache rtk-query để thêm nhóm mới vào danh sách phòng
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: payload.inboxStatus }, (draft) => {
          if (draft) {
            draft.items.unshift(payload.room);
          }
        })
      );
    }

    const handlePendingInboxUpdated = (room: RoomResponse) => {
      // Xoá phòng khỏi tab Đang chờ nếu đã được chấp nhận
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'PENDING' }, (draft) => {
          const index = draft.items?.findIndex((r) => r.id === room.id);
          if (index !== -1 && index !== undefined) {
            draft.items.splice(index, 1);
          }
        })
      );

      // Thêm phòng vào tab Tất cả nếu đã được chấp nhận
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          if (draft) {
            // Nếu phòng đã tồn tại thì không thêm nữa (trường hợp nhận được nhiều sự kiện cập nhật cho cùng 1 phòng)
            const exists = draft.items.some((r) => r.id === room.id);
            if (!exists) {
              draft.items.unshift(room);
            }
          }
        })
      );
    }

    const handleCallError = (message: string) => {
      console.log("Lỗi tham gia gọi:", message);
    };

    socket.on('call_started', handleCallStarted);
    socket.on('call_joined', handleCallJoined);
    socket.on('call_error', handleCallError);
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_cancelled', handleCallCancelled);
    socket.on('unread_updated', handleUnreadUpdate);
    socket.on('inbox_updated', handleInboxUpdated);
    socket.on('room_updated', handleRoomUpdated);
    socket.on('self_removed', handleSelfRemoved);
    socket.on('new_room', handleNewRoom);
    socket.on('pending_inbox_updated', handlePendingInboxUpdated);
    return () => {
      socket.off('call_started', handleCallStarted);
      socket.off('call_joined', handleCallJoined);
      socket.off('call_error', handleCallError);
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_cancelled', handleCallCancelled);
      socket.off('unread_updated', handleUnreadUpdate);
      socket.off('inbox_updated', handleInboxUpdated);
      socket.off('room_updated', handleRoomUpdated);
      socket.off('self_removed', handleSelfRemoved);
      socket.off('new_room', handleNewRoom);
      socket.off('pending_inbox_updated', handlePendingInboxUpdated);
    }
  }, [activeRoomId, isSocketReady, dispatch])

  const handleAcceptCall = () => {
    if (incomingCall) {
      const socket = getSocket();

      // Báo cho server biết là tôi đã bắt máy rồi
      if (socket) {
        socket.emit('accept_call', { roomId: incomingCall.room.id });
      }

      setCallToken(incomingCall.token);
      setCurrentCallRoomId(incomingCall.room.id);
      setIncomingCall(null);
    }
  }

  const handleRejectCall = () => {
    if (incomingCall) {
      const socket = getSocket();
      // Nếu từ chối, cũng gửi sự kiện cancel_call để báo nhỡ
      if (socket) {
        socket.emit('cancel_call', { roomId: incomingCall.room.id });
      }
      setIncomingCall(null);
    }
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