import React, { useState } from 'react'
import { Platform, KeyboardAvoidingView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context' // <--- IMPORT QUAN TRỌNG
import { YStack, XStack, Text, Input, Button, Avatar, ScrollView, Theme, Circle } from 'tamagui'
import {
  Send,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Image as ImageIcon,
  Smile,
  MoreHorizontal,
} from '@tamagui/lucide-icons'
import { useLink } from 'solito/navigation'

// --- 1. MOCK DATA (Dữ liệu giả) ---
const CURRENT_USER_ID = 'me'

const MOCK_MESSAGES = [
  {
    id: '1',
    text: 'Chào bạn, cho mình hỏi về sản phẩm này với?',
    senderId: 'user_2',
    timestamp: '10:00',
    avatar: 'https://i.pravatar.cc/150?u=user_2',
  },
  {
    id: '2',
    text: 'Chào bạn! Mình có thể giúp gì cho bạn ạ?',
    senderId: 'me',
    timestamp: '10:05',
    avatar: 'https://i.pravatar.cc/150?u=me',
  },
  {
    id: '3',
    text: 'Sản phẩm này có size L không shop?',
    senderId: 'user_2',
    timestamp: '10:06',
    avatar: 'https://i.pravatar.cc/150?u=user_2',
  },
  {
    id: '4',
    text: 'Dạ hiện tại bên mình còn đủ size S, M, L, XL luôn ạ. Bạn cao bao nhiêu mình tư vấn size cho chuẩn nhé!',
    senderId: 'me',
    timestamp: '10:07',
    avatar: 'https://i.pravatar.cc/150?u=me',
  },
  {
    id: '5',
    text: 'Mình cao 1m75, nặng 70kg',
    senderId: 'user_2',
    timestamp: '10:10',
    avatar: 'https://i.pravatar.cc/150?u=user_2',
  },
  {
    id: '6',
    text: 'Vậy bạn mặc size L là vừa đẹp luôn đó ạ 😍',
    senderId: 'me',
    timestamp: '10:11',
    avatar: 'https://i.pravatar.cc/150?u=me',
  },
  {
    id: '7',
    text: 'Ok chốt đơn cho mình 1 cái màu đen nhé',
    senderId: 'user_2',
    timestamp: '10:12',
    avatar: 'https://i.pravatar.cc/150?u=user_2',
  },
  {
    id: '8',
    text: 'Dạ vâng, mình gửi bạn thông tin thanh toán nhé.',
    senderId: 'me',
    timestamp: '10:13',
    avatar: 'https://i.pravatar.cc/150?u=me',
  },
  {
    id: '9',
    text: 'Thanks shop!',
    senderId: 'user_2',
    timestamp: '10:14',
    avatar: 'https://i.pravatar.cc/150?u=user_2',
  },
]

interface Props {
  // insets từ Safe Area
  insets?: { top: number; bottom: number; left: number; right: number }
}

export function ChatScreen({ insets }: Props) {
  const [message, setMessage] = useState('')
  const linkProps = useLink({ href: '/' })

  // const insets = useSafeAreaInsets()

  return (
    <Theme name="light">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // 2. Đưa offset về 0 vì Header đã nằm trong view này rồi
        keyboardVerticalOffset={0}
      >
        <YStack flex={1} bg="$background">
          {/* --- HEADER --- */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            p="$3"
            // 3. Padding top động theo tai thỏ (cộng thêm chút khoảng cách cho đẹp)
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
                <Avatar circular size="$4">
                  <Avatar.Image src="https://i.pravatar.cc/150?u=user_2" />
                  <Avatar.Fallback borderColor="gray" />
                </Avatar>
                <YStack>
                  <Text fontWeight="bold" fontSize="$5">
                    Khách hàng A
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

          {/* --- BODY --- */}
          <ScrollView
            flex={1}
            p="$3"
            space="$3"
            bg="$color2"
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            {MOCK_MESSAGES.map((msg) => {
              const isMe = msg.senderId === CURRENT_USER_ID
              return (
                <XStack
                  key={msg.id}
                  justifyContent={isMe ? 'flex-end' : 'flex-start'}
                  alignItems="flex-end"
                  space="$2"
                  mb="$2"
                >
                  {!isMe && (
                    <Avatar circular size="$2">
                      <Avatar.Image src={msg.avatar} />
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
                      {msg.text}
                    </Text>
                    <Text
                      fontSize="$1"
                      color={isMe ? '$blue3' : '$gray9'}
                      textAlign="right"
                      mt="$1"
                      opacity={0.8}
                    >
                      {msg.timestamp}
                    </Text>
                  </YStack>
                </XStack>
              )
            })}
          </ScrollView>

          {/* --- FOOTER (INPUT) --- */}
          <XStack
            p="$2"
            // 4. Xử lý Padding Bottom thông minh:
            // - Trên iOS: Khi bàn phím hiện, KeyboardAvoidingView tự đẩy lên,
            //   nếu để padding lớn sẽ bị hở. Ta để insets.bottom (khi ko phím)
            //   nhưng thực tế behavior='padding' của iOS đôi khi xử lý tốt nhất
            //   nếu ta bọc Footer trong một View riêng.
            //   Cách đơn giản nhất: Dùng Math.max để đảm bảo luôn cách đáy 1 chút
            //   nhưng không quá lớn.
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
                icon={Send}
                onPress={() => setMessage('')}
              />
            ) : (
              <Button size="$3" circular chromeless icon={Smile} />
            )}
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </Theme>
  )
}
