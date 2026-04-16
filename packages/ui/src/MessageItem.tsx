import React from 'react'
import { Platform, Linking } from 'react-native'
import { XStack, YStack, Text, Avatar, Circle, Image } from '@my/ui'
import { Check, File, Download } from '@tamagui/lucide-icons'
import { MessageActionMenu } from './MessageActionMenu'
import { MediaGrid } from 'app/media/MediaGrid'
import { MessageResponse } from 'app/types/Response'

interface Props {
  msg: MessageResponse
  index: number
  items: MessageResponse[]

  // state
  theme: any
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
  onDelete: (id: string) => void
  onRecall: (msg: MessageResponse) => void
  onCopy: (msg: MessageResponse) => void
  onOpenMedia: (media: any[], index: number) => void
  onPressReplyRef: (id: string) => void
  openViewer: (media: any[], index: number) => void
  onEnterMultiSelect: (msg: MessageResponse) => void;
}

function canGroup(a?: MessageResponse, b?: MessageResponse, selfUserId?: string) {
  if (!a || !b) return false
  const aKey = a.self ? selfUserId : a.user?.id
  const bKey = b.self ? selfUserId : b.user?.id
  return aKey === bKey
}

function parseReplyEncodedContent(content: string) {
  if (!content?.startsWith('[reply]\n')) return null
  const end = content.indexOf('\n[/reply]\n')
  if (end === -1) return null

  const header = content.slice('[reply]\n'.length, end)
  const messageText = content.slice(end + '\n[/reply]\n'.length)

  const nameLine = header.split('\n').find(l => l.startsWith('name:'))
  const textLine = header.split('\n').find(l => l.startsWith('text:'))

  return {
    replyName: nameLine?.replace('name:', '').trim() || '',
    replyText: textLine?.replace('text:', '').trim() || '',
    messageText: messageText.trimStart(),
  }
}

export function MessageItem({
  msg,
  index,
  items,
  theme,
  selfUserId,
  selectionMode,
  selected,
  locallyDeleted,
  locallyRecalled,
  onToggleSelect,
  onReply,
  onForward,
  onDelete,
  onRecall,
  onCopy,
  onOpenMedia,
  onPressReplyRef,
  openViewer,
  onEnterMultiSelect
}: Props) {
  const isMe = msg.self

  const newerMsg = items[index - 1]
  const olderMsg = items[index + 1]

  const groupsWithNewer = canGroup(msg, newerMsg, selfUserId)
  const groupsWithOlder = canGroup(msg, olderMsg, selfUserId)

  const isSolo = !groupsWithNewer && !groupsWithOlder
  const isGroupStart = !groupsWithOlder && groupsWithNewer

  const showAvatar = !isMe && (isSolo || isGroupStart)

  const isRevoked = msg.messageStatus === 'REVOKED'
  const isDead = isRevoked || locallyDeleted.has(msg.id)

  const displayContent = isRevoked ? 'Tin nhắn đã được thu hồi' : msg.content
  const parsedReply = isRevoked ? null : parseReplyEncodedContent(displayContent)

  const messageText = parsedReply?.messageText ?? displayContent

  const media = isRevoked
    ? []
    : (msg.attachments || []).filter(a =>
      a.contentType?.startsWith('image/') ||
      a.contentType?.startsWith('video/')
    )

  const files = isRevoked
    ? []
    : (msg.attachments || []).filter(a =>
      !a.contentType?.startsWith('image/') &&
      !a.contentType?.startsWith('video/')
    )

  const time = new Date(msg.createdAt)
  const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
  const messageFontStyle = isRevoked ? 'italic' : 'normal'
  const messageColor = isRevoked ? '$color9' : '$color12'
  const isSelected = selectionMode && selected

  return (
    <XStack space="$2" mb="$2" justifyContent={isMe ? 'flex-end' : 'flex-start'}>

      {/* AVATAR */}
      {!isMe && (
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
        onDelete={() => onDelete(msg.id)}
        onRecall={onRecall}
        onCopy={onCopy}
        disabled={isRevoked}
        onEnterMultiSelect={onEnterMultiSelect}
      >
        <YStack space="$2" onPress={selectionMode ? () => onToggleSelect(msg.id) : undefined}>

          {/* MEDIA */}
          {media.length > 0 && (
            <YStack
              maxWidth={280}
              borderRadius="$4"
              overflow="hidden"
              bg={isMe ? '$blue3' : '$color2'}
              onPress={selectionMode ? undefined : () => onOpenMedia(media, 0)}
            >
              <MediaGrid media={media} onPressMedia={selectionMode ? undefined : onOpenMedia} />

              {messageText ? (
                <YStack p="$2">
                  <Text color={messageColor}
                    fontStyle={messageFontStyle}>{messageText}</Text>
                </YStack>
              ) : null}
            </YStack>
          )}

          {/* TEXT */}
          {messageText && media.length === 0 && (
            <YStack p="$3" maxWidth={300} bg={isMe ? '$blue3' : '$color2'} borderRadius="$4">

              {/* reply preview */}
              {/* --- PHẦN REPLY PREVIEW (Nội dung tin nhắn đang được trả lời) --- */}
              {msg.replyTo && (() => {
                const replyMsg = msg.replyTo;

                // 1. Phân loại nội dung reply
                const replyAttachments = replyMsg.attachments || [];
                const firstAttachment = replyAttachments[0];

                const isReplyImage = firstAttachment?.contentType?.startsWith('image/');
                const isReplyVideo = firstAttachment?.contentType?.startsWith('video/');
                const isReplyFile = firstAttachment && !isReplyImage && !isReplyVideo;

                // 2. Xác định text hiển thị phụ (Label)
                let subLabel = replyMsg.content || '';
                if (isReplyImage) subLabel = '[Hình ảnh]';
                if (isReplyVideo) subLabel = '[Video]';
                if (isReplyFile) subLabel = `[File] ${firstAttachment.fileName}`;

                return (
                  <XStack
                    mb="$2"
                    p="$2"
                    bg="$background" // Box màu trắng (hoặc theo theme)
                    borderRadius="$3"
                    borderLeftWidth={3}
                    borderLeftColor="$blue10" // Đường kẻ nhấn bên trái cho chuyên nghiệp
                    space="$2"
                    alignItems="center"
                    onPress={selectionMode ? undefined : () => onPressReplyRef(replyMsg.id)}
                  >
                    {/* CỘT TRÁI: Hiển thị Thumbnail nếu là Media */}
                    {(isReplyImage || isReplyVideo) && (
                      <YStack width={40} height={40} borderRadius="$2" overflow="hidden" bg="$color5">
                        <Image
                          source={{ uri: firstAttachment.fileUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                        {/* Nếu là video, thêm icon play nhỏ đè lên */}
                        {isReplyVideo && (
                          <YStack fullscreen alignItems="center" justifyContent="center" bg="rgba(0,0,0,0.2)">
                            <Circle size={16} bg="white">
                              <YStack style={{ borderLeftWidth: 6, borderLeftColor: 'black', borderTopWidth: 4, borderTopColor: 'transparent', borderBottomWidth: 4, borderBottomColor: 'transparent', marginLeft: 2 }} />
                            </Circle>
                          </YStack>
                        )}
                      </YStack>
                    )}

                    {/* CỘT PHẢI: Thông tin người gửi & Nội dung */}
                    <YStack flex={1} justifyContent="center">
                      <Text fontWeight="700" fontSize="$3" color="$blue10" numberOfLines={1}>
                        {replyMsg.user?.name || 'Người dùng'}
                      </Text>

                      <XStack alignItems="center" space="$1.5">
                        <Text fontSize="$2" color="$color11" numberOfLines={1} flexShrink={1}>
                          {subLabel}
                        </Text>

                      </XStack>
                    </YStack>
                  </XStack>
                );
              })()}

              <Text
                color={messageColor}
                fontStyle={messageFontStyle}
              >{messageText}</Text>

              <Text fontSize="$1" mt="$1" color={'$color9'} alignSelf='flex-end'>
                {timeString}
              </Text>
            </YStack>
          )}

          {/* FILES */}
          {files.length > 0 && (
            <YStack space="$1">
              {files.map((f, i) => (
                <XStack
                  key={i}
                  p="$2"
                  bg="$color3"
                  borderRadius="$3"
                  onPress={selectionMode ? undefined : () => Linking.openURL(f.fileUrl)}
                >
                  <File size={18} />
                  <YStack flex={1} ml="$2">
                    <Text numberOfLines={1}>{f.fileName}</Text>
                    <Text fontSize="$1">
                      {(f.fileSize / 1024).toFixed(1)} KB
                    </Text>
                  </YStack>
                  <Download size={16} />
                </XStack>
              ))}

              <Text fontSize="$1">{timeString}</Text>
            </YStack>
          )}

        </YStack>
      </MessageActionMenu>

      {/* SELECT INDICATOR */}
      {selectionMode && (
        <YStack width={20} justifyContent="center">
          {isSelected && (
            <Circle size={18} bg="$blue10">
              <Check size={12} color="white" />
            </Circle>
          )}
        </YStack>
      )}
    </XStack>
  )
}