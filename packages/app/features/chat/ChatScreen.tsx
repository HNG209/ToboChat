import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  useWindowDimensions,
} from 'react-native'
import { YStack, XStack, Text, Input, Button, Avatar, Theme, Circle, Image } from '@my/ui'
import {
  SendHorizontal,
  Heart,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Image as ImageIcon,
  MoreHorizontal,
  Check,
  Copy,
  Forward,
  Trash2,
  X,
  Download,
  File,
  FileText,
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
import { copyToClipboard } from 'app/utils/clipboard'
import { MessageActionMenu } from './MessageActionMenu'
import { useChatAttachment } from './../../hooks/useChatAttechment'
import { MediaGrid } from './MediaGrid'
function getSenderKey(msg: MessageResponse, selfUserId?: string) {
  if (msg.self) return selfUserId || '__self__'
  return msg.user?.id || '__unknown__'
}

function canGroup(
  a: MessageResponse | undefined,
  b: MessageResponse | undefined,
  selfUserId?: string
) {
  if (!a || !b) return false
  return getSenderKey(a, selfUserId) === getSenderKey(b, selfUserId)
}

function getDisplayNameForMessage(msg: MessageResponse, selfUserName?: string) {
  if (msg.self) return selfUserName || 'Bạn'
  return msg.user?.name || 'Người dùng'
}

function buildReplyEncodedContent(opts: {
  replyName: string
  replyText: string
  messageText: string
}) {
  const replyName = (opts.replyName || '').replace(/\n/g, ' ').trim()
  const replyText = (opts.replyText || '').replace(/\n/g, ' ').trim()
  const messageText = (opts.messageText || '').trim()
  return `[reply]\nname:${replyName}\ntext:${replyText}\n[/reply]\n${messageText}`
}

function parseReplyEncodedContent(content: string) {
  if (!content?.startsWith('[reply]\n')) return null
  const end = content.indexOf('\n[/reply]\n')
  if (end === -1) return null
  const header = content.slice('[reply]\n'.length, end)
  const messageText = content.slice(end + '\n[/reply]\n'.length)

  const nameLine = header.split('\n').find((l) => l.toLowerCase().startsWith('name:'))
  const textLine = header.split('\n').find((l) => l.toLowerCase().startsWith('text:'))

  const replyName = nameLine ? nameLine.slice('name:'.length).trim() : ''
  const replyText = textLine ? textLine.slice('text:'.length).trim() : ''

  return {
    replyName,
    replyText,
    messageText: messageText.trimStart(),
  }
}

const MESSAGE_AVATAR_SIZE = '$3' as const

async function copyText(text: string) {
  await copyToClipboard(text)
}

interface Props {
  roomId: string
  insets?: { top: number; bottom: number; left: number; right: number }
}

export function ChatScreen({ roomId, insets }: Props) {
  const { height: windowHeight } = useWindowDimensions()
  const androidBaselineHeightRef = useRef(windowHeight)
  const [message, setMessage] = useState('')
  const [composerHeight, setComposerHeight] = useState(0)
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0)
  const { theme } = useAppTheme()
  const linkProps = useLink({ href: '/chat' })
  const dispatch = useDispatch<AppDispatch>()
  const [isSocketReady, setIsSocketReady] = useState(false)
  const hasSession = useSelector((s: RootState) => s.auth.hasSession)
  const selfUserId = useSelector((s: RootState) => s.auth.user?.id)
  const selfUserName = useSelector(
    (s: RootState) => (s as any).auth?.user?.name as string | undefined
  )

  // Frontend-only message actions
  const isWeb = Platform.OS === 'web'
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(() => new Set())
  const [locallyRecalledIds, setLocallyRecalledIds] = useState<Set<string>>(() => new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null)

  const listBottomSpacer = isWeb ? 0 : composerHeight
  const { drafts, setDrafts, handlePickFile, removeDraft } = useChatAttachment(roomId)
  // Android keyboard handling: don't rely on KeyboardAvoidingView only.
  // On some devices KAV can leave a "stuck" gap after dismiss; keyboard events are deterministic.
  useEffect(() => {
    if (Platform.OS !== 'android') return

    const updateFromEvent = (e: any) => {
      const coords = e?.endCoordinates
      const reportedHeight = typeof coords?.height === 'number' ? coords.height : 0
      const screenY = typeof coords?.screenY === 'number' ? coords.screenY : undefined
      const fallbackHeight = typeof screenY === 'number' ? Math.max(0, windowHeight - screenY) : 0
      const nextHeight = reportedHeight > 0 ? reportedHeight : fallbackHeight
      setAndroidKeyboardHeight(Math.max(0, Math.min(nextHeight, windowHeight)))
    }

    const showSub = Keyboard.addListener('keyboardDidShow', updateFromEvent)
    const frameSub = Keyboard.addListener('keyboardDidChangeFrame', updateFromEvent)
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardHeight(0)
    })

    return () => {
      showSub.remove()
      frameSub.remove()
      hideSub.remove()
    }
  }, [windowHeight])

  // If Android is already resizing the window when the keyboard opens
  // (because `softwareKeyboardLayoutMode: "resize"` is enabled), then adding
  // manual padding creates a visible empty gap. Only apply padding as a fallback
  // when the window height doesn't change.
  useEffect(() => {
    if (Platform.OS !== 'android') return
    if (androidKeyboardHeight === 0) {
      androidBaselineHeightRef.current = windowHeight
    }
  }, [androidKeyboardHeight, windowHeight])

  const isWindowResizedByKeyboard =
    Platform.OS === 'android' &&
    androidKeyboardHeight > 0 &&
    androidBaselineHeightRef.current - windowHeight > 50

  const effectiveAndroidKeyboardHeight =
    Platform.OS === 'android' && !isWindowResizedByKeyboard ? androidKeyboardHeight : 0

  const selectedCount = selectedIds.size
  const replyName = replyTo ? getDisplayNameForMessage(replyTo, selfUserName) : ''
  const replyTag = replyTo ? `@${replyName}` : ''

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

  const normalizedMessages = useMemo(() => {
    const items = data?.items || []
    if (locallyDeletedIds.size === 0 && locallyRecalledIds.size === 0) return items
    return items.map((m) => {
      if (locallyRecalledIds.has(m.id)) {
        return {
          ...m,
          content: 'Tin nhắn đã được thu hồi',
        }
      }
      if (!locallyDeletedIds.has(m.id)) return m
      return {
        ...m,
        content: 'Tin nhắn đã bị xóa',
      }
    })
  }, [data?.items, locallyDeletedIds, locallyRecalledIds])
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
    // 1. Kiểm tra: Nếu danh sách ảnh có cái nào đang 'isUploading', thì BẮT BUỘC phải đợi
    const isStillUploading = drafts.some((d) => d.isUploading)
    if (isStillUploading) {
      alert('Ảnh đang được tải lên S3, vui lòng đợi trong giây lát!')
      return
    }
    // Cho phép gửi nếu có tin nhắn HOẶC có ảnh
    if (!message.trim() && drafts.length === 0) return

    // Chuẩn bị danh sách attachment đúng cấu trúc Backend yêu cầu
    const attachments = drafts.map((d) => ({
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      contentType: d.contentType,
      fileSize: d.fileSize,
    }))
    console.log(attachments)

    const reply = replyTo
    let tempContent = message

    if (reply && replyTag) {
      const trimmedStart = tempContent.trimStart()
      if (trimmedStart.startsWith(replyTag)) {
        tempContent = trimmedStart.slice(replyTag.length).trimStart()
      }
    }

    const outgoingContent = reply
      ? buildReplyEncodedContent({
          replyName: getDisplayNameForMessage(reply, selfUserName),
          replyText: reply.content,
          messageText: tempContent,
        })
      : tempContent

    setMessage('')
    if (reply) setReplyTo(null)

    const tempMessageId = `temp_${Date.now()}`
    const optimisticMessage: MessageResponse = {
      id: tempMessageId,
      content: outgoingContent,
      createdAt: new Date().toISOString(),
      self: true,
      roomId: roomId,
      attachments: attachments,
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
      await sendMessage({
        roomId,
        content: outgoingContent,
        messageType: 'USER',
        attachments: attachments.length > 0 ? attachments : undefined,
      }).unwrap()
      setDrafts([])
      setMessage('')
      if (replyTo) setReplyTo(null)
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error)
      setMessage(tempContent)
      if (reply) setReplyTo(reply)
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
        enabled={Platform.OS === 'ios'}
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <YStack
          flex={1}
          bg="$background"
          paddingBottom={Platform.OS === 'android' ? effectiveAndroidKeyboardHeight : 0}
        >
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
              data={normalizedMessages}
              inverted={true}
              keyExtractor={(item: MessageResponse) => item.id}
              contentContainerStyle={{
                // FlatList is inverted, so paddingTop becomes the *bottom* spacing.
                // This prevents the newest message + avatar from being hidden under the composer.
                paddingTop: listBottomSpacer + 13,
                // In inverted mode, paddingBottom becomes the *top* spacing.
                paddingBottom: 20,
              }}
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
                const items = normalizedMessages || []
                const isMe = msg.self
                const myBubbleBg = theme === 'dark' ? '$blue11' : '$blue10'
                const myBubbleText = 'white'

                // items is newest -> oldest because we unshift new messages and push older messages.
                // With inverted FlatList, index 0 is rendered at the bottom (newest).
                // Grouping is based on consecutive messages from the same sender (adjacent in this array).
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

                const isSelected = selectionMode && selectedIds.has(msg.id)

                const parsedReply = parseReplyEncodedContent(msg.content)
                const isReplyMessage = !!parsedReply
                const messageTextToRender = parsedReply?.messageText ?? msg.content

                // Reference-image styling for replied messages only
                const replyBubbleBg = theme === 'dark' ? '$blue3' : '$blue2'
                const replyBubbleBorderColor = '$blue5'
                const replyPreviewBg = theme === 'dark' ? '$blue6' : '$blue5'
                const replyNameColor = '$blue11'
                const replyPreviewTextColor = '$color10'
                const replyMainTextColor = '$color12'
                const replyTimeColor = '$color10'

                const bubbleTextColor = replyMainTextColor

                // Tách danh sách media (ảnh/video) và tài liệu (pdf, doc...)
                const mediaAttachments =
                  msg.attachments?.filter(
                    (at) =>
                      at.contentType?.startsWith('image/') || at.contentType?.startsWith('video/')
                  ) || []

                const fileAttachments =
                  msg.attachments?.filter(
                    (at) =>
                      !at.contentType?.startsWith('image/') && !at.contentType?.startsWith('video/')
                  ) || []

                const hasMedia = mediaAttachments.length > 0
                const hasFiles = fileAttachments.length > 0
                const hasText = !!messageTextToRender.trim()
                const otherBubbleBg = theme === 'dark' ? '$color2' : '$background'

                const bubbleBg = isMe ? replyBubbleBg : otherBubbleBg
                const selectedBg = isMe
                  ? theme === 'dark'
                    ? '$blue6'
                    : '$blue5'
                  : theme === 'dark'
                    ? '$color3'
                    : '$backgroundHover'
                const effectiveBubbleBg = isSelected ? selectedBg : bubbleBg
                const bubbleBorderColor = isSelected
                  ? '$blue10'
                  : isMe
                    ? replyBubbleBorderColor
                    : '$borderColor'
                const bubbleBorderWidth = isSelected ? 2 : 1

                const toggleSelected = (messageId: string) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(messageId)) next.delete(messageId)
                    else next.add(messageId)
                    return next
                  })
                }

                const enterMultiSelect = (message: MessageResponse) => {
                  setReplyTo(null)
                  setSelectionMode(true)
                  setSelectedIds((prev) => {
                    const next = new Set(prev)
                    next.add(message.id)
                    return next
                  })
                }

                const deleteForMe = (message: MessageResponse) => {
                  setLocallyRecalledIds((prev) => {
                    const next = new Set(prev)
                    next.delete(message.id)
                    return next
                  })
                  setLocallyDeletedIds((prev) => {
                    const next = new Set(prev)
                    next.add(message.id)
                    return next
                  })
                }

                const recallMessage = (message: MessageResponse) => {
                  setLocallyDeletedIds((prev) => {
                    const next = new Set(prev)
                    next.delete(message.id)
                    return next
                  })
                  setLocallyRecalledIds((prev) => {
                    const next = new Set(prev)
                    next.add(message.id)
                    return next
                  })
                }

                return (
                  <XStack
                    justifyContent={isMe ? 'flex-end' : 'flex-start'}
                    alignItems={isMe ? 'flex-end' : 'flex-start'}
                    space="$2"
                    mb="$2"
                  >
                    {!isMe && selectionMode && (
                      <YStack width={22} alignItems="center" justifyContent="center">
                        {isSelected ? (
                          <Circle size={18} bg="$blue10">
                            <Check size={12} color="white" />
                          </Circle>
                        ) : (
                          <YStack width={18} height={18} />
                        )}
                      </YStack>
                    )}
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
                    <MessageActionMenu
                      message={msg}
                      isMe={isMe}
                      selectionMode={selectionMode}
                      isSelected={isSelected}
                      onToggleSelected={toggleSelected}
                      onCopy={async (message) => {
                        if (
                          locallyDeletedIds.has(message.id) ||
                          locallyRecalledIds.has(message.id)
                        ) {
                          return
                        }
                        await copyText(message.content)
                      }}
                      onReply={(message) => {
                        setSelectionMode(false)
                        setSelectedIds(new Set())
                        setReplyTo(message)

                        const name = getDisplayNameForMessage(message, selfUserName)
                        const tagWithSpace = `@${name} `
                        setMessage((prev) => {
                          const next = (prev || '').trimStart()
                          if (next.startsWith(tagWithSpace.trimEnd())) return prev || ''
                          return tagWithSpace
                        })
                      }}
                      onForward={(message) => {
                        setMessage(message.content)
                      }}
                      onEnterMultiSelect={enterMultiSelect}
                      onDeleteForMe={deleteForMe}
                      onRecall={isMe ? recallMessage : undefined}
                    >
                      <YStack space="$2" alignItems={isMe ? 'flex-end' : 'flex-start'}>
                        {/* --- TRƯỜNG HỢP 2.1: ẢNH & VIDEO --- */}
                        {hasMedia && (
                          <YStack
                            borderRadius="$4"
                            overflow="hidden"
                            bg={effectiveBubbleBg}
                            borderWidth={bubbleBorderWidth}
                            borderColor={bubbleBorderColor}
                            maxWidth={300}
                            position="relative"
                          >
                            <MediaGrid media={mediaAttachments} />

                            {/* Caption Text nằm trong cùng box với Media */}
                            {hasText && (
                              <YStack p="$2.5">
                                <Text fontSize="$4" color={bubbleTextColor} lineHeight={20}>
                                  {messageTextToRender}
                                </Text>
                                {/* Nếu là cuối group hoặc solo thì hiện giờ ngay dưới text */}
                                {showTimestamp && (
                                  <Text
                                    fontSize="$1"
                                    textAlign="right"
                                    mt="$1"
                                    color={replyTimeColor}
                                  >
                                    {timeString}
                                  </Text>
                                )}
                              </YStack>
                            )}

                            {/* Nếu CHỈ CÓ Media (không chữ) + showTimestamp: Hiện giờ đè lên ảnh */}
                            {!hasText && showTimestamp && (
                              <YStack
                                position="absolute"
                                bottom={6}
                                right={8}
                                bg="rgba(0,0,0,0.4)"
                                px="$1.5"
                                py="$0.5"
                                borderRadius="$2"
                              >
                                <Text fontSize="$1" color="white">
                                  {timeString}
                                </Text>
                              </YStack>
                            )}
                          </YStack>
                        )}

                        {/* --- TRƯỜNG HỢP 1: CHỈ CÓ TEXT (Không kèm media) --- */}
                        {hasText && !hasMedia && (
                          <YStack
                            p="$3"
                            borderRadius="$4"
                            maxWidth={300}
                            bg={effectiveBubbleBg}
                            borderWidth={bubbleBorderWidth}
                            borderColor={bubbleBorderColor}
                          >
                            {/* Phần hiển thị tin nhắn đang trả lời (Reply) */}
                            {parsedReply && (
                              <YStack
                                bg={replyPreviewBg}
                                borderRadius="$3"
                                paddingHorizontal="$2"
                                paddingVertical="$2"
                                marginBottom="$2"
                                space="$1"
                              >
                                <Text
                                  fontSize="$3"
                                  fontWeight="700"
                                  numberOfLines={1}
                                  color={replyNameColor}
                                >
                                  {parsedReply.replyName}
                                </Text>
                                <Text
                                  fontSize="$2"
                                  color={replyPreviewTextColor}
                                  opacity={0.85}
                                  numberOfLines={1}
                                >
                                  {parsedReply.replyText}
                                </Text>
                              </YStack>
                            )}

                            {/* Nội dung tin nhắn chữ */}
                            <Text fontSize="$4" color={bubbleTextColor} lineHeight={20}>
                              {messageTextToRender}
                            </Text>

                            {/* Thời gian gửi tin nhắn */}
                            {showTimestamp && (
                              <Text
                                fontSize="$1"
                                textAlign={isMe ? 'right' : 'left'}
                                mt="$1"
                                color={replyTimeColor}
                              >
                                {timeString}
                              </Text>
                            )}
                          </YStack>
                        )}

                        {/* --- TRƯỜNG HỢP 2.2: FILE TÀI LIỆU (Luôn tách riêng) --- */}
                        {/* --- 3. KHỐI FILE TÀI LIỆU (Tách riêng) --- */}
                        {hasFiles && (
                          <YStack
                            space="$1"
                            maxWidth={250}
                            alignItems={isMe ? 'flex-end' : 'flex-start'}
                          >
                            {fileAttachments.map((at, idx) => (
                              <YStack key={idx} alignItems={isMe ? 'flex-end' : 'flex-start'}>
                                <XStack
                                  p="$2"
                                  bg="$color3"
                                  borderRadius="$3"
                                  alignItems="center"
                                  space="$2"
                                  onPress={() => window.open(at.fileUrl)}
                                >
                                  <File size={20} color="$color11" />
                                  <YStack flex={1}>
                                    <Text numberOfLines={1} fontSize="$3" fontWeight="500">
                                      {at.fileName}
                                    </Text>
                                    <Text fontSize="$1" color="$color10">
                                      {(at.fileSize / 1024).toFixed(1)} KB
                                    </Text>
                                  </YStack>
                                  <Download size={16} color="$color10" />
                                </XStack>

                                {/* Hiển thị giờ dưới file cuối cùng nếu là cuối group */}
                                {showTimestamp && idx === fileAttachments.length - 1 && (
                                  <Text fontSize="$1" mt="$1" color={replyTimeColor}>
                                    {timeString}
                                  </Text>
                                )}
                              </YStack>
                            ))}
                          </YStack>
                        )}
                      </YStack>
                    </MessageActionMenu>

                    {isMe && selectionMode && (
                      <YStack width={22} alignItems="center" justifyContent="center">
                        {isSelected ? (
                          <Circle size={18} bg="$blue10">
                            <Check size={12} color="white" />
                          </Circle>
                        ) : (
                          <YStack width={18} height={18} />
                        )}
                      </YStack>
                    )}
                  </XStack>
                )
              }}
            />
          )}

          {/* --- COMPOSER BARS (WEB ONLY) --- */}
          {isWeb && replyTo && (
            <XStack
              px="$3"
              py="$2"
              bg="$background"
              borderColor="$borderColor"
              borderTopWidth={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <YStack flex={1} marginRight="$2">
                <Text fontWeight="700" numberOfLines={1}>
                  {replyName}
                </Text>
                <Text numberOfLines={1} color="$color10">
                  {replyTo.content}
                </Text>
              </YStack>
              <Button
                size="$2"
                circular
                chromeless
                icon={X}
                onPress={() => {
                  setReplyTo(null)
                  setMessage('')
                }}
              />
            </XStack>
          )}

          {selectionMode && (
            <XStack
              px="$3"
              py="$2"
              bg="$background"
              borderColor="$borderColor"
              borderTopWidth={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <XStack alignItems="center" space="$2" flex={1}>
                <Text fontWeight="700">{selectedCount}</Text>
                <Text color="$color10">Đã chọn</Text>
              </XStack>

              <XStack space="$2" alignItems="center">
                <Button
                  size="$3"
                  borderRadius="$10"
                  theme="blue"
                  icon={<Copy size={16} />}
                  disabled={selectedCount === 0}
                  onPress={async () => {
                    const selected = (normalizedMessages || []).filter((m) => selectedIds.has(m.id))
                    const text = selected
                      .slice()
                      .reverse()
                      .map((m) => m.content)
                      .join('\n')
                    await copyText(text)
                  }}
                >
                  Sao chép
                </Button>

                <Button
                  size="$3"
                  borderRadius="$10"
                  theme="green"
                  icon={<Forward size={16} />}
                  disabled={selectedCount === 0}
                  onPress={() => {
                    const selected = (normalizedMessages || []).filter((m) => selectedIds.has(m.id))
                    const text = selected
                      .slice()
                      .reverse()
                      .map((m) => m.content)
                      .join('\n')
                    setMessage(text)
                    setSelectionMode(false)
                    setSelectedIds(new Set())
                  }}
                >
                  Chuyển tiếp
                </Button>

                <Button
                  size="$3"
                  borderRadius="$10"
                  theme="red"
                  icon={<Trash2 size={16} />}
                  disabled={selectedCount === 0}
                  onPress={() => {
                    // Safety: only allow deleting your own selected messages (frontend-only)
                    const mine = (normalizedMessages || []).filter(
                      (m) => selectedIds.has(m.id) && m.self
                    )
                    if (mine.length > 0) {
                      setLocallyRecalledIds((prev) => {
                        const next = new Set(prev)
                        for (const m of mine) next.delete(m.id)
                        return next
                      })
                      setLocallyDeletedIds((prev) => {
                        const next = new Set(prev)
                        for (const m of mine) next.add(m.id)
                        return next
                      })
                    }
                    setSelectionMode(false)
                    setSelectedIds(new Set())
                  }}
                >
                  Xóa
                </Button>

                <Button
                  size="$3"
                  borderRadius="$10"
                  chromeless
                  onPress={() => {
                    setSelectionMode(false)
                    setSelectedIds(new Set())
                  }}
                >
                  Hủy
                </Button>
              </XStack>
            </XStack>
          )}

          {/* --- FOOTER (INPUT) --- */}
          {/* --- VÙNG HIỂN THỊ ẢNH ĐANG CHỜ (DRAFTS) --- */}
          {/* --- VÙNG HIỂN THỊ ẢNH ĐANG CHỜ --- */}
          {drafts.length > 0 && (
            <XStack px="$3" py="$2" space="$2" bg="$background">
              <StyledFlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={drafts}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item }: { item: any }) => {
                  const isImage = item.contentType?.startsWith('image/')
                  const isVideo = item.contentType?.startsWith('video/')

                  return (
                    <YStack
                      width={70}
                      height={70}
                      marginRight="$2"
                      borderRadius="$3"
                      overflow="hidden"
                      bg="$color5"
                      position="relative"
                    >
                      {isImage ? (
                        <Image
                          source={{ uri: item.localUri }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : isVideo ? (
                        <YStack fullscreen alignItems="center" justifyContent="center" bg="$blue5">
                          <Video size={24} color="$blue10" /> {/* Icon từ lucide-icons */}
                          <Text fontSize="$1" textAlign="center">
                            Video
                          </Text>
                        </YStack>
                      ) : (
                        <YStack
                          fullscreen
                          alignItems="center"
                          justifyContent="center"
                          bg="$orange5"
                        >
                          <FileText size={24} color="$orange10" />
                          <Text fontSize="$1" numberOfLines={1} px="$1">
                            {item.fileName}
                          </Text>
                        </YStack>
                      )}

                      {/* Icon loading và nút X giữ nguyên */}
                    </YStack>
                  )
                }}
              />
            </XStack>
          )}
          <XStack
            px="$2"
            py={Platform.OS === 'web' ? '$2' : '$1.5'}
            paddingBottom={Platform.OS === 'web' ? undefined : (insets?.bottom ?? 0) + 8}
            onLayout={(e) => {
              if (isWeb) return
              const nextHeight = Math.round(e.nativeEvent.layout.height)
              if (nextHeight > 0 && nextHeight !== composerHeight) {
                setComposerHeight(nextHeight)
              }
            }}
            alignItems="center"
            bg="$background"
            borderColor="$borderColor"
            borderWidth={1}
            space="$2"
          >
            <Button size="$3" circular chromeless icon={MoreHorizontal} />
            <Button
              size="$3"
              circular
              chromeless
              icon={ImageIcon}
              onPress={handlePickFile} // Gọi hàm từ Hook của bạn
            />

            <Input
              flex={1}
              size={Platform.OS === 'web' ? '$4' : '$3'}
              height={Platform.OS === 'web' ? undefined : 40}
              borderRadius="$10"
              bg="$color3"
              borderWidth={0}
              placeholder="Nhập tin nhắn..."
              value={message}
              onChangeText={setMessage}
            />

            {message.trim() || drafts.length > 0 ? ( // SỬA ĐIỀU KIỆN Ở ĐÂY
              <Button
                size="$4"
                circular
                bg={theme === 'dark' ? '$blue11' : '$blue10'}
                color="white"
                icon={<SendHorizontal size={20} />}
                onPress={handleSendMessage}
                // Chặn người dùng bấm gửi khi ảnh chưa upload xong lên S3
                disabled={drafts.some((d) => d.isUploading)}
                opacity={drafts.some((d) => d.isUploading) ? 0.5 : 1}
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
