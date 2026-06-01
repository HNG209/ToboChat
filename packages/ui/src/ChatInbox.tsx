import { Spinner, Text, YStack, XStack } from '@my/ui'
import { useGetJoinedRoomsQuery, roomApi } from 'app/services/roomApi'
import { getSocket } from 'app/utils/socket'
import { useDispatch, useSelector } from 'react-redux'
import { userApi } from 'app/services/userApi'
import { RoomMemberResponse, RoomResponse } from 'app/types/Response'
import { AppDispatch, RootState } from 'app/store'
import { ChatInboxItem } from './ChatInboxItem'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { useRouter } from 'solito/navigation'
import { StyledFlatList } from './StyledFlatList'
import { Inbox, CheckCircle, Clock } from '@tamagui/lucide-icons'
import { ChatInboxErrorState } from './error/ChatInboxErrorState'
export type RoomStatus = 'ACTIVE' | 'PENDING'
export default function ChatInbox() {
  const dispatch = useDispatch<AppDispatch>()
  const activeRoomId = useSelector(
    (state: RootState) => state.chat.activeRoomId
  )

  const hasSession = useSelector((s: RootState) => s.auth.hasSession)

  const [isSocketReady, setIsSocketReady] = useState(false)
  const [status, setStatus] = useState<RoomStatus>('ACTIVE')
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [activeCursor, setActiveCursor] = useState<string | undefined>(undefined)
  const [pendingCursor, setPendingCursor] = useState<string | undefined>(undefined)
  const router = useRouter()

  const { data, isLoading, isFetching, isError, refetch } = useGetJoinedRoomsQuery(
    { status, cursor: status === 'ACTIVE' ? activeCursor : pendingCursor },
    { skip: !hasSession }
  )

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkSocket = () => {
      const socket = getSocket()
      if (socket) {
        setIsSocketReady(true)
      } else {
        timeoutId = setTimeout(checkSocket, 200)
      }
    }

    checkSocket()
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!isSocketReady) return

    const socket = getSocket()
    if (!socket) return

    const handleGroupDisband = (roomId: string) => {
      dispatch(
        roomApi.util.updateQueryData(
          'getJoinedRooms',
          { status: 'ACTIVE' },
          (draft) => {
            const index = draft.items?.findIndex((r) => r.id === roomId)

            if (index !== undefined && index !== -1) {
              draft.items.splice(index, 1)
            }
          }
        )
      );
    }

    const handleNewMember = (member: RoomMemberResponse) => {
      dispatch(
        roomApi.util.updateQueryData('getRoomMembers', { roomId: member.roomId }, (draft) => {
          if (draft) {
            draft.items.unshift(member);
          }
        })
      );
    }

    socket.on('room_disband', handleGroupDisband)
    socket.on('new_member', handleNewMember)
    return () => {
      socket.off('room_disband', handleGroupDisband)
      socket.off('new_member', handleNewMember)
    }
  }, [dispatch, isSocketReady, activeRoomId, status])

  const handleRoomPress = (roomId: string, unreadCount: number) => {
    dispatch(
      roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
        const roomIndex = draft.items.findIndex((r) => r.id === roomId)
        if (roomIndex !== -1) {
          draft.items[roomIndex].unreadMessages = 0
        }
      })
    )

    dispatch(
      userApi.util.updateQueryData('getProfile', undefined, (draft) => {
        if (!draft) return
        draft.totalUnreadMessages = Math.max(
          (draft.totalUnreadMessages || 0) - unreadCount,
          0
        )
      })
    )

    router.push(`/chat/${roomId}`)
  }

  const handleFetchMore = () => {
    if (isLoading || isFetchingMore || !data?.nextCursor) return

    setIsFetchingMore(true)
    if (status === 'ACTIVE') {
      setActiveCursor(data.nextCursor)
    } else {
      setPendingCursor(data.nextCursor)
    }

    setTimeout(() => {
      setIsFetchingMore(false)
    }, 1000)
  }

  return (
    <YStack flex={1} backgroundColor="$color2">

      {/* ===== SEGMENTED TABS ===== */}
      <YStack paddingHorizontal="$3" paddingTop="$3" backgroundColor="$color2">
        <XStack gap={8} justifyContent="center">
          <Pressable onPress={() => setStatus('ACTIVE')} style={{ flex: 1 }}>
            <XStack
              backgroundColor={status === 'ACTIVE' ? '$blue10' : '$background'}
              borderRadius={8}
              paddingVertical={7}
              paddingHorizontal={0}
              justifyContent="center"
              alignItems="center"
              gap={6}
              shadowColor={status === 'ACTIVE' ? '#1976d2' : 'transparent'}
              shadowOpacity={status === 'ACTIVE' ? 0.10 : 0}
              shadowRadius={status === 'ACTIVE' ? 4 : 0}
              borderWidth={1}
              borderColor={status === 'ACTIVE' ? '$blue8' : 'transparent'}
              pressStyle={{ scale: 0.98 }}
              transition="all 0.12s"
            >
              <CheckCircle size={16} color={status === 'ACTIVE' ? 'white' : '$blue10'} />
              <Text
                color={status === 'ACTIVE' ? 'white' : '$blue10'}
                fontWeight="700"
                fontSize={13}
              >
                Tất cả
              </Text>
            </XStack>
          </Pressable>
          <Pressable onPress={() => setStatus('PENDING')} style={{ flex: 1 }}>
            <XStack
              backgroundColor={status === 'PENDING' ? '$orange8' : '$background'}
              borderRadius={8}
              paddingVertical={7}
              paddingHorizontal={0}
              justifyContent="center"
              alignItems="center"
              gap={6}
              shadowColor={status === 'PENDING' ? '#ff9800' : 'transparent'}
              shadowOpacity={status === 'PENDING' ? 0.10 : 0}
              shadowRadius={status === 'PENDING' ? 4 : 0}
              borderWidth={1}
              borderColor={status === 'PENDING' ? '$orange7' : 'transparent'}
              pressStyle={{ scale: 0.98 }}
              transition="all 0.12s"
            >
              <Clock size={16} color={status === 'PENDING' ? 'white' : '$orange8'} />
              <Text
                color={status === 'PENDING' ? 'white' : '$orange8'}
                fontWeight="700"
                fontSize={13}
              >
                Đang chờ
              </Text>
            </XStack>
          </Pressable>
        </XStack>
      </YStack>

      {
        isError ?
          <ChatInboxErrorState onRetry={refetch} /> :
          <StyledFlatList<RoomResponse>
            data={data?.items || []}
            keyExtractor={room => room.id}
            renderItem={({ item: room }) => (
              <ChatInboxItem
                selected={activeRoomId === room.id}
                key={room.id}
                name={room.roomName}
                avatarUrl={
                  room.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(room.roomName)}&background=random`
                }
                latestMessage={room.latestMessage}
                time={room?.latestMessage?.createdAt ?? undefined}
                pinned={false}
                onPress={() => handleRoomPress(room.id, room.unreadMessages || 0)}
                unreadCount={room.unreadMessages}
                isOnline={room.userPresence.status === 'ONLINE'}
              />
            )}
            ListEmptyComponent={
              isLoading || isFetching ? (
                <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
                  <Spinner size="large" color="$blue10" />
                </YStack>
              ) : (
                <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
                  <Inbox size={48} color="#A0AEC0" />
                  <Text fontSize={18} fontWeight="700" color="$color10" marginTop={12}>
                    Không có phòng nào
                  </Text>
                </YStack>
              )
            }
            onEndReached={handleFetchMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={isFetchingMore ? <Spinner size="small" color="$blue10" /> : null}
          />
      }
    </YStack>
  )
}