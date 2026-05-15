import React, { useState } from 'react'
import { XStack, Text, View, Button, Popover } from 'tamagui'
import { ThumbsUp } from '@tamagui/lucide-icons' // Dùng ThumbsUp cho giống ảnh
import { Platform } from 'react-native'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'app/store'
import { chatApi, useAddReactionMutation } from 'app/services/chatApi'
import { MessageResponse } from 'app/types/Response'
import { ReactionDetailModal } from './ReactionDetailModal'

const REACTION_OPTIONS = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'HEART', emoji: '❤️' },
  { type: 'WOW', emoji: '😮' },
  { type: 'SAD', emoji: '😢' },
  { type: 'ANGRY', emoji: '😡' },
]

interface Props {
  message: MessageResponse
  roomId: string
  isGroupEnd: boolean
  opacity?: number
}

export function MessageReactions({ message, roomId, isGroupEnd, opacity }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const [addReaction] = useAddReactionMutation()
  const shouldShow = message.messageType === 'USER'
  const [showDetail, setShowDetail] = useState(false)
  const handleSelect = async (reactionType: string) => {
    const currentCount = message.reactionsSummary?.[reactionType] || 0;
    dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        const target = draft.items?.find((m) => m.id === message.id)
        if (target) {
          if (!target.reactionsSummary) target.reactionsSummary = {}
          target.reactionsSummary[reactionType] = (target.reactionsSummary[reactionType] || 0) + 1
        }
      })
    )

    try {
      const result = await addReaction({ roomId, messageId: message.id, reactionType }).unwrap()
      console.log(result);
      console.log(message.id);


    } catch (e) {
      console.error('Reaction error:', e)
    }
  }

  const EmojiList = (
    <XStack space="$2" p="$2" bg="$background" borderRadius="$10">
      {REACTION_OPTIONS.map((item) => (
        <View
          key={item.type}
          onPress={() => handleSelect(item.type)}
          hoverStyle={{ scale: 1.2, cursor: 'pointer' }}
          pressStyle={{ scale: 0.9 }}
          p="$1"
        >
          <Text fontSize={20}>{item.emoji}</Text>
        </View>
      ))}
    </XStack>
  )
  const summary = message.reactionsSummary || {}
  const activeTypes = Object.keys(summary).filter(type => summary[type] > 0)

  const ReactionBadge = activeTypes.length > 0 && (
    <XStack
      position="absolute"
      bottom={-23}
      right={1}
      p="$1"
      backgroundColor="white"
      borderRadius={100}
      borderWidth={1}
      borderColor="#e0e0e0"
      elevation={2}
      zIndex={10}
      onPress={(e) => {
        e.stopPropagation() // Ngăn chặn trigger vào sự kiện click tin nhắn
        setShowDetail(true)
      }}
      hoverStyle={{ scale: 1.05, cursor: 'pointer' }}
      pressStyle={{ scale: 0.95 }}
    >
      <XStack space={-4}>
        {activeTypes.slice(0, 3).map((type) => {
          const option = REACTION_OPTIONS.find(opt => opt.type === type);
          return (
            <Text key={type} fontSize={13}>
              {option ? option.emoji : '👍'}
            </Text>
          );
        })}
      </XStack>
      {/* Hiển thị tổng số nếu có nhiều loại */}
      <Text fontSize={11} alignSelf='center' color="$gray10">
        {Object.values(summary).reduce((a, b) => a + b, 0)}
      </Text>
    </XStack>
  )
  if (Platform.OS !== 'web') {
    return (
      <>
        {ReactionBadge}
        {EmojiList}
      </>
    )
  }
  console.log("Should show: ", message.messageType);


  return (
    <>
      {ReactionBadge}
      <ReactionDetailModal
        summary={summary}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
      {shouldShow && (
        <Popover size="$2" allowFlip placement="top" >
          <Popover.Trigger asChild>
            <Button
              position="absolute"
              size="$1.5"
              width={10}
              height={10}
              circular
              backgroundColor="white"
              borderWidth={1}
              borderColor="#e0e0e0" // Viền xám nhạt
              elevation={3} // Đổ bóng nhẹ
              padding={0}
              icon={<ThumbsUp size={13} color="#65676b" />} // Icon bàn tay xám
              hoverStyle={{ backgroundColor: '$blue2', scale: 1.1, cursor: 'pointer' }}
              pressStyle={{ scale: 0.9 }}

              opacity={opacity}
              zIndex={50}
            />
          </Popover.Trigger>

          <Popover.Content
            borderWidth={1}
            borderColor="$color4"
            p={0}
            borderRadius="$10"
            elevation={10}
            animation="quick"
          >
            {EmojiList}
          </Popover.Content>
        </Popover>
      )
      }
    </>
  )
}