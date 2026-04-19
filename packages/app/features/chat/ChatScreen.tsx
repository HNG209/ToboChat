import { use, useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid';
import {
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  useWindowDimensions,
  Linking,
} from 'react-native'
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  Avatar,
  Theme,
  Circle,
  Image,
  ZStack,
  ForwardMessageDialog,
  RoomStatus,
  Sheet,
} from '@my/ui'
import {
  SendHorizontal,
  Heart,
  Phone,
  Video,
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
  useForwardMessagesMutation,
  useRevokeMessageMutation,
  useSendMessageMutation,
  useDeleteMessageMutation,
} from 'app/services/chatApi'
import { roomApi, useGetJoinedRoomsQuery, useGetRoomMetadataQuery } from 'app/services/roomApi'
import { getSocket } from 'app/utils/socket'
import { useDispatch, useSelector } from 'react-redux'
import { Attachment, MessageResponse } from 'app/types/Response'
import { AppDispatch, RootState, store } from 'app/store'
import { StyledFlatList } from '@my/ui/src/StyledFlatList'
import { useAppTheme } from 'app/provider/ThemeContext'
import { copyToClipboard } from 'app/utils/clipboard'
import { useChatAttachment } from '../../hooks/useChatAttachment'
import { MediaViewer } from 'app/media/MediaViewer'
import { formatPreviewMessage } from 'app/utils/chatHelper';
import { ChatScreenHeader } from '@my/ui/src/ChatScreenHeader';
import { ChatScreenFooter } from '@my/ui/src/ChatScreenFooter';
import { MessageItem } from '@my/ui/src/MessageItem';
import { ConversationInfoContent } from '@my/ui/src/ConversationInfoContent';





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
  const nextCursorRef = useRef<string | undefined>(undefined)
  const prevCursorRef = useRef<string | undefined>(undefined)
  const flatListRef = useRef<any>(null)
  const replyCursorRef = useRef<string | undefined>(undefined)
  const hasJumpedToReplyRef = useRef(false) // chặn nhiều lần scroll khi cursor thay đổi liên tục
  const isJumpingToReplyRef = useRef(false) // đánh dấu đang trong quá trình scroll tới tin nhắn reply, để tạm thời disable tính năng load more tránh xung đột
  const isUserAtBottomRef = useRef(true)
  const justNudgedRef = useRef(false)
  const loadMoreDirectionRef = useRef<'before' | 'after' | null>(null)

  // Thêm state vào ChatScreen
  const [viewerVisible, setViewerVisible] = useState(false)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [currentMediaList, setCurrentMediaList] = useState<any[]>([])
  const [status, setStatus] = useState<RoomStatus>('ACTIVE')

  const openViewer = (mediaList: any[], index: number) => {
    setCurrentMediaList(mediaList)
    setActiveMediaIndex(index)
    setViewerVisible(true)
  }
  // Revoke message
  const [revokeMessage] = useRevokeMessageMutation()
  // Frontend-only message actions
  const isWeb = Platform.OS === 'web'
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(() => new Set())
  const [locallyRecalledIds, setLocallyRecalledIds] = useState<Set<string>>(() => new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null)
  const isClosingViewerRef = useRef(false)
  const [direction, setDirection] = useState<'before' | 'after' | 'both'>('before')
  // Show infor screen
  const [showInfo, setShowInfo] = useState(false)
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
  const { data, isLoading, isError, error } = useGetMessagesQuery(
    {
      roomId,
      cursor: replyCursorRef.current,
      direction,
    },
    {
      skip: !hasSession || !roomId,
      refetchOnMountOrArgChange: true,
      // refetchOnFocus: true,
      // refetchOnReconnect: true,
    }
  )

  const isRoomNotFound = isError && (error as any)?.data.code === 40031

  const [triggerGetMessages, { isFetching: isFetchingMore }] = useLazyGetMessagesQuery()
  const { data: roomData, isLoading: isRoomLoading } = useGetRoomMetadataQuery(
    { roomId },
    {
      skip: !hasSession || !roomId,
      refetchOnMountOrArgChange: true,
    }
  )
  const { data: joinedRoomsData, isLoading: isJoinedRoomsLoading } = useGetJoinedRoomsQuery(
    { status },
    {
      skip: !hasSession,
      refetchOnMountOrArgChange: true,
    }
  )
  const [sendMessage] = useSendMessageMutation()
  const [forwardMessages, { isLoading: isForwarding }] = useForwardMessagesMutation()
  const [deleteMessage] = useDeleteMessageMutation()
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false)
  const [forwardSourceMessages, setForwardSourceMessages] = useState<MessageResponse[]>([])

  // Tự động cuộn tới tin nhắn reply sau khi fetch xong trang chứa nó
  useEffect(() => {
    if (!replyCursorRef.current) return // chỉ scroll khi có cursor reply, tránh scroll khi load more
    if (!data?.items?.length) return // chỉ scroll khi đã có dữ liệu
    if (hasJumpedToReplyRef.current) return // chỉ scroll 1 lần cho mỗi cursor reply, tránh scroll khi load more hoặc refetch do các nguyên nhân khác

    const match = replyCursorRef.current?.match(/^MSG#(.+)$/)
    const replyMessageId = match ? match[1] : null
    if (!replyMessageId) return

    const index = findMessageIndex(replyMessageId)
    if (index !== -1) {
      isJumpingToReplyRef.current = true
      setTimeout(() => {
        scrollToMessage(index)
        setTimeout(() => {
          isJumpingToReplyRef.current = false
          hasJumpedToReplyRef.current = true // Đánh dấu đã scroll xong
        }, 500)
      }, 100)
    }
  }, [data?.items])

  // Nudge slider lên một chút khi có tin nhắn mới và user đang ở cuối
  useEffect(() => {
    if (!flatListRef.current) return
    if (!data?.items?.length) return
    if (isUserAtBottomRef.current) {
      justNudgedRef.current = true // Đánh dấu vừa nudge
      flatListRef.current.scrollToOffset({ offset: 200, animated: false })
    }
  }, [data?.items?.length])

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

  const availableForwardRooms = useMemo(() => {
    return (joinedRoomsData?.items || [])
      .filter((room) => room.id !== roomId)
      .slice()
      .sort((left, right) => left.roomName.localeCompare(right.roomName))
  }, [joinedRoomsData?.items, roomId])

  const selectedMessages = useMemo(
    () => (normalizedMessages || []).filter((message) => selectedIds.has(message.id)),
    [normalizedMessages, selectedIds]
  )
  const handleEnterMultiSelect = (msg: MessageResponse) => {
    setSelectionMode(true);
    // Sử dụng callback (prev) để đảm bảo state mới nhất
    setSelectedIds(new Set([msg.id]));
  };

  const toggleSelected = (messageId: string) => {
    // Nếu đang đóng Viewer ảnh thì bỏ qua để tránh xung đột
    if (isClosingViewerRef.current) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
        // Nếu xóa hết thì tự tắt mode chọn nhiều
        if (next.size === 0) setSelectionMode(false);
      } else {
        next.add(messageId);
      }
      return new Set(next);
    });
  };
  useEffect(() => {
    if (!forwardDialogOpen) {
      setForwardSourceMessages([])
    }
  }, [forwardDialogOpen])

  const openForwardDialog = (messagesToForward: MessageResponse[]) => {
    const nextMessages = messagesToForward.filter(Boolean)
    if (nextMessages.length === 0) return

    setForwardSourceMessages(nextMessages)
    setForwardDialogOpen(true)
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleForwardConfirm = async (targetRoomIds: string[]) => {
    if (forwardSourceMessages.length === 0 || targetRoomIds.length === 0) return

    await forwardMessages({
      fromRoomId: roomId,
      toRoomIds: targetRoomIds,
      messageIds: forwardSourceMessages.map((message) => message.id),
    }).unwrap()
  }
  // 2. Load More Logic
  const handleLoadMore = async (direction: 'before' | 'after') => {
    if (isFetchingMore || isJumpingToReplyRef.current) return
    loadMoreDirectionRef.current = direction

    if (direction === 'before' && !data?.nextCursor) {
      console.log('Không còn tin nhắn cũ để tải')
      nextCursorRef.current = undefined
      return
    }

    if (direction === 'after' && !data?.prevCursor) {
      console.log('Không còn tin nhắn mới để tải')
      prevCursorRef.current = undefined
      return
    }

    if (direction === 'before') nextCursorRef.current = data?.nextCursor
    else prevCursorRef.current = data?.prevCursor

    try {
      await triggerGetMessages({
        roomId,
        cursor: direction === 'before' ? nextCursorRef.current : prevCursorRef.current,
        limit: 20,
        direction,
      }).unwrap()
    } catch (error) {
      console.error('Lỗi khi tải thêm tin nhắn cũ:', error)
    }
  }

  const findMessageIndex = (messageId: string) => {
    return data?.items?.findIndex((m) => m.id === messageId) ?? -1
  }

  const scrollToMessage = (index: number) => {
    if (index < 0 || !flatListRef.current) return

    flatListRef.current.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5, // Cố gắng đưa tin nhắn vào giữa màn hình
    })
  }

  const handleDeleteMessage = async (messageId: string) => {
    let nextMessage: MessageResponse | null = null

    // lấy snapshot trước
    const currentMessages = chatApi.endpoints.getMessages.select({ roomId })(store.getState())

    const items = currentMessages?.data?.items || []
    const index = items.findIndex((m) => m.id === messageId)

    if (index !== -1) {
      nextMessage =
        items[index + 1] ||
        items[index - 1] ||
        null
    }

    // update message list
    dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        if (!draft.items) return
        const idx = draft.items.findIndex((m) => m.id === messageId)
        if (idx !== -1) {
          draft.items.splice(idx, 1)
        }
      })
    )

    // update room list
    dispatch(
      roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
        if (!draft?.items) return

        const room = draft.items.find((r) => r.id === roomId)
        if (!room) return

        if (room.latestMessage?.id === messageId) {
          room.latestMessage.content = formatPreviewMessage(nextMessage)
        }
      })
    )

    try {
      await deleteMessage({ roomId, messageId }).unwrap()
    } catch (error) {
      console.error('Lỗi khi xoá tin nhắn:', error)

      dispatch(chatApi.util.invalidateTags(['Messages']))
      dispatch(roomApi.util.invalidateTags(['Rooms']))
    }
  }

  const handleRevokeMessage = async (message: MessageResponse) => {
    // Optimistic update để UI đổi ngay, không cần chờ API.
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

    dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        const msg = draft.items?.find((m) => m.id === message.id)
        if (msg) {
          ; (msg as any).messageStatus = 'REVOKED'
          msg.replyTo = undefined
          msg.attachments = []
          msg.content = 'Tin nhắn đã được thu hồi'
        }
      })
    )

    dispatch(
      roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
        if (!draft?.items) return
        const roomIndex = draft.items.findIndex((r) => r.id === roomId)
        if (roomIndex !== -1) {
          const msg = draft.items[roomIndex].latestMessage
          if (msg && msg.id === message.id) {
            msg.messageStatus = 'REVOKED'
          }

          // format lại nội dung nếu tin nhắn bị thu hồi
          msg.content = formatPreviewMessage(msg)
          msg.attachments = [] // ẩn attachments nếu tin nhắn bị thu hồi
        }
      })
    )

    try {
      await revokeMessage({
        roomId,
        messageId: message.id,
      }).unwrap()
    } catch (err) {
      console.error('Thu hồi thất bại:', err)

      // Rollback optimistic update nếu API lỗi.
      setLocallyRecalledIds((prev) => {
        const next = new Set(prev)
        next.delete(message.id)
        return next
      })
    }
  }

  const handlePressReply = async (replyMessageId: string) => {
    if (!replyMessageId) return

    // Nếu tin nhắn đã có trong cache, scroll tới đó ngay mà không cần gọi API
    const index = findMessageIndex(replyMessageId)

    if (index !== -1) {
      scrollToMessage(index)
      return
    }

    // Reset cache rtk
    dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        draft.items = []
        draft.nextCursor = undefined
        draft.prevCursor = undefined
      })
    )

    // Set cursor để kích hoạt lại query và fetch đúng trang chứa tin nhắn reply
    replyCursorRef.current = `MSG#${replyMessageId}`
    hasJumpedToReplyRef.current = false
    setDirection('both')
  }
  // 3. Send Message Logic
  const handleSendMessage = async (content: string) => {
    // 1. Kiểm tra trạng thái upload (Giữ nguyên logic của Đạt)
    const isStillUploading = drafts.some((d) => d.isUploading)
    const hasError = drafts.some((d) => (d as any).error)
    const message = content;
    if (isStillUploading) {
      alert('Vui lòng đợi tệp tin đang được tải lên...')
      return
    }

    if (hasError) {
      alert('Có tệp tin bị lỗi upload, vui lòng xóa hoặc thử lại!')
      return
    }

    // 2. Xử lý attachments (Giữ nguyên logic của Đạt)
    const attachments: Attachment[] = drafts
      .filter((d) => d.fileUrl && d.fileUrl.startsWith('http'))
      .map((d) => ({
        fileUrl: d.fileUrl,
        fileName: d.fileName,
        contentType: d.contentType,
        fileSize: d.fileSize,
      }))

    if (!message.trim() && attachments.length === 0) return

    const reply = replyTo

    const optimisticMessage: MessageResponse = {
      id: uuidv4(), // ID tạm thời cho optimistic update, sẽ được backend trả về ID thật sau khi gửi thành công
      content: message,
      createdAt: new Date().toISOString(),
      self: true,
      roomId: roomId,
      replyTo: reply || undefined,
      attachments: attachments,
      // messageStatus: 'SENDING', // Trạng thái đang gửi
    }

    // Reset input và drafts
    if (reply) setReplyTo(null)
    setDrafts([])

    // 4. Optimistic Update (Cập nhật cache ngay lập tức)
    const patchResult = dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        if (!draft) return
        if (!draft.items) draft.items = []
        draft.items.unshift(optimisticMessage)
      })
    )

    try {
      // 1. Gửi tin nhắn
      const result = await sendMessage({
        roomId,
        content: message,
        messageType: 'USER',
        replyTo: replyTo?.id,
        attachments,
      }).unwrap()

      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
          if (!draft || !draft.items) return
          const roomIndex = draft.items.findIndex((room) => room.id === roomId)
          if (roomIndex !== -1) {
            draft.items[roomIndex].latestMessage = result
            const [updatedRoom] = draft.items.splice(roomIndex, 1)
            draft.items.unshift(updatedRoom)
          }
        })
      )

      // cập nhật lại cache với ID thật và trạng thái đã gửi
      dispatch(
        chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
          if (!draft || !draft.items) return
          const msg = draft.items?.find((m) => m.id === optimisticMessage.id)
          if (msg) {
            msg.id = result.id // Cập nhật ID thật từ server
            msg.createdAt = result.createdAt // Cập nhật timestamp chính xác từ server
            msg.content = result.content
          }
        })
      )
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error)
      if (reply) setReplyTo(reply)
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

    const handleMessageDeleted = async (message: MessageResponse) => {
      dispatch(
        chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
          const index = draft.items?.findIndex((m) => m.id === message.id)

          if (index !== undefined && index !== -1) {
            draft.items.splice(index, 1)
          }
        })
      )
    }

    const handleMessageRevoked = (data: { messageId: string; roomId: string }) => {
      if (data.roomId !== roomId) return
      // console.log('Received message_revoked event for messageId:', data.messageId)

      dispatch(
        chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
          const msg = draft.items?.find((m) => m.id === data.messageId)
          if (msg) {
            ; (msg as any).messageStatus = 'REVOKED'
            msg.content = 'Tin nhắn đã được thu hồi'
            msg.replyTo = undefined
            msg.attachments = []
          }
        })
      )

      setLocallyDeletedIds((prev) => {
        const next = new Set(prev)
        next.delete(data.messageId)
        return next
      })
      setLocallyRecalledIds((prev) => {
        const next = new Set(prev)
        next.add(data.messageId)
        return next
      })
    }

    socket.on('delete_message', handleMessageDeleted)
    socket.on('receive_message', handleReceiveMessage)
    socket.on('message_revoked', handleMessageRevoked)
    return () => {
      socket.off('delete_message', handleMessageDeleted)
      socket.off('receive_message', handleReceiveMessage)
      socket.off('message_revoked', handleMessageRevoked)
    }
  }, [roomId, isSocketReady, dispatch])

  return (
    <Theme name={theme}>
      <XStack flex={1} bg="$background">
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
            <ChatScreenHeader
              roomData={roomData}
              onInfoPress={() => setShowInfo(!showInfo)}
              isRoomLoading={isRoomLoading}
              insets={insets}
              linkProps={linkProps}
            />

            {/* --- BODY (FLATLIST) --- */}
            {/* Lần tải đầu tiên của cả phòng */}
            {isLoading ? (
              <XStack justifyContent="center" alignItems="center" flex={1} bg="$background">
                <ActivityIndicator size="large" color="#888" />
              </XStack>
            ) : isError && !isRoomNotFound ? (
              <XStack justifyContent="center" alignItems="center" flex={1} bg="$background">
                <Text color="red">Lỗi khi tải tin nhắn!</Text>
              </XStack>
            ) : (
              <StyledFlatList
                ref={flatListRef}
                data={data?.items || []}
                inverted={true}
                keyExtractor={(item: MessageResponse) => item.id}
                contentContainerStyle={{
                  // FlatList is inverted, so paddingTop becomes the *bottom* spacing.
                  // This prevents the newest message + avatar from being hidden under the composer.
                  paddingTop: listBottomSpacer + 13,
                  // In inverted mode, paddingBottom becomes the *top* spacing.
                  paddingBottom: 20,
                }}
                onEndReached={() => {
                  console.log('onEndReached (load older messages)')
                  handleLoadMore('before')
                }}
                onStartReached={() => {
                  if (
                    !isFetchingMore &&
                    !isJumpingToReplyRef.current &&
                    data?.prevCursor &&
                    isUserAtBottomRef.current &&
                    !justNudgedRef.current // Chặn fetch nếu vừa nudge
                  ) {
                    console.log('onStartReached (load newer messages)')
                    handleLoadMore('after')
                  }
                }}
                maintainVisibleContentPosition={{
                  // Giữ nguyên vị trí hiển thị khi load thêm tin nhắn
                  minIndexForVisible: 1,
                  autoscrollToTopThreshold: 10,
                }}
                onScroll={(e) => {
                  const { contentOffset } = e.nativeEvent
                  const atBottom = contentOffset.y < 20
                  if (atBottom && justNudgedRef.current) {
                    // User đã scroll về cuối sau khi nudge, cho phép fetch lại
                    justNudgedRef.current = false
                  }
                  isUserAtBottomRef.current = atBottom
                }}
                onScrollToIndexFailed={({ index, highestMeasuredFrameIndex, averageItemLength }) => {
                  if (flatListRef.current) {
                    flatListRef.current.scrollToOffset({
                      offset: highestMeasuredFrameIndex * averageItemLength,
                      animated: true,
                    })
                    setTimeout(() => {
                      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 })
                      isJumpingToReplyRef.current = false
                    }, 300)
                  } else {
                    isJumpingToReplyRef.current = false
                  }
                }}
                onEndReachedThreshold={0.1}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="always"
                removeClippedSubviews={false}
                ListEmptyComponent={
                  <YStack
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    py="$10"
                    // Vì Flatlist inverted, component rỗng cũng bị lộn ngược, cần scaleY: -1 để chữ đứng thẳng lại
                    transform={[{ scaleY: -1 }]}
                  >
                    <Text color="$color10" fontSize="$4">
                      Chưa có tin nhắn nào. Hãy gửi lời chào!
                    </Text>
                  </YStack>
                }
                // TRẠNG THÁI LOADING CHO LOAD MORE TẠI ĐÂY
                ListFooterComponent={
                  isFetchingMore && loadMoreDirectionRef.current === 'before' ? (
                    <XStack justifyContent="center" alignItems="center" py="$4">
                      <ActivityIndicator size="small" color="#888" />
                    </XStack>
                  ) : null
                }
                ListHeaderComponent={
                  isFetchingMore && loadMoreDirectionRef.current === 'after' ? (
                    <XStack justifyContent="center" alignItems="center" py="$4">
                      <ActivityIndicator size="small" color="#888" />
                    </XStack>
                  ) : null
                }

                renderItem={({ item: msg, index }) => (
                  <MessageItem
                    msg={msg}
                    index={index}
                    items={data?.items || []}
                    theme={theme}
                    selfUserId={selfUserId}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(msg.id)} // Truyền boolean true/false
                    locallyDeleted={locallyDeletedIds}
                    locallyRecalled={locallyRecalledIds}

                    // Mapping các actions
                    onToggleSelect={toggleSelected} // Chỉ truyền tên hàm
                    onEnterMultiSelect={handleEnterMultiSelect}
                    onReply={setReplyTo}
                    onForward={(msg) => openForwardDialog([msg])}
                    onDelete={(msg) => handleDeleteMessage(msg.id)}
                    onDeleteForMe={(msg) => handleDeleteMessage(msg.id)}
                    onRecall={handleRevokeMessage}
                    onCopy={(m) => copyText(m.content)}
                    onOpenMedia={openViewer}
                    onPressReplyRef={handlePressReply}
                    openViewer={openViewer}
                  />
                )}
              />
            )}


            {selectionMode && (
              <XStack
                px="$3"
                py="$2"
                bg="$background"
                borderColor="$borderColor"
                borderTopWidth={1}
                alignItems="center"
                width="100%"
                justifyContent="space-between"
                // --- THÊM RESPONSIVE TẠI ĐÂY ---
                {...(Platform.OS !== 'web' && {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  backgroundColor: theme === 'dark' ? '$color2' : 'white',
                  paddingBottom: (insets?.bottom ?? 0) + 8,
                  minHeight: composerHeight || 60,
                })}
              // ----------------------------
              >
                <XStack alignItems="center" space="$2" flex={1}>
                  <Text fontWeight="700">{selectedCount}</Text>
                  <Text color="$color10">Đã chọn</Text>
                </XStack>

                <XStack space="$1" alignItems="center">
                  <Button
                    size="$3"
                    borderRadius="$10"
                    theme="blue"
                    icon={<Copy size={16} />}
                    disabled={selectedCount === 0}
                    onPress={async () => {
                      const selected = (data?.items || []).filter((m) => selectedIds.has(m.id))
                      const text = selected
                        .slice()
                        .reverse()
                        .map((m) => m.content)
                        .join('\n')
                      await copyText(text)
                    }}
                  >
                    {Platform.OS === 'web' ? 'Sao chép' : ''}
                  </Button>

                  <Button
                    size="$3"
                    borderRadius="$10"
                    theme="green"
                    icon={<Forward size={16} />}
                    disabled={selectedCount === 0}
                    onPress={() => {
                      const selected = (data?.items || []).filter((m) => selectedIds.has(m.id))
                      const text = selected
                        .slice()
                        .reverse()
                        .map((m) => m.content)
                        .join('\n')
                      setMessage(text)
                      setSelectionMode(false)
                      setSelectedIds(new Set())
                      openForwardDialog(selectedMessages)
                    }}
                  >
                    {Platform.OS === 'web' ? 'Chuyển tiếp' : ''}
                  </Button>

                  <Button
                    size="$3"
                    borderRadius="$10"
                    theme="red"
                    icon={<Trash2 size={16} />}
                    disabled={selectedCount === 0}
                    onPress={() => {
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
                    {Platform.OS === 'web' ? 'Xóa' : ''}
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

            <ForwardMessageDialog
              open={forwardDialogOpen}
              onOpenChange={setForwardDialogOpen}
              messages={forwardSourceMessages}
              rooms={availableForwardRooms}
              isLoadingRooms={isJoinedRoomsLoading}
              currentRoomId={roomId}
              isSubmitting={isForwarding}
              onConfirm={handleForwardConfirm}
            />

            {/* --- FOOTER (INPUT) --- */}
            {/* --- PHẦN NHÃN TRẢ LỜI TRÊN INPUT --- */}
            {!selectionMode && replyTo && (() => {
              const replyAttachments = replyTo.attachments || [];
              const firstAt = replyAttachments[0];
              const isImage = firstAt?.contentType?.startsWith('image/');
              const isVideo = firstAt?.contentType?.startsWith('video/');
              const isFile = firstAt && !isImage && !isVideo;

              let displayLabel = replyTo.content || '';
              if (isImage) displayLabel = '[Hình ảnh]';
              if (isVideo) displayLabel = '[Video]';
              if (isFile) displayLabel = `[File] ${firstAt.fileName}`;

              return (
                <XStack
                  px="$3"
                  py="$2"
                  bg="$background"
                  borderTopWidth={1}
                  borderColor="$borderColor"
                  alignItems="center"
                  space="$2"
                  animation="quick"
                  enterStyle={{ opacity: 0, y: 10 }}
                >
                  {/* Vạch kẻ xanh bên trái */}
                  <YStack width={3} height="80%" bg="$blue10" borderRadius="$1" />

                  {/* Thumbnail nhỏ nếu là Media */}
                  {(isImage || isVideo) && (
                    <Image
                      source={{ uri: firstAt.fileUrl }}
                      width={36}
                      height={36}
                      borderRadius="$2"
                      bg="$color5"
                    />
                  )}

                  {/* Nội dung text */}
                  <YStack flex={1} justifyContent="center">
                    <Text fontWeight="700" fontSize="$3" color="$blue10" numberOfLines={1}>
                      Đang trả lời: {replyTo.user?.name || 'Người dùng'}
                    </Text>
                    <Text fontSize="$2" color="$color10" numberOfLines={1}>
                      {displayLabel}
                    </Text>
                  </YStack>

                  {/* Nút Hủy (X) để tắt chế độ trả lời */}
                  <Button
                    size="$2"
                    circular
                    chromeless
                    icon={X}
                    onPress={() => setReplyTo(null)}
                  />
                </XStack>
              );
            })()}
            {/* --- VÙNG HIỂN THỊ ẢNH ĐANG CHỜ (DRAFTS) --- */}
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
                        <ZStack fullscreen>
                          {/* 1. Hiển thị nội dung (Dùng localUri để hiện ảnh ngay lập tức) */}
                          {isImage ? (
                            <Image
                              source={{ uri: item.localUri }}
                              style={{
                                width: '100%',
                                height: '100%',
                                opacity: item.isUploading ? 0.5 : 1,
                              }}
                            />
                          ) : (
                            <YStack
                              fullscreen
                              alignItems="center"
                              justifyContent="center"
                              bg="$blue5"
                              opacity={item.isUploading ? 0.5 : 1}
                            >
                              {isVideo ? (
                                <Video size={20} color="$blue10" />
                              ) : (
                                <FileText size={20} color="$orange10" />
                              )}
                            </YStack>
                          )}

                          {/* 2. LỚP PHỦ LOADING (Chỉ hiện khi isUploading = true) */}
                          {item.isUploading && (
                            <YStack
                              fullscreen
                              alignItems="center"
                              justifyContent="center"
                              backgroundColor="rgba(0,0,0,0.2)"
                            >
                              <ActivityIndicator size="small" color="white" />
                            </YStack>
                          )}

                          {/* 3. NÚT XÓA (Chỉ hiện khi không đang upload hoặc hiển thị ở góc) */}
                          {!item.isUploading && (
                            <XStack
                              position="absolute"
                              top={2}
                              right={2}
                              onPress={() => removeDraft(item.id)}
                            >
                              <Circle
                                size={18}
                                bg="rgba(0,0,0,0.5)"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <X size={12} color="white" />
                              </Circle>
                            </XStack>
                          )}
                        </ZStack>
                      </YStack>
                    )
                  }}
                />
              </XStack>
            )}
            <ChatScreenFooter
              drafts={drafts}
              handleSendMessage={handleSendMessage}
              handlePickFile={handlePickFile}
              theme={theme}
              isWeb={isWeb}
              insets={insets}
              composerHeight={composerHeight}
              setComposerHeight={setComposerHeight}
            />
          </YStack>


        </KeyboardAvoidingView>
        {/* --- SIDEBAR THÔNG TIN (CHỈ CHO WEB) --- */}
        {Platform.OS === 'web' && showInfo && (
          <YStack
            width={350} // Độ rộng giống Zalo
            height="100%"
            borderLeftWidth={1}
            borderColor="$borderColor"
            bg="$background"
            animation="lazy"
            // Hiệu ứng trượt nhẹ từ phải sang
            enterStyle={{ x: 10, opacity: 0 }}
            exitStyle={{ x: 10, opacity: 0 }}
          >
            <ConversationInfoContent
              roomData={roomData}
              onClose={() => setShowInfo(false)}
            />
          </YStack>
        )}
        {/* --- HIỂN THỊ TRÊN MOBILE (Dùng Sheet) --- */}
        {Platform.OS !== 'web' && (
          <Sheet
            open={showInfo}
            onOpenChange={setShowInfo}
            snapPoints={[98]} // Chiếm 90% chiều cao màn hình
            dismissOnSnapToBottom
            modal
          >
            <Sheet.Overlay
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Sheet.Frame backgroundColor="$background">
              <Sheet.Handle />
              <ConversationInfoContent
                roomData={roomData}
                onClose={() => setShowInfo(false)}
              />
            </Sheet.Frame>
          </Sheet>
        )}
      </XStack>
      <MediaViewer
        visible={viewerVisible}
        mediaList={currentMediaList}
        activeIndex={activeMediaIndex}
        onClose={() => {
          setViewerVisible(false)
          setSelectionMode(false)
        }}
        onNext={() => setActiveMediaIndex((prev) => prev + 1)}
        onPrev={() => setActiveMediaIndex((prev) => prev - 1)}
      />
    </Theme >
  )
}
