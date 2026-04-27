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
  Copy,
  Forward,
  Trash2,
  Lock,
} from '@tamagui/lucide-icons'
import { useLink } from 'solito/navigation'
import {
  chatApi,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useForwardMessagesMutation,
  useRevokeMessageMutation,
  useDeleteMessageMutation,
} from 'app/services/chatApi'
import { roomApi, useGetJoinedRoomsQuery, useGetMyInfoQuery, useGetRoomMetadataQuery } from 'app/services/roomApi'
import { getSocket } from 'app/utils/socket'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { Attachment, MessageResponse } from 'app/types/Response'
import { AppDispatch, RootState, store } from 'app/store'
import { StyledFlatList } from '@my/ui/src/StyledFlatList'
import { useAppTheme } from 'app/provider/ThemeContext'
import { copyToClipboard } from 'app/utils/clipboard'
import { MediaViewer } from 'app/media/MediaViewer'
import { formatPreviewMessage } from 'app/utils/chatHelper';
import { ChatScreenHeader } from '@my/ui/src/ChatScreenHeader';
import { ChatScreenFooter } from '@my/ui/src/ChatScreenFooter';
import { MessageItem } from '@my/ui/src/MessageItem';
import { ConversationInfoContent } from '@my/ui/src/ConversationInfoContent';
import { GroupManagementContent } from '@my/ui/src/GroupManagementContent';
import { AddMemberContent } from '@my/ui/src/group/AddMemberDialog';
import { MemberManagementContent } from '@my/ui/src/group/MemberManagementContent';
import { ApproveMembersContent } from '@my/ui/src/group/ApproveMembersContent';

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
  const nextCursorRef = useRef<string | undefined>(undefined)
  const prevCursorRef = useRef<string | undefined>(undefined)
  const flatListRef = useRef<any>(null)
  const replyCursorRef = useRef<string | undefined>(undefined)
  const hasJumpedToReplyRef = useRef(false) // chặn nhiều lần scroll khi cursor thay đổi liên tục
  const isJumpingToReplyRef = useRef(false) // đánh dấu đang trong quá trình scroll tới tin nhắn reply, để tạm thời disable tính năng load more tránh xung đột
  const isUserAtBottomRef = useRef(true)
  const justNudgedRef = useRef(false)
  const loadMoreDirectionRef = useRef<'before' | 'after' | null>(null)

  const [viewerVisible, setViewerVisible] = useState(false)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [currentMediaList, setCurrentMediaList] = useState<any[]>([])
  const [status, setStatus] = useState<RoomStatus>('ACTIVE')

  const openViewer = (mediaList: any[], index: number) => {
    setCurrentMediaList(mediaList)
    setActiveMediaIndex(index)
    setViewerVisible(true)
  }
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
  const [infoView, setInfoView] = useState<'INFO' | 'MANAGEMENT' | 'ADD' | 'MEMBERS' | 'APPROVED'>('INFO');
  const listBottomSpacer = isWeb ? 0 : composerHeight
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
    }
  )

  const { data: myInfo } = useGetMyInfoQuery({ roomId });
  const isAdmin: boolean | undefined = myInfo?.role == 'ADMIN'
  const isViceAdmin: boolean | undefined = myInfo?.role == 'VICE_ADMIN'
  const isMember: boolean | undefined = myInfo?.role == 'MEMBER'

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
  const [forwardMessages, { isLoading: isForwarding }] = useForwardMessagesMutation()
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
                  paddingTop: listBottomSpacer + 13,
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
                    roomId={roomId}
                    status={status}
                    msg={msg}
                    index={index}
                    items={data?.items || []}
                    theme={theme}
                    selfUserId={selfUserId}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(msg.id)}
                    locallyDeleted={locallyDeletedIds}
                    locallyRecalled={locallyRecalledIds}

                    onToggleSelect={toggleSelected}
                    onEnterMultiSelect={handleEnterMultiSelect}
                    onReply={setReplyTo}
                    onForward={(msg) => openForwardDialog([msg])}
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

            {
              // Footer (đã refractor)
              (roomData?.roomType == 'GROUP' && !isAdmin && !isViceAdmin && !roomData?.allowSendMessage) ?
                <XStack
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="$backgroundHover" // Màu nền xám nhạt
                  py="$3"
                  px="$4"
                  space="$2"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <Lock size={16} color="$color11" />
                  <Text fontSize="$3" color="$color11" fontWeight="500">
                    Quản trị viên đã tắt cho phép gửi tin nhắn
                  </Text>
                </XStack> :
                <ChatScreenFooter
                  roomId={roomId}
                  status={status}
                  selectionMode={selectionMode}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  theme={theme}
                  isWeb={isWeb}
                  insets={insets}
                  composerHeight={composerHeight}
                  setComposerHeight={setComposerHeight}
                />
            }
          </YStack>


        </KeyboardAvoidingView>
        {/* --- SIDEBAR THÔNG TIN (CHỈ CHO WEB) --- */}
        {Platform.OS === 'web' && showInfo && (
          <YStack
            width={350}
            height="100%"
            borderLeftWidth={1}
            borderColor="$borderColor"
            bg="$background"
          >
            {infoView === 'INFO' ? (
              <ConversationInfoContent
                roomData={roomData}
                onClose={() => setShowInfo(false)}
                onManageGroup={() => setInfoView('MANAGEMENT')}
                onAddMember={() => setInfoView('ADD')}
                onViewMembers={() => setInfoView('MEMBERS')}
                onApproveMembers={() => setInfoView('APPROVED')}
                isAdmin={isAdmin}

              />
            ) : infoView === 'MANAGEMENT' ? (
              <GroupManagementContent
                roomData={roomData}
                isAdmin={isAdmin}
                onClose={() => setInfoView('INFO')}
              />
            ) : infoView === 'ADD' ? (
              <AddMemberContent
                roomId={roomData?.id}
                onClose={() => setInfoView('INFO')}
              />
            ) : infoView === 'MEMBERS' ? (
              <MemberManagementContent
                roomId={roomData?.id}
                currentUserId={myInfo?.id}
                isAdmin={isAdmin}
                onClose={() => setInfoView('INFO')}
              />
            ) : (
              <ApproveMembersContent
                roomId={roomData?.id}
                currentUserId={myInfo?.id}
                isAdmin={isAdmin}
                onClose={() => setInfoView('INFO')}
              />
            )}
          </YStack>
        )}
        {/* --- HIỂN THỊ TRÊN MOBILE (Dùng Sheet) --- */}
        {Platform.OS !== 'web' && (
          <Sheet
            open={showInfo}
            onOpenChange={setShowInfo}
            snapPoints={[98]}
            modal
            dismissOnSnapToBottom={false}
            disableDrag={true}
          >
            <Sheet.Frame>
              <Provider store={store}>
                {infoView === 'INFO' ? (
                  <ConversationInfoContent
                    roomData={roomData}
                    onClose={() => setShowInfo(false)}
                    onManageGroup={() => setInfoView('MANAGEMENT')}
                    onAddMember={() => setInfoView('ADD')}
                    onViewMembers={() => setInfoView('MEMBERS')}
                    onApproveMembers={() => setInfoView('APPROVED')}
                    isAdmin={isAdmin}
                  />
                ) : infoView === 'MANAGEMENT' ? (
                  <GroupManagementContent
                    roomData={roomData}
                    isAdmin={isAdmin}
                    onClose={() => setInfoView('INFO')}
                  />
                ) : infoView === 'ADD' ? (
                  <AddMemberContent
                    roomId={roomData?.id}
                    onClose={() => setInfoView('INFO')}
                  />
                ) : infoView === 'MEMBERS' ? (
                  <MemberManagementContent
                    roomId={roomData?.id}
                    currentUserId={myInfo?.id}
                    isAdmin={isAdmin}
                    onClose={() => setInfoView('INFO')}
                  />
                ) : (
                  <ApproveMembersContent
                    roomId={roomData?.id}
                    currentUserId={myInfo?.id}
                    isAdmin={isAdmin}
                    onClose={() => setInfoView('INFO')}
                  />)}
              </Provider>
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
