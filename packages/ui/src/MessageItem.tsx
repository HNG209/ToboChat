import React from 'react'
import { Platform, Linking } from 'react-native'
import { XStack, YStack, Text, Avatar, Circle } from '@my/ui'
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
        onToggleSelected={() => onToggleSelect(msg.id)}
        onReply={onReply}
        onForward={onForward}
        onDelete={() => onDelete(msg.id)}
        onRecall={onRecall}
        onCopy={onCopy}
      >
        <YStack space="$2">

          {/* MEDIA */}
          {media.length > 0 && (
            <YStack
              maxWidth={280}
              borderRadius="$4"
              overflow="hidden"
              bg={isMe ? '$blue3' : '$color2'}
              onPress={() => onOpenMedia(media, 0)}
            >
              <MediaGrid media={media} onPressMedia={onOpenMedia} />

              {messageText ? (
                <YStack p="$2">
                  <Text>{messageText}</Text>
                </YStack>
              ) : null}
            </YStack>
          )}

          {/* TEXT */}
          {messageText && media.length === 0 && (
            <YStack p="$3" maxWidth={300} bg={isMe ? '$blue3' : '$color2'} borderRadius="$4">

              {/* reply preview */}
              {msg.replyTo && (
                <YStack
                  mb="$2"
                  p="$2"
                  bg="$color4"
                  borderRadius="$3"
                  onPress={() => onPressReplyRef(msg.replyTo!.id)}
                >
                  <Text fontWeight="700">{msg.replyTo.user?.name}</Text>
                  <Text numberOfLines={1}>{msg.replyTo.content}</Text>
                </YStack>
              )}

              <Text>{messageText}</Text>

              <Text fontSize="$1" mt="$1">
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
                  onPress={() => Linking.openURL(f.fileUrl)}
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