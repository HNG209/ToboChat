import { Button, Input, XStack } from "tamagui"
import { MoreHorizontal, Image as ImageIcon, SendHorizontal, Heart } from "@tamagui/lucide-icons"
import { Platform } from "react-native"

type Props = {
  message: string,
  isWeb: boolean,
  setMessage: (msg: string) => void,
  drafts: { isUploading: boolean }[],
  handleSendMessage: () => void,
  handlePickFile: () => void,
  theme: 'light' | 'dark',
  insets?: { top: number; bottom: number; left: number; right: number },
  composerHeight: number,
  setComposerHeight: (height: number) => void,
}

export const ChatScreenFooter = ({ message, setMessage, drafts, handleSendMessage, handlePickFile, theme, isWeb, insets, composerHeight, setComposerHeight }: Props) => {
  return (
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
      <Button size="$3" circular chromeless icon={MoreHorizontal} />
      <Button
        size="$3"
        circular
        chromeless
        icon={ImageIcon}
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
        value={message}
        onChangeText={setMessage}
      />

      {message.trim() || drafts.length > 0 ? (
        <Button
          size="$4"
          circular
          bg={theme === 'dark' ? '$blue11' : '$blue10'}
          color="white"
          icon={<SendHorizontal size={20} />}
          onPress={handleSendMessage}
          // Chặn người dùng bấm gửi khi ảnh chưa upload xong lên S3
          disabled={drafts.some((d) => d.isUploading)}
          opacity={drafts.some((d) => d.isUploading) ? 0.5 : 1}
        />
      ) : (
        <Button size="$3" circular chromeless icon={<Heart size={20} />} />
      )}
    </XStack>
  )
}