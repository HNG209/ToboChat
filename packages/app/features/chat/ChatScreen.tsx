import { useEffect, useState } from 'react'
import { Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native'
import { YStack, XStack, Text, Input, Button, Avatar, Theme, Circle } from '@my/ui'
import {
  SendHorizontal,
  Heart,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Image as ImageIcon,
  MoreHorizontal,
} from '@tamagui/lucide-icons'
import { useLink } from 'solito/navigation'
import {
  chatApi,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
} from 'app/services/chatApi'
import { roomApi, useGetRoomMetadataQuery } from 'app/services/roomApi'
import { getSocket } from 'app/utils/socket'
import { useDispatch, useSelector } from 'react-redux'
import { MessageResponse } from 'app/types/Response'
import { AppDispatch, RootState } from 'app/store'
import { StyledFlatList } from '@my/ui/src/StyledFlatList'
import { useAppTheme } from 'app/provider/ThemeContext'

const GROUP_WINDOW_MS = 5 * 60 * 1000

function getSenderKey(msg: MessageResponse, selfUserId?: string) {
  if (msg.self) return selfUserId || '__self__'
  return msg.user?.id || '__unknown__'
}

function getCreatedAtMs(createdAt?: string) {
  if (!createdAt) return Number.NaN
  const ms = new Date(createdAt).getTime()
  return Number.isFinite(ms) ? ms : Number.NaN
}

function canGroup(
  a: MessageResponse | undefined,
  b: MessageResponse | undefined,
  selfUserId?: string
) {
  if (!a || !b) return false
  const aMs = getCreatedAtMs(a.createdAt)
  const bMs = getCreatedAtMs(b.createdAt)
  if (!Number.isFinite(aMs) || !Number.isFinite(bMs)) return false

  const sameSender = getSenderKey(a, selfUserId) === getSenderKey(b, selfUserId)
  if (!sameSender) return false

  return Math.abs(aMs - bMs) < GROUP_WINDOW_MS
}

const MESSAGE_AVATAR_SIZE = '$3' as const

interface Props {
  roomId: string
  insets?: { top: number; bottom: number; left: number; right: number }
}

export function ChatScreen({ roomId, insets }: Props) {
  const [message, setMessage] = useState('')
  const { theme } = useAppTheme()
  const linkProps = useLink({ href: '/chat' })
  const dispatch = useDispatch<AppDispatch>()
  const [isSocketReady, setIsSocketReady] = useState(false)
  const hasSession = useSelector((s: RootState) => s.auth.hasSession)
  const selfUserId = useSelector((s: RootState) => s.auth.user?.id)

  // 1. API Hooks
  const { data, isLoading, isError } = useGetMessagesQuery(
    { roomId },
    {
      skip: !hasSession || !roomId,
      refetchOnMountOrArgChange: true,
    }
  )
  const [triggerGetMessages, { isFetching: isFetchingMore }] = useLazyGetMessagesQuery()
  const { data: roomData, isLoading: isRoomLoading } = useGetRoomMetadataQuery(
    { roomId },
    {
      skip: !hasSession || !roomId,
      refetchOnMountOrArgChange: true,
    }
  )
  const [sendMessage] = useSendMessageMutation()

  // 2. Load More Logic
  const handleLoadMore = async () => {
    const nextCursor = data?.nextCursor
    if (isFetchingMore || !nextCursor) return

    try {
      const response = await triggerGetMessages({ roomId, cursor: nextCursor, limit: 20 }).unwrap()

      if (response.items && response.items.length > 0) {
        // Cập nhật cache để thêm tin nhắn cũ vào cuối mảng
        dispatch(
          chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
            // Push tin cũ vào cuối mảng (FlatList inverted sẽ đẩy nó lên trên cùng)
            draft.items.push(...response.items)
            ;(draft as any).nextCursor = (response as any).nextCursor
          })
        )
      }
    } catch (error) {
      console.error('Lỗi khi tải thêm tin nhắn cũ:', error)
    }
  }

  // 3. Send Message Logic
  const handleSendMessage = async () => {
    if (!message.trim()) return

    const tempContent = message
    setMessage('')

    const tempMessageId = `temp_${Date.now()}`
    const optimisticMessage: MessageResponse = {
      id: tempMessageId,
      content: tempContent,
      createdAt: new Date().toISOString(),
      self: true,
      roomId: roomId,
    }

    // Cập nhật cache ngay lập tức với tin nhắn giả định (optimistic update)
    const patchResult = dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        if (!draft.items) draft.items = []
        // Unshift tin mới vào đầu mảng (FlatList inverted sẽ hiển thị nó ở dưới cùng)
        draft.items.unshift(optimisticMessage)
      })
    )

    // Cập nhật cache của phòng để hiển thị tin nhắn mới nhất và đẩy phòng lên đầu danh sách
    const roomPatchResult = dispatch(
      roomApi.util.updateQueryData('getJoinedRooms', undefined, (draft) => {
        if (!draft || !draft.items) return
        const roomIndex = draft.items.findIndex((room) => room.id === roomId)
        if (roomIndex !== -1) {
          draft.items[roomIndex].latestMessage = optimisticMessage
          const [updatedRoom] = draft.items.splice(roomIndex, 1)
          draft.items.unshift(updatedRoom)
        }
      })
    )

    try {
      await sendMessage({ roomId, content: tempContent, messageType: 'USER' }).unwrap()
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error)
      setMessage(tempContent)
      roomPatchResult.undo()
      patchResult.undo()
    }
  }

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

    const handleReceiveMessage = (message: MessageResponse) => {
      if (message.roomId !== roomId) return
      dispatch(
        chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
          if (!draft.items) draft.items = []
          draft.items.unshift(message)
        })
      )
    }

    socket.on('receive_message', handleReceiveMessage)
    return () => {
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [roomId, isSocketReady, dispatch])

  return (
    <Theme name={theme}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <YStack flex={1} bg="$background">
          {/* --- HEADER --- */}
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
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(roomData?.roomName || 'Room')}&background=random`}
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

          {/* --- BODY (FLATLIST) --- */}
          {/* Lần tải đầu tiên của cả phòng */}
          {isLoading ? (
            <XStack justifyContent="center" alignItems="center" flex={1} bg="$background">
              <ActivityIndicator size="large" color="#888" />
            </XStack>
          ) : isError ? (
            <XStack justifyContent="center" alignItems="center" flex={1} bg="$background">
              <Text color="red">Lỗi khi tải tin nhắn!</Text>
            </XStack>
          ) : (
            <StyledFlatList
              data={data?.items}
              inverted={true}
              keyExtractor={(item: MessageResponse) => item.id}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              // TRẠNG THÁI LOADING CHO LOAD MORE TẠI ĐÂY
              ListFooterComponent={
                isFetchingMore ? (
                  <XStack justifyContent="center" alignItems="center" py="$4">
                    <ActivityIndicator size="small" color="#888" />
                  </XStack>
                ) : null
              }
              renderItem={({ item: msg, index }) => {
                const items = data?.items || []
                const isMe = msg.self
                const myBubbleBg = theme === 'dark' ? '$blue11' : '$blue10'
                const myBubbleText = 'white'
                const otherBubbleBg = theme === 'dark' ? '$color3' : '$color2'

                // items is newest -> oldest because we unshift new messages and push older messages.
                // With inverted FlatList, index 0 is rendered at the bottom (newest).
                // Grouping rules are based on consecutive messages in time (adjacent in this array).
                const newerMsg = items[index - 1]
                const olderMsg = items[index + 1]
                const groupsWithNewer = canGroup(msg, newerMsg, selfUserId)
                const groupsWithOlder = canGroup(msg, olderMsg, selfUserId)

                const isSolo = !groupsWithNewer && !groupsWithOlder
                const isGroupStart = !groupsWithOlder && groupsWithNewer
                const isGroupMiddle = groupsWithOlder && groupsWithNewer
                const isGroupEnd = groupsWithOlder && !groupsWithNewer

                // UI rules:
                // - Start: show avatar
                // - Middle: hide avatar + timestamp
                // - End: show timestamp
                // - Solo: show avatar + timestamp
                const showAvatar = !isMe && (isSolo || isGroupStart)
                const showTimestamp = isSolo || isGroupEnd

                const date = new Date(msg.createdAt)
                const hours = date.getHours().toString().padStart(2, '0')
                const minutes = date.getMinutes().toString().padStart(2, '0')
                const timeString = `${hours}:${minutes}`

                return (
                  <XStack
                    justifyContent={isMe ? 'flex-end' : 'flex-start'}
                    alignItems={isMe ? 'flex-end' : 'flex-start'}
                    space="$2"
                    mb="$2"
                  >
                    {!isMe && (
                      <YStack width={MESSAGE_AVATAR_SIZE} alignItems="center">
                        {showAvatar ? (
                          <Avatar circular size={MESSAGE_AVATAR_SIZE}>
                            <Avatar.Image
                              src={
                                msg?.user?.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${msg?.user?.name || 'User'}&background=random`
                              }
                            />
                            <Avatar.Fallback borderColor="gray" />
                          </Avatar>
                        ) : (
                          <YStack height={MESSAGE_AVATAR_SIZE} width={MESSAGE_AVATAR_SIZE} />
                        )}
                      </YStack>
                    )}
                    <YStack
                      p="$3"
                      borderRadius="$5"
                      maxWidth="75%"
                      bg={isMe ? myBubbleBg : otherBubbleBg}
                      borderWidth={1}
                      borderColor={isMe ? 'transparent' : '$borderColor'}
                      borderTopLeftRadius={!isMe ? 0 : '$5'}
                      borderTopRightRadius={isMe ? 0 : '$5'}
                      elevation="$1"
                      shadowColor="$shadowColor"
                      shadowRadius={2}
                      shadowOffset={{ width: 0, height: 1 }}
                    >
                      <Text fontSize="$4" color={isMe ? myBubbleText : '$color'} lineHeight={22}>
                        {msg.content}
                      </Text>
                      {showTimestamp && (
                        <Text
                          fontSize="$1"
                          textAlign="right"
                          mt="$1"
                          opacity={0.9}
                          color={isMe ? myBubbleText : '$color10'}
                        >
                          {timeString}
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                )
              }}
            />
          )}

          {/* --- FOOTER (INPUT) --- */}
          <XStack
            p="$2"
            alignItems="center"
            bg="$background"
            borderColor="$borderColor"
            borderWidth={1}
            space="$2"
          >
            <Button size="$3" circular chromeless icon={MoreHorizontal} />
            <Button size="$3" circular chromeless icon={ImageIcon} />
            <Input
              flex={1}
              size="$4"
              borderRadius="$10"
              bg="$color3"
              borderWidth={0}
              placeholder="Nhập tin nhắn..."
              value={message}
              onChangeText={setMessage}
            />
            {message ? (
              <Button
                size="$4"
                circular
                bg={theme === 'dark' ? '$blue11' : '$blue10'}
                color="white"
                icon={<SendHorizontal size={20} />}
                onPress={handleSendMessage}
              />
            ) : (
              <Button size="$3" circular chromeless icon={<Heart size={20} />} />
            )}
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </Theme>
  )
}
