import { useRef } from 'react'
import { Linking, Pressable } from 'react-native'
import { XStack, YStack, Text, Avatar, Circle, Image } from '@my/ui'
import { Check, File, Download } from '@tamagui/lucide-icons'
import { MessageActionMenu } from './MessageActionMenu'
import { MediaGrid } from 'app/media/MediaGrid'
import { MessageResponse } from 'app/types/Response'
import { chatApi, useDeleteMessageMutation, useRevokeMessageMutation } from 'app/services/chatApi'
import { useDispatch } from 'react-redux'
import { AppDispatch, store } from 'app/store'
import { roomApi } from 'app/services/roomApi'
import { RoomStatus } from './ChatInbox'
import { formatPreviewMessage, formatSystemMessage } from 'app/utils/chatHelper';
import { WidgetMessage } from './WidgetMessage'

interface Props {
  roomId: string
  status: RoomStatus
  msg: MessageResponse
  index: number
  items: MessageResponse[]

  // state
  selfUserId?: string
  selfUserName?: string
  selectionMode: boolean
  selected: boolean
  locallyDeleted: Set<string>
  locallyRecalled: Set<string>

  // actions
  onToggleSelect: (id: string) => void
  onReply: (msg: MessageResponse) => void
  onForward: (msg: MessageResponse) => void
  onCopy: (msg: MessageResponse) => void
  onOpenMedia: (media: any[], index: number) => void
  onPressReplyRef: (id: string) => void
  onEnterMultiSelect: (msg: MessageResponse) => void;
}

function canGroup(a?: MessageResponse, b?: MessageResponse, selfUserId?: string) {
  if (!a || !b) return false
  const aKey = a.user?.id
  const bKey = b.user?.id
  return aKey === bKey
}

export function MessageItem({
  roomId,
  selfUserId,
  status,
  msg,
  index,
  items,
  selectionMode,
  selected,
  onToggleSelect,
  onReply,
  onForward,
  onCopy,
  onOpenMedia,
  onPressReplyRef,
  onEnterMultiSelect
}: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const [deleteMessage] = useDeleteMessageMutation()
  const [revokeMessage] = useRevokeMessageMutation()

  // Xử lý tin nhắn hệ thống
  if (msg.messageType === 'SYSTEM') {
    return (
      <YStack alignItems="center" my="$3" width="100%">
        <XStack bg="$color4" px="$3" py="$1.5" borderRadius="$10" maxWidth="80%">
          <Text fontSize="$2" color="$color11" textAlign="center" fontWeight="500">
            {formatSystemMessage(msg, selfUserId)}
          </Text>
        </XStack>
      </YStack>
    )
  }
  const isMe = msg.user?.id === selfUserId

  const newerMsg = items[index - 1]
  const olderMsg = items[index + 1]

  const groupsWithNewer = canGroup(msg, newerMsg, selfUserId)
  const groupsWithOlder = canGroup(msg, olderMsg, selfUserId)

  const isSolo = !groupsWithNewer && !groupsWithOlder
  const isGroupStart = !groupsWithOlder && groupsWithNewer
  const isGroupEnd = !groupsWithNewer || isSolo;

  const showAvatar = !isMe && (isSolo || isGroupStart)
  const showName = !isMe && (isSolo || isGroupStart)

  const isRevoked = msg.messageStatus === 'REVOKED'
  console.log("Room ID của Message Item", roomId);

  const media = isRevoked
    ? []
    : (msg.attachments || []).filter(a =>
      a.contentType?.startsWith('image/') ||
      a.contentType?.startsWith('video/')
    )
  const file = !isRevoked && msg.attachments && msg.attachments.length > 0
    ? msg.attachments.find(a => !a.contentType?.startsWith('image/') && !a.contentType?.startsWith('video/'))
    : null

  const time = new Date(msg.createdAt)
  const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
  const messageFontStyle = isRevoked ? 'italic' : 'normal'
  const messageColor = isRevoked ? '$color9' : '$color12'
  const isSelected = selectionMode && selected
  const menuTriggerRef = useRef<(() => void) | null>(null)
  const isGroupCallWidget = msg.metadata?.isGroupCall === 'true';

  const renderReplyPreview = () => {
    if (!msg.replyTo || isRevoked) return null
    const replyMsg = msg.replyTo
    const firstAttachment = replyMsg.attachments?.[0]
    const isReplyImage = firstAttachment?.contentType?.startsWith('image/')
    const isReplyMultipleMedia = replyMsg.attachments && replyMsg.attachments.length > 1
    const isReplyVideo = firstAttachment?.contentType?.startsWith('video/')
    const isRevokedReply = replyMsg.messageStatus === 'REVOKED'

    let subLabel = replyMsg.content || ''
    if (isReplyImage) subLabel = '[Hình ảnh]'
    if (isReplyVideo) subLabel = '[Video]'
    if (firstAttachment && !isReplyImage && !isReplyVideo) subLabel = `[File] ${firstAttachment.fileName}`
    if (isReplyMultipleMedia) subLabel = `[${replyMsg.attachments?.length} tệp đính kèm]`
    if (isRevokedReply) subLabel = 'Tin nhắn đã được thu hồi'

    return (
      <XStack
        mb="$2"
        p="$2"
        bg="$background"
        borderRadius="$3"
        borderLeftWidth={3}
        borderLeftColor="$blue10"
        space="$2"
        alignItems="center"
        onPress={(e) => {
          e.stopPropagation()
          if (selectionMode) onToggleSelect(msg.id)
          else onPressReplyRef(replyMsg.id)
        }}
      >
        {(isReplyImage || isReplyVideo) && (
          <YStack width={35} height={35} borderRadius="$2" overflow="hidden" flexShrink={0}>
            <Image source={{ uri: firstAttachment?.fileUrl }} width="100%" height="100%" />
          </YStack>
        )}
        <YStack flexShrink={1}>
          <Text fontWeight="700" fontSize="$1" color="$blue10" numberOfLines={1}>
            {replyMsg.user?.name || 'Người dùng'}
          </Text>
          <Text fontSize="$1" color="$color11" numberOfLines={1}>
            {subLabel}
          </Text>
        </YStack>
      </XStack>
    )
  }

  // Thu hồi tin nhắn
  const handleRevokeMessage = async (message: MessageResponse) => {
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
    }
  }

  // Xoá ở phía tôi
  const handleDeleteMessage = async (message: MessageResponse) => {
    let nextMessage: MessageResponse | null = null

    // lấy snapshot trước
    const currentMessages = chatApi.endpoints.getMessages.select({ roomId })(store.getState())

    const items = currentMessages?.data?.items || []
    const index = items.findIndex((m) => m.id === message.id)

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
        const idx = draft.items.findIndex((m) => m.id === message.id)
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

        if (room.latestMessage?.id === message.id) {
          room.latestMessage.content = formatPreviewMessage(nextMessage)
        }
      })
    )

    try {
      await deleteMessage({ roomId, messageId: message.id }).unwrap()
    } catch (error) {
      console.error('Lỗi khi xoá tin nhắn:', error)
    }
  }

  return (
    <XStack
      space="$2"
      mb="$3"
      justifyContent={isGroupCallWidget ? 'center' : (isMe ? 'flex-end' : 'flex-start')}
    >
      {/* AVATAR */}
      {!isMe && !isGroupCallWidget && (
        <YStack width={32} alignItems="center">
          {showAvatar && (
            <Avatar circular size="$3">
              <Avatar.Image src={msg.user?.avatarUrl} />
            </Avatar>
          )}
        </YStack>
      )}

      <MessageActionMenu
        message={msg}
        isMe={isMe}
        selectionMode={selectionMode}
        isSelected={isSelected}
        onToggleSelected={onToggleSelect}
        onReply={onReply}
        onForward={onForward}
        onDelete={handleDeleteMessage}
        onRevoke={handleRevokeMessage}
        onCopy={onCopy}
        disabled={isRevoked}
        onEnterMultiSelect={onEnterMultiSelect}
        triggerRef={menuTriggerRef}
        isGroupEnd={isGroupEnd}
        roomId={roomId}
      >

        <YStack space="$2">
          {/* TÊN NGƯỜI GỬI */}
          {showName && (
            <Text
              fontSize="$2"
              fontWeight="600"
              color="$color10"
              ml="$2"
              letterSpacing={0.2}
            >
              {msg.user?.name}
            </Text>
          )}

          {/* MEDIA */}
          {media.length > 0 ? (
            <YStack
              maxWidth={280}
              borderRadius="$4"
              overflow="hidden"
              bg={isMe ? '$blue3' : '$color2'}
            >
              <MediaGrid
                media={media}
                onPressMedia={(index) => onOpenMedia(media, index)}
              />
              {msg.content ? (
                <Pressable
                  onLongPress={() => menuTriggerRef.current?.()}
                  delayLongPress={250}
                >
                  <YStack p="$2">
                    {
                      isRevoked ?
                        <Text color={messageColor} fontStyle={messageFontStyle}>Tin nhắn đã được thu hồi</Text> :
                        <Text color={messageColor} fontStyle={messageFontStyle}>{msg.content}</Text>
                    }
                  </YStack>
                </Pressable>
              ) : null}
            </YStack>
          ) : null}

          {/* WIDGETS */}
          {msg.messageType === 'WIDGET' && (
            <WidgetMessage msg={msg} isMe={isMe} roomId={roomId} />
          )}

          {/* TEXT ONLY */}
          {(media.length === 0 && !file && msg.messageType !== 'WIDGET') ? (
            <Pressable
              onPress={selectionMode ? () => onToggleSelect(msg.id) : undefined}
              onLongPress={isRevoked ? undefined : () => menuTriggerRef.current?.()}
              delayLongPress={250}
            >
              <YStack p="$3" maxWidth={300} bg={isMe ? '$blue3' : '$color2'} borderRadius="$4" minWidth={80}>
                {msg.replyTo && renderReplyPreview()}
                {
                  isRevoked ?
                    <Text color={messageColor} fontStyle={messageFontStyle}>Tin nhắn đã được thu hồi</Text> :
                    <Text color={messageColor} fontStyle={messageFontStyle}>{msg.content}</Text>
                }
                {isGroupEnd && !isRevoked && (
                  <Text fontSize="$1" mt="$1" color="$color9" alignSelf="flex-end">
                    {timeString}
                  </Text>
                )}
              </YStack>
            </Pressable>
          ) : null}
          {/* FILES */}
          {file ? (
            <YStack space="$1">
              <Pressable
                onPress={selectionMode ? () => onToggleSelect(msg.id) : () => Linking.openURL(file.fileUrl)}
                onLongPress={isRevoked ? undefined : () => menuTriggerRef.current?.()}
                delayLongPress={250}
              >
                <XStack
                  p="$2.5"
                  bg="$color3"
                  borderRadius="$3"
                  hoverStyle={{ bg: '$color4' }} // Thêm hiệu ứng hover nếu dùng trên web/tablet
                  opacity={selectionMode && isSelected ? 0.6 : 1}
                  minWidth={220}
                  maxWidth={280}
                  alignItems="center"
                  borderWidth={1}
                  borderColor="$color4"
                >
                  <Circle size={35} bg="$color5" alignItems="center" justifyContent="center">
                    <File size={18} color="$color11" />
                  </Circle>

                  <YStack flex={1} ml="$3">
                    <Text numberOfLines={1} fontWeight="600" fontSize="$3">
                      {file.fileName}
                    </Text>
                    <Text fontSize="$1" color="$color10">
                      {(file.fileSize / 1024).toFixed(1)} KB
                    </Text>
                  </YStack>

                  <Download size={18} color="$color10" />
                </XStack>
              </Pressable>

              {isGroupEnd && !isRevoked && (
                <Text fontSize="$1" mt="$1" color="$color9" alignSelf="flex-end">
                  {timeString}
                </Text>
              )}
            </YStack>
          ) : null}
        </YStack>
      </MessageActionMenu>

      {/* SELECT INDICATOR */}
      {
        selectionMode && (
          <YStack width={20} justifyContent="center">
            {isSelected && (
              <Circle size={18} bg="$blue10">
                <Check size={12} color="white" />
              </Circle>
            )}
          </YStack>
        )
      }
    </XStack >
  )
}