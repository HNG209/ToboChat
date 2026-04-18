import React, { useRef } from 'react'
import { Platform, Linking, Pressable } from 'react-native'
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
  onDeleteForMe: (id: string) => void
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
  onDeleteForMe,
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
  const menuTriggerRef = useRef<(() => void) | null>(null)
  const renderReplyPreview = () => {
    if (!msg.replyTo || isRevoked) return null
    const replyMsg = msg.replyTo
    const firstAttachment = replyMsg.attachments?.[0]
    const isReplyImage = firstAttachment?.contentType?.startsWith('image/')
    const isReplyVideo = firstAttachment?.contentType?.startsWith('video/')
    let subLabel = replyMsg.content || ''
    if (isReplyImage) subLabel = '[Hình ảnh]'
    if (isReplyVideo) subLabel = '[Video]'
    if (firstAttachment && !isReplyImage && !isReplyVideo) subLabel = `[File] ${firstAttachment.fileName}`
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
            <Image source={{ uri: firstAttachment.fileUrl }} width="100%" height="100%" />
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
        onDelete={onDelete}
        onDeleteForMe={onDeleteForMe}
        onRecall={onRecall}
        onCopy={onCopy}
        disabled={isRevoked}
        onEnterMultiSelect={onEnterMultiSelect}
        triggerRef={menuTriggerRef}
      >
        <YStack space="$2">
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
                selectionMode={selectionMode}
                isSelected={isSelected}
                messageId={msg.id}
                onToggleSelect={onToggleSelect}
                onPressMedia={(index) => onOpenMedia(media, index)}
                onLongPress={() => menuTriggerRef.current?.()}
              />
              {messageText ? (
                <Pressable
                  onLongPress={() => menuTriggerRef.current?.()}
                  delayLongPress={250}
                >
                  <YStack p="$2">
                    <Text color={messageColor} fontStyle={messageFontStyle}>
                      {messageText}
                    </Text>
                  </YStack>
                </Pressable>
              ) : null}
            </YStack>
          ) : null}
          {/* TEXT ONLY */}
          {messageText && media.length === 0 ? (
            <Pressable
              onPress={selectionMode ? () => onToggleSelect(msg.id) : undefined}
              onLongPress={isRevoked ? undefined : () => menuTriggerRef.current?.()}
              delayLongPress={250}
            >
              <YStack p="$3" maxWidth={300} bg={isMe ? '$blue3' : '$color2'} borderRadius="$4">
                {msg.replyTo && renderReplyPreview()}
                <Text color={messageColor} fontStyle={messageFontStyle}>{messageText}</Text>
                <Text fontSize="$1" mt="$1" color="$color9" alignSelf="flex-end">{timeString}</Text>
              </YStack>
            </Pressable>
          ) : null}
          {/* FILES */}
          {files.length > 0 ? (
            <YStack space="$1">
              {files.map((f, i) => (
                <Pressable
                  key={i}
                  onPress={selectionMode ? () => onToggleSelect(msg.id) : () => Linking.openURL(f.fileUrl)}
                  onLongPress={isRevoked ? undefined : () => menuTriggerRef.current?.()}
                  delayLongPress={250}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    menuTriggerRef.current?.()
                  }}
                >
                  <XStack
                    p="$2"
                    bg="$color3"
                    borderRadius="$3"
                    opacity={selectionMode && isSelected ? 0.6 : 1}
                    minWidth={250}
                  >
                    <File size={18} />
                    <YStack flex={1} ml="$2">
                      <Text numberOfLines={1}>{f.fileName}</Text>
                      <Text fontSize="$1">{(f.fileSize / 1024).toFixed(1)} KB</Text>
                    </YStack>
                    <Download size={16} />
                  </XStack>
                </Pressable>
              ))}
              <Text fontSize="$1">{timeString}</Text>
            </YStack>
          ) : null}
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