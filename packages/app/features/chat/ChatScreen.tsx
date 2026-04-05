import React, { useEffect, useRef, useState } from 'react'
import { Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native'
import { YStack, XStack, Text, Input, Button, Avatar, ScrollView, Theme, Circle } from 'tamagui'
import {
  SendHorizontal,
  Heart,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Image as ImageIcon,
  Smile,
  MoreHorizontal,
} from '@tamagui/lucide-icons'
import { useLink } from 'solito/navigation'
import { chatApi, useGetMessagesQuery, useSendMessageMutation } from 'app/services/chatApi'
import { roomApi, useGetRoomMetadataQuery } from 'app/services/roomApi'
import { getSocket } from 'app/utils/socket'
import { useDispatch } from 'react-redux'
import { MessageResponse } from 'app/types/Response'
import { AppDispatch } from 'app/store'

interface Props {
  roomId: string
  insets?: { top: number; bottom: number; left: number; right: number }
}

export function ChatScreen({ roomId, insets }: Props) {
  const [message, setMessage] = useState('')
  const linkProps = useLink({ href: '/' })
  const dispatch = useDispatch<AppDispatch>()
  const scrollViewRef = useRef<ScrollView>(null)
  const [isSocketReady, setIsSocketReady] = useState(false)

  // Lấy tin nhắn từ API
  const { data, isLoading, isError } = useGetMessagesQuery({ roomId })

  // Lấy metadata của room
  const { data: roomData, isLoading: isRoomLoading } = useGetRoomMetadataQuery({ roomId })

  // Gửi tin nhắn
  const [sendMessage] = useSendMessageMutation()

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const tempContent = message
    setMessage('')

    // 1. Tạo một tin nhắn "ảo" (Mock Message) với dữ liệu tạm thời
    const tempMessageId = `temp_${Date.now()}`
    const optimisticMessage: MessageResponse = {
      id: tempMessageId,
      content: tempContent,
      createdAt: new Date().toISOString(),
      self: true,
      roomId: roomId,
      // user: {
      //   id: 'me', // ID tạm
      //   avatarUrl: '', // Tự FE biết isSelf = true sẽ ẩn avatar, nên không quan trọng
      // },
    }

    // 2. Cập nhật Cache ngay lập tức (Optimistic Update)
    const patchResult = dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        if (!draft.items) {
          draft.items = []
        }
        draft.items.unshift(optimisticMessage)
      })
    )

    // 3. Cập nhật Cache Danh sách Phòng (ChatInbox)
    const roomPatchResult = dispatch(
      roomApi.util.updateQueryData('getJoinedRooms', undefined, (draft) => {
        if (!draft || !draft.items) return

        // Tìm phòng hiện tại đang chat
        const roomIndex = draft.items.findIndex((room) => room.id === roomId)

        if (roomIndex !== -1) {
          // Cập nhật tin nhắn mới nhất thành tin nhắn ảo vừa gõ
          draft.items[roomIndex].latestMessage = optimisticMessage

          // Cắt phòng này ra và nhét lên trên cùng (index 0) của danh sách
          const [updatedRoom] = draft.items.splice(roomIndex, 1)
          draft.items.unshift(updatedRoom)
        }
      })
    )

    try {
      await sendMessage({ roomId, content: tempContent, messageType: 'USER' }).unwrap()

      // (Thành công: Không cần làm gì thêm, tin nhắn ảo trên UI đã đóng vai trò hoàn hảo)
      // *Lưu ý: Nếu API của bạn có trả về ID thật của tin nhắn, bạn có thể dispatch updateQueryData một lần nữa
      // để thay thế `tempMessageId` bằng ID thật nếu muốn.
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error)
      setMessage(tempContent)

      // xóa tin nhắn ảo khỏi UI
      roomPatchResult.undo()
      patchResult.undo()
    }
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkSocket = () => {
      const socket = getSocket()
      if (socket) {
        setIsSocketReady(true) // Báo cho React biết để chạy Effect bên dưới
      } else {
        // Nếu chưa có, đợi 200ms rồi kiểm tra lại
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

    const handleReceiveMessage = (message: MessageResponse) => {
      // 1. Kiểm tra xem tin nhắn có thuộc phòng đang mở này không
      if (message.roomId !== roomId) {
        // Nếu không thuộc phòng này, có thể dispatch một action khác để tăng số đếm "Tin nhắn chưa đọc" ở màn hình ngoài
        return
      }

      // 2. Đẩy thẳng DTO mới vào Cache của RTK Query
      dispatch(
        chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
          if (!draft.items) {
            draft.items = []
          }
          // Do tin nhắn lấy từ API đang xếp mới nhất ở đầu (unshift)
          draft.items.unshift(message)
        })
      )
    }

    socket.on('receive_message', handleReceiveMessage)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [roomId, isSocketReady, dispatch])

  useEffect(() => {
    if (data?.items && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [data?.items])

  return (
    <Theme name="light">
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
                  {/* Nếu muốn hiển thị trạng thái, thêm ở đây */}
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

          {/* --- BODY --- */}
          <ScrollView
            ref={scrollViewRef}
            flex={1}
            p="$3"
            space="$3"
            bg="$color2"
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            {isLoading && (
              <XStack justifyContent="center" alignItems="center" flex={1}>
                <ActivityIndicator size="small" color="#888" />
              </XStack>
            )}
            {isError && (
              <Text color="red" textAlign="center">
                Lỗi khi tải tin nhắn!
              </Text>
            )}
            {data?.items
              ?.slice()
              .reverse()
              .map((msg, idx, arr) => {
                const isMe = msg.self
                // Kiểm tra có hiển thị avatar không
                let showAvatar = false
                if (!isMe) {
                  // Tin nhắn tiếp theo (ở dưới) là của người khác hoặc hết mảng
                  const nextMsg = arr[idx + 1]
                  if (!nextMsg || nextMsg.self || nextMsg.user?.id !== msg.user?.id) {
                    showAvatar = true
                  }
                }
                // Định dạng giờ phút từ ISO string
                const date = new Date(msg.createdAt)
                const hours = date.getHours().toString().padStart(2, '0')
                const minutes = date.getMinutes().toString().padStart(2, '0')
                const timeString = `${hours}:${minutes}`

                return (
                  <XStack
                    key={msg.id}
                    justifyContent={isMe ? 'flex-end' : 'flex-start'}
                    alignItems="flex-end"
                    space="$2"
                    mb="$2"
                  >
                    {!isMe && showAvatar && (
                      <Avatar circular size="$2">
                        <Avatar.Image
                          src={
                            msg?.user?.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${msg?.user?.name || 'User'}&background=random`
                          }
                        />
                        <Avatar.Fallback borderColor="gray" />
                      </Avatar>
                    )}
                    {!isMe && !showAvatar && (
                      <Avatar circular size="$2">
                        <Avatar.Image src={''} />
                        <Avatar.Fallback borderColor="gray" />
                      </Avatar>
                    )}
                    <YStack
                      p="$3"
                      borderRadius="$5"
                      maxWidth="75%"
                      bg={isMe ? '$blue10' : '$background'}
                      borderTopLeftRadius={!isMe ? 0 : '$5'}
                      borderTopRightRadius={isMe ? 0 : '$5'}
                      elevation="$1"
                      shadowColor="$shadowColor"
                      shadowRadius={2}
                      shadowOffset={{ width: 0, height: 1 }}
                    >
                      <Text fontSize="$4" color={isMe ? 'white' : '$color'} lineHeight={22}>
                        {msg.content}
                      </Text>
                      <Text fontSize="$1" textAlign="right" mt="$1" opacity={0.8}>
                        {timeString}
                      </Text>
                    </YStack>
                  </XStack>
                )
              })}
          </ScrollView>

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
                bg="$blue10"
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
