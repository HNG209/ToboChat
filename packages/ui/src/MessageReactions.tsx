import React, { useState } from 'react'
import { XStack, Text, View, Button, Popover } from 'tamagui'
import { ThumbsUp } from '@tamagui/lucide-icons' // Dùng ThumbsUp cho giống ảnh
import { Platform } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, store } from 'app/store'
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

export function MessageReactions({ message, roomId, opacity }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const [addReaction] = useAddReactionMutation()
  const shouldShow = message.messageType === 'USER'
  const [showDetail, setShowDetail] = useState(false)
  const { data: cacheData } = chatApi.useGetMessageReactionsQuery({ roomId, messageId: message.id });
  const currentUser = useSelector((state: any) => state.auth.user)
  const currentUserId = currentUser.id




  const handleSelect = async (reactionType: string) => {
    const reactionItems = cacheData?.items || [];
    const myReactionData = reactionItems.find((item: any) => item.user.id === currentUserId);
    const hasAlreadyReacted = myReactionData?.reactions?.includes(reactionType);
    console.log("Reaction Items", reactionItems);
    console.log("Reaction Data", myReactionData);
    console.log("Already Reacted", hasAlreadyReacted);

    if (hasAlreadyReacted) {
      console.log('Bạn đã thả reaction này rồi!');
      return;
    }

    // --- BỔ SUNG: CẬP NHẬT CACHE REACTION NGAY LẬP TỨC ĐỂ CHẶN SPAM CLICK TIẾP THEO ---
    const patchReactionsResult = dispatch(
      chatApi.util.updateQueryData('getMessageReactions', { roomId, messageId: message.id }, (draft) => {
        if (!draft.items) draft.items = [];
        const items = draft.items;

        const myIndex = items.findIndex((item: any) => item.user.id === currentUserId);

        if (myIndex > -1) {
          if (!items[myIndex].reactions.includes(reactionType)) {
            items[myIndex].reactions.push(reactionType);
          }
        } else {
          items.push({
            user: {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              avatarUrl: currentUser.avatarUrl
            },
            reactions: [reactionType]
          });
        }
      })
    );

    // --- GIỮ NGUYÊN TOÀN BỘ LOGIC MẪU BAN ĐẦU CỦA BẠN ---
    const patchResult = dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        const target = draft.items?.find((m) => m.id === message.id)
        if (target) {
          if (!target.reactionsSummary) target.reactionsSummary = {}
          target.reactionsSummary[reactionType] = (target.reactionsSummary[reactionType] || 0) + 1
        }
      })
    )

    try {
      await addReaction({ roomId, messageId: message.id, reactionType }).unwrap()
    } catch (e) {
      // Thất bại thì hoàn tác cả số đếm lẫn trạng thái cache đã lưu
      patchResult.undo()
      patchReactionsResult.undo()
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
              right={-30}
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