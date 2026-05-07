import { Button, Circle, Image, Input, Text, XStack, YStack, ZStack } from "tamagui"
import { MoreHorizontal, Image as ImageIcon, SendHorizontal, Heart, X, Video, FileText } from "@tamagui/lucide-icons"
import { ActivityIndicator, Platform } from "react-native"
import { useState } from "react";
import { Attachment, MessageResponse } from "app/types/Response"
import { v4 as uuidv4 } from 'uuid';
import { AppDispatch } from "app/store";
import { useDispatch } from 'react-redux'
import { chatApi, useSendMessageMutation } from 'app/services/chatApi'
import { useChatAttachment } from 'app/hooks/useChatAttachment'
import { roomApi, useGetMyInfoQuery } from "app/services/roomApi";
import { RoomStatus } from "./ChatInbox";
import { StyledFlatList } from "./StyledFlatList";
import { useGetProfileQuery } from "app/services/userApi";
import ChatEmojiPicker from "./emoji/ChatEmojiPicker";

type Props = {
  roomId: string,
  isWeb: boolean,
  selectionMode: boolean,
  replyTo: MessageResponse | null,
  setReplyTo: (replyTo: MessageResponse | null) => void,
  theme: 'light' | 'dark',
  status: RoomStatus
  insets?: { top: number; bottom: number; left: number; right: number },
  composerHeight: number,
  setComposerHeight: (height: number) => void,
}

export const ChatScreenFooter = ({
  roomId,
  status,
  theme,
  isWeb,
  insets,
  composerHeight,
  setComposerHeight,
  selectionMode,
  replyTo,
  setReplyTo
}: Props) => {
  const { drafts, setDrafts, handlePickFile, removeDraft } = useChatAttachment(roomId)
  const [sendMessage] = useSendMessageMutation()
  const { data: myProfile } = useGetProfileQuery();

  const [localMessage, setLocalMessage] = useState('')
  const dispatch = useDispatch<AppDispatch>()

  const onSend = () => {
    const trimmedMsg = localMessage.trim();

    // Case 1: Có text (có thể kèm hoặc không kèm attachments)
    if (trimmedMsg) {
      handleSendMessage(trimmedMsg);
      setLocalMessage('');
    }
    // Case 2: Không có text nhưng có drafts (chỉ gửi file)
    else if (drafts.length > 0) {
      handleSendMessage('');
    }
  };
  const handleEmojiSelect = (emoji: string) => {
    setLocalMessage((prev) => prev + emoji)
  }
  const handleSendMessage = async (content: string) => {
    const isStillUploading = drafts.some((d) => d.isUploading)
    const hasError = drafts.some((d) => (d as any).error)

    if (isStillUploading) {
      alert('Vui lòng đợi tệp tin đang được tải lên...')
      return
    }
    if (hasError) {
      alert('Có tệp tin bị lỗi upload, vui lòng xóa hoặc thử lại!')
      return
    }

    const attachments: Attachment[] = drafts
      .filter((d) => d.fileUrl && d.fileUrl.startsWith('http'))
      .map((d) => ({
        fileUrl: d.fileUrl,
        fileName: d.fileName,
        contentType: d.contentType,
        fileSize: d.fileSize,
      }))

    const isMediaType = (contentType: string) =>
      contentType?.startsWith('image/') || contentType?.startsWith('video/')

    const hasText = content.trim().length > 0
    const totalAttachments = attachments.length

    if (!hasText && totalAttachments === 0) return

    // Lưu lại replyTo cũ để revert nếu lỗi, sau đó xóa state ngay để tránh gửi lặp
    const currentReplyTo = replyTo;
    setDrafts([])



    const sendSingleMessage = async (messageContent: string, messageAttachments: Attachment[]) => {
      const tempId = uuidv4()
      const optimisticMessage: MessageResponse = {
        id: tempId,
        tempId,
        content: messageContent,
        createdAt: new Date().toISOString(),
        roomId: roomId,
        replyTo:
          messageContent.trim().length > 0
            ? currentReplyTo || undefined
            : undefined,
        attachments: messageAttachments,
        user: myProfile,
        messageType: 'USER',
      }

      const patchResult = dispatch(
        chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
          if (!draft?.items) draft = { items: [] }
          draft.items.unshift(optimisticMessage)
        })
      )

      try {
        const result = await sendMessage({
          roomId,
          tempId,
          content: messageContent,
          replyTo:
            messageContent.trim().length > 0
              ? currentReplyTo?.id
              : undefined,
          attachments: messageAttachments,
        }).unwrap()
        if (
          messageContent.trim().length > 0 &&
          currentReplyTo
        ) {
          setReplyTo(null)
        }
        dispatch(
          roomApi.util.updateQueryData('getJoinedRooms', { status }, (draft) => {
            if (!draft?.items) return
            const roomIndex = draft.items.findIndex((room) => room.id === roomId)
            if (roomIndex !== -1) {
              draft.items[roomIndex].latestMessage = result
              const [updatedRoom] = draft.items.splice(roomIndex, 1)
              draft.items.unshift(updatedRoom)
            }
          })
        )

        dispatch(
          chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
            if (!draft?.items) return
            const msg = draft.items.find((m) => m.id === optimisticMessage.id)
            if (msg) {
              msg.id = result.id
              msg.createdAt = result.createdAt
            }
          })
        )
      } catch (error) {
        console.error('Lỗi gửi:', error)
        if (currentReplyTo) setReplyTo(currentReplyTo)
        patchResult.undo()
      }
    }


    // --- BẮT ĐẦU LOGIC GỬI THEO THỨ TỰ ---

    // Trường hợp đặc biệt: Text + đúng 1 Media (không có file  đi kèm) -> Gộp chung
    const hasOnlyOneMedia = totalAttachments === 1 && isMediaType(attachments[0].contentType);
    if (hasText && hasOnlyOneMedia) {
      await sendSingleMessage(content, attachments);
      return;
    }

    // Nếu có Text (và không rơi vào case gộp ở trên), gửi Text riêng trước
    if (hasText) {
      await sendSingleMessage(content, []);
    }

    let mediaQueue: Attachment[] = [];

    // Duyệt qua attachments để xử lý theo thứ tự người dùng đã chọn
    for (const item of attachments) {
      if (isMediaType(item.contentType)) {
        // Nếu là Media, tạm thời đưa vào hàng chờ để gộp nhóm liên tục
        mediaQueue.push(item);
      } else {
        // Nếu gặp FILE: đóng vai trò là vách ngăn
        // 1. Giải phóng (gửi) nhóm Media đang chờ trước đó
        if (mediaQueue.length > 0) {
          await sendSingleMessage('', mediaQueue);
          mediaQueue = [];
        }
        // 2. Gửi file hiện tại ngay lập tức (luôn tách riêng)
        await sendSingleMessage('', [item]);
      }
    }

    // Gửi nốt nhóm Media còn sót lại sau vòng lặp (nếu có)
    if (mediaQueue.length > 0) {
      await sendSingleMessage('', mediaQueue);
    }
  }

  return (
    <YStack>
      {/* Attachments chờ gửi */}
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
                          <FileText size={20} color="$blue10" />
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

      {/* Trả lời tin nhắn */}
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
            <YStack width={3} height="80%" bg="$blue10" borderRadius="$1" marginRight="$2" />

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
        <ChatEmojiPicker
          onEmojiSelect={(emoji) => {
            setLocalMessage((prev) => prev + emoji)
          }}
        />
        <Button
          size="$3"
          circular
          chromeless
          icon={<ImageIcon size={24} color="$color10" />}
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
          value={localMessage}
          onChangeText={setLocalMessage}
          onKeyPress={(e) => {
            if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter') {
              onSend()
            }
          }}
        />

        {localMessage.trim() || drafts.length > 0 ? (
          <Button
            size="$4"
            circular
            bg={theme === 'dark' ? '$blue11' : '$blue10'}
            color="white"
            icon={<SendHorizontal size={20} />}
            onPress={onSend}
            // Chặn người dùng bấm gửi khi ảnh chưa upload xong lên S3
            disabled={drafts.some((d) => d.isUploading)}
            opacity={drafts.some((d) => d.isUploading) ? 0.5 : 1}
          />
        ) : (
          <Button size="$3" circular chromeless icon={<Heart size={24} color="$color10" />} />
        )}
      </XStack>
    </YStack>
  )
}