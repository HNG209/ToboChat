import { AppDispatch, RootState } from "app/store"
import { getSocket } from "app/utils/socket"
import { useEffect, useState } from "react"
import { Dialog, Button, Text, XStack, YStack, Spinner, UserAvatar } from "@my/ui"
import { useDispatch, useSelector } from "react-redux"
import { VideoCall } from "app/features/call/VideoCall"
import { Check, Maximize2, PhoneCall, X as XIcon } from "@tamagui/lucide-icons"
import { CallResponse, FriendRequestResponse, FriendResponse, GroupAcceptRequestResponse, GroupPendingRequestResponse, IncomingCallDto, LatestMessage, MessageResponse, RoomMemberResponse, RoomResponse, UserPresenceResponse } from "app/types/Response"
import { CallRequest, FriendRequestType } from "app/types/Request"
import { callApi, CallStatus } from "app/services/callApi"
import { roomApi } from "app/services/roomApi"
import { userApi } from "app/services/userApi"
import { FriendStatus, RoomStatus, UserPresenceStatus } from "app/types/Enums"
import { RoomUpdateEvent } from "app/types/Events"
import { useRouter } from "solito/navigation"
import { Platform } from "react-native"
import { generateDirectRoomId } from "app/utils/chatHelper"
import { contactApi } from "app/services/contactApi"

type InboxUpdatedPayload = {
  message: LatestMessage
  inboxStatus: RoomStatus
}

type NewRoomPayload = {
  room: RoomResponse
  inboxStatus: RoomStatus
}

type InboxUnreadUpdatePayload = {
  roomId: string
  unreadCount: number
}

export const SocketEventProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const activeRoomId = useSelector((state: RootState) => state.chat.activeRoomId)
  const selfUserId = useSelector((state: RootState) => state.auth.user?.id)
  const [isSocketReady, setIsSocketReady] = useState(false)
  const [callToken, setCallToken] = useState<string | null>(null)
  const [isVideoCall, setIsVideoCall] = useState<boolean>(true)
  const [incomingCall, setIncomingCall] = useState<IncomingCallDto | null>(null)
  const [currentCallRoomId, setCurrentCallRoomId] = useState<string | null>(null)
  const [isAcceptingCall, setIsAcceptingCall] = useState(false)
  const [isCallMinimized, setIsCallMinimized] = useState(false)

  // Socket Connection & Listeners
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

    const handleIncomingCall = (data: IncomingCallDto) => {
      // Hiện popup cuộc gọi đến với thông tin cuộc gọi
      setIncomingCall(data);
      setIsVideoCall(!!data.isVideoCall);
    };

    const handleCallCancelled = (data: CallRequest) => {
      setIncomingCall(null);
      setCallToken(null);

      // Reset lại ID phòng đang gọi
      setCurrentCallRoomId((prevId) => prevId === data.roomId ? null : prevId);
    };

    const handleCallAccepted = (data: CallRequest) => {
      // Đã chấp nhận cuộc gọi, tắt popup cuộc gọi đến cho tất cả thiết bị
      setIncomingCall(null);
      setIsAcceptingCall(false);

      // Cập nhật lại trạng thái cuộc gọi
      dispatch(callApi.util.updateQueryData('getCallStatus', { roomId: data.roomId }, () => 'IN_CALL' as CallStatus));
    };

    const handleCallStatusUpdated = (data: { roomId: string, status: CallStatus }) => {
      dispatch(callApi.util.updateQueryData('getCallStatus', { roomId: data.roomId }, () => data.status));
    };

    // Dùng cho cả trường hợp bắt máy và tham gia cuộc gọi đang diễn ra
    const handleCallJoined = (data: CallResponse) => {
      if (Platform.OS === 'web') {
        setIsAcceptingCall(false); // Tắt spinner
        openCallPopup(data.token, data.roomId, !!data.isVideoCall);
      } else {
        // Logic React Native cũ của bạn giữ nguyên
        setCallToken(data.token);
        setCurrentCallRoomId(data.roomId);
        setIsVideoCall(!!data.isVideoCall);
        setIsCallMinimized(false);
      }
    };

    const handleUnreadUpdate = (payload: InboxUnreadUpdatePayload) => {
      const { roomId, unreadCount } = payload;

      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          if (!draft?.items) return

          const roomIndex = draft.items.findIndex((r) => r.id === roomId)

          if (roomIndex === -1) return

          if (unreadCount < 0 && draft.items[roomIndex].unreadMessages === 0) return

          draft.items[roomIndex].unreadMessages =
            (draft.items[roomIndex].unreadMessages || 0) + unreadCount

        })
      )

      dispatch(
        userApi.util.updateQueryData('getProfile', undefined, (draft) => {
          if (!draft) return
          draft.totalUnreadMessages = (draft.totalUnreadMessages || 0) + unreadCount
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

            if (event.payload.newRoomName) {
              room.roomName = event.payload.newRoomName
            }

            if (event.payload.newRoomAvatar) {
              room.avatarUrl = event.payload.newRoomAvatar
            }
          }
        })
      );

      dispatch(
        roomApi.util.updateQueryData('getRoomMetadata', { roomId: event.roomId }, (draft) => {
          if (!draft) return
          if (event.payload.newRoomName !== undefined) {
            draft.roomName = event.payload.newRoomName
          }
          if (event.payload.newRoomAvatar !== undefined) {
            draft.avatarUrl = event.payload.newRoomAvatar
          }
          if (event.payload.allowAddMember !== undefined) {
            draft.allowAddMember = event.payload.allowAddMember
          }
          if (event.payload.allowSendMessage !== undefined) {
            draft.allowSendMessage = event.payload.allowSendMessage
          }
          if (event.payload.allowUpdateMetadata !== undefined) {
            draft.allowUpdateMetadata = event.payload.allowUpdateMetadata
          }
          if (event.payload.approveMember !== undefined) {
            draft.approveMember = event.payload.approveMember
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
      setIsAcceptingCall(false);
      console.log("Lỗi tham gia gọi:", message);
    };

    const handleUserPresenceUpdated = (data: { status: UserPresenceStatus, lastSeen: number, userId: string }) => {
      const targetRoomId = generateDirectRoomId(selfUserId || '', data.userId);

      dispatch(
        roomApi.util.updateQueryData('getRoomMetadata', { roomId: targetRoomId }, (draft) => {
          if (!draft) return;
          draft.userPresence.status = data.status
          draft.userPresence.lastSeen = data.lastSeen
        })
      );

      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          const index = draft.items?.findIndex((r) => r.id === targetRoomId);
          if (index !== -1 && index !== undefined) {
            draft.items[index].userPresence.status = data.status
            draft.items[index].userPresence.lastSeen = data.lastSeen
          }
        })
      );
    }

    const handleNewFriend = (newFriend: FriendResponse) => {
      // Cập nhật cache rtk-query để thêm bạn mới vào danh sách bạn bè
      dispatch(
        contactApi.util.updateQueryData('getMyFriendList', undefined, (draft) => {
          if (draft) {
            draft.items.unshift(newFriend);
          }
        })
      );

      dispatch(
        contactApi.util.updateQueryData('getFriendStatus', { otherId: newFriend.id }, (draft) => 'FRIEND' as FriendStatus)
      );
    }

    const handleFriendDeleted = (friendId: string) => {
      dispatch(
        contactApi.util.updateQueryData('getMyFriendList', undefined, (draft) => {
          if (draft?.items) {
            const index = draft.items.findIndex((f) => f.id === friendId);
            if (index !== -1) {
              draft.items.splice(index, 1);
            }
          }
        })
      );

      dispatch(
        contactApi.util.updateQueryData('getFriendStatus', { otherId: friendId }, (draft) => 'STRANGER' as FriendStatus)
      );
    }

    const handleFriendRequestCancelled = (data: { otherId: string, type: FriendRequestType }) => {
      dispatch(
        contactApi.util.updateQueryData('getFriendStatus', { otherId: data.otherId }, (draft) => 'STRANGER' as FriendStatus)
      );

      // Xoá khỏi danh sách lời mời
      dispatch(
        contactApi.util.updateQueryData('getMyFriendRequests', { type: data.type }, (draft) => {
          if (draft?.items) {
            const index = draft.items.findIndex((f) => f.id === data.otherId);
            if (index !== -1) {
              draft.items.splice(index, 1);
            }
          }
        })
      );
    }

    const handleNewFriendRequest = (payload: FriendRequestResponse) => {
      dispatch(
        contactApi.util.updateQueryData('getFriendStatus', { otherId: payload.id }, (draft) => 'PENDING' as FriendStatus)
      );

      dispatch(
        contactApi.util.updateQueryData('getMyFriendRequests', { type: FriendRequestType.PENDING, cursor: undefined, limit: 10 }, (draft) => {
          if (!draft) return
          if (!draft.items) {
            draft.items = []
          }
          const isExisted = draft.items.some((item) => item.id === payload.id)
          if (!isExisted) {
            // Nhét Object người gửi lên đầu mảng (unshift) để giao diện xuất hiện thẻ UserCard ngay lập tức
            draft.items.unshift(payload)
          }
        })
      )

      dispatch(
        userApi.util.updateQueryData('getProfile', undefined, (draft) => {
          if (!draft) return
          draft.friendRequestCount = (draft.friendRequestCount || 0) + 1
        })
      )
    }

    const handleFriendRequestResetUnread = () => {
      dispatch(
        userApi.util.updateQueryData('getProfile', undefined, (draft) => {
          if (!draft) return
          draft.friendRequestCount = 0
        })
      )
    }

    const handleGroupRequestUnreadUpdate = (payload: GroupAcceptRequestResponse) => {
      dispatch(
        roomApi.util.updateQueryData('getGroupInvites', { cursor: undefined, limit: 20 }, (draft) => {
          if (!draft) return
          if (!draft.items) {
            draft.items = []
          }
          const isExisted = draft.items.some((item) => item.roomId === payload.roomId)
          if (!isExisted) {
            // Nhét nhóm mới lên đầu mảng để giao diện tự động render thẻ UserCard (Group) ngay lập tức
            draft.items.unshift(payload)
          }
        })
      )
      dispatch(
        userApi.util.updateQueryData('getProfile', undefined, (draft) => {
          if (!draft) return
          draft.groupRequestCount = (draft.groupRequestCount || 0) + 1
        })
      )
    }

    const handleGroupRequestResetUnread = () => {
      dispatch(
        userApi.util.updateQueryData('getProfile', undefined, (draft) => {
          if (!draft) return
          draft.groupRequestCount = 0
        })
      )
    }

    const handleNewPendingRequest = (data: GroupPendingRequestResponse) => {
      dispatch(
        roomApi.util.updateQueryData('getPendingRequests', { roomId: data.roomId }, (draft) => {
          if (!draft) return
          if (!draft.items) {
            draft.items = []
          }
          const isExisted = draft.items.some((item) => item.roomId === data.roomId && item.user.id === data.user.id)
          if (!isExisted) {
            draft.items.unshift(data)
          }
        })
      )
    }

    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_status_updated', handleCallStatusUpdated);
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
    socket.on('user_presence_updated', handleUserPresenceUpdated);

    socket.on('new_friend', handleNewFriend);
    socket.on('new_friend_request', handleNewFriendRequest);
    socket.on('friend_request_unread_reset', handleFriendRequestResetUnread);
    socket.on('friend_deleted', handleFriendDeleted);
    socket.on('friend_request_cancelled', handleFriendRequestCancelled);

    socket.on('group_request_unread_update', handleGroupRequestUnreadUpdate)
    socket.on('group_request_unread_reset', handleGroupRequestResetUnread)

    socket.on('new_pending_request', handleNewPendingRequest)
    return () => {
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_status_updated', handleCallStatusUpdated);
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
      socket.off('user_presence_updated', handleUserPresenceUpdated);

      socket.off('new_friend', handleNewFriend);
      socket.off('new_friend_request', handleNewFriendRequest);
      socket.off('friend_request_unread_reset', handleFriendRequestResetUnread);
      socket.off('friend_deleted', handleFriendDeleted);
      socket.off('friend_request_cancelled', handleFriendRequestCancelled);

      socket.off('group_request_unread_update', handleGroupRequestUnreadUpdate);
      socket.off('group_request_unread_reset', handleGroupRequestResetUnread);

      socket.off('new_pending_request', handleNewPendingRequest);
    }
  }, [activeRoomId, isSocketReady, dispatch])

  const handleAcceptCall = () => {
    if (incomingCall) {
      const socket = getSocket();

      // Báo cho server biết là tôi đã bắt máy rồi
      if (socket) {
        socket.emit('accept_call', { roomId: incomingCall.room.id });
      }

      setIsAcceptingCall(true);
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

      setCallToken(null);
      setCurrentCallRoomId(null);
      setIncomingCall(null);
      setIsAcceptingCall(false);
    }
  }

  const openCallPopup = (token: string, roomId: string, isVideo: boolean) => {
    if (typeof window !== 'undefined') {
      // Định hình kích thước cho cửa sổ popup
      const width = 1200;
      const height = 750;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const url = `/call-session?token=${encodeURIComponent(token)}&roomId=${roomId}&video=${isVideo}`;

      // Mở ra một cửa sổ popup riêng biệt thay vì 1 tab mới thông thường
      const callWindow = window.open(
        url,
        `ToboCall_${roomId}`,
        `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (callWindow) {
        callWindow.focus();
      }
    }
  };

  return <>
    {children}

    {callToken && Platform.OS !== 'web' && (
      <YStack
        position="absolute"
        top={isCallMinimized ? 60 : 0}
        right={isCallMinimized ? 20 : 0}
        left={isCallMinimized ? undefined : 0}
        bottom={isCallMinimized ? undefined : 0}
        width={isCallMinimized ? 120 : '100%'}
        height={isCallMinimized ? 180 : '100%'}
        zIndex={99999}
        borderRadius={isCallMinimized ? 12 : 0}
        overflow="hidden"
        elevation={isCallMinimized ? 5 : 0}
        shadowColor="black"
        shadowOpacity={isCallMinimized ? 0.3 : 0}
        shadowRadius={isCallMinimized ? 5 : 0}
      >
        <VideoCall
          token={callToken}
          isVideoCall={isVideoCall}
          isMinimized={isCallMinimized}
          onMinimize={() => setIsCallMinimized(true)}
          onMaximize={() => setIsCallMinimized(false)}
          onLeave={() => {
            const socket = getSocket();
            if (socket && currentCallRoomId) {
              socket.emit('cancel_call', { roomId: currentCallRoomId });
            }
            setCallToken(null);
            setCurrentCallRoomId(null);
            setIsAcceptingCall(false);
            setIsCallMinimized(false);
          }}
        />
      </YStack>
    )}

    {isAcceptingCall && (
      <YStack
        position="absolute"
        top={0} left={0} right={0} bottom={0}
        justifyContent="center"
        alignItems="center"
        backgroundColor="rgba(0,0,0,0.3)"
        zIndex={100000}
      >
        <YStack p="$4" borderRadius="$4" backgroundColor="rgba(255,255,255,0.1)">
          <Spinner size="large" color="$green10" />
        </YStack>
      </YStack>
    )}

    <Dialog open={!!incomingCall} onOpenChange={open => { if (!open) setIncomingCall(null) }}>
      <Dialog.Portal>
        <Dialog.Overlay backgroundColor="rgba(0,0,0,0.4)" />
        <Dialog.Content elevate width={320} p="$5" borderRadius="$6">
          <YStack alignItems="center" space="$4">
            {incomingCall?.room && (
              <YStack alignItems="center" space="$2">
                <UserAvatar
                  id={incomingCall.room.id}
                  name={incomingCall.room.roomName}
                  avatarUrl={incomingCall.room.avatarUrl}
                  size="$7"
                />
                <Text fontSize="$6" fontWeight="bold">
                  {incomingCall.room.roomName}
                </Text>
              </YStack>
            )}
            {
              isVideoCall ? (
                <Text fontSize="$4" textAlign="center" color="$color11">
                  Cuộc gọi video đến
                </Text>
              ) : (
                <Text fontSize="$4" textAlign="center" color="$color11">
                  Cuộc gọi thoại đến
                </Text>
              )
            }
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
