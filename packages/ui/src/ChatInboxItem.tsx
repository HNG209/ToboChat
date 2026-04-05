import { Avatar, ListItem, Text, View, YStack } from '@my/ui'
import { MessageResponse } from 'app/types/Response'
import { Pin } from '@tamagui/lucide-icons'

type Props = {
  name: string
  latestMessage: MessageResponse
  time?: string
  avatar?: string
  pinned?: boolean
  onPress?: () => void
  selected?: boolean
}

function formatTime(isoString?: string) {
  if (!isoString) return ''
  const now = new Date()
  const date = new Date(isoString)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'vừa xong'
  if (diffMin < 60) return `${diffMin}p trước`
  if (diffHour < 24) return `${diffHour}h trước`
  if (diffDay <= 30) return `${diffDay} ngày trước`
  // Nếu quá 30 ngày, trả về ngày/tháng/năm
  return date.toLocaleDateString('vi-VN')
}

export const ChatInboxItem = ({
  name,
  latestMessage,
  time,
  avatar,
  pinned,
  onPress,
  selected,
}: Props) => {
  return (
    <ListItem
      pressTheme
      backgroundColor={selected ? '$blue10' : '$color3'}
      onPress={onPress}
      borderRadius={14}
      marginVertical={2}
      paddingVertical="$2"
      paddingHorizontal="$4"
      borderWidth={selected ? 1 : 0}
      borderColor={selected ? '$accent1' : 'transparent'}
      hoverStyle={{
        background: selected ? '$blue10' : '$color2',
      }}
      title={
        <Text fontWeight="700" fontSize={16} color={selected ? '$color1' : '$color'}>
          {name}
        </Text>
      }
      subTitle={
        <Text
          fontSize={13}
          color={selected ? '$color1' : '$color10'}
          numberOfLines={1}
          marginTop={2}
        >
          {(latestMessage?.self ? `Tôi: ${latestMessage?.content}` : latestMessage?.content) ||
            'Chưa có tin nhắn'}
        </Text>
      }
      icon={
        <Avatar circular size="$5">
          <Avatar.Image
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
          />
        </Avatar>
      }
    >
      <YStack space="$1" alignItems="flex-end" justifyContent="center">
        <Text fontSize={11} color={selected ? '$color1' : '$color10'}>
          {formatTime(time)}
        </Text>
        {pinned ? (
          <Pin
            size={14}
            color={selected ? '$color1' : '$color10'}
            rotate="45deg"
            fill="currentColor"
          />
        ) : (
          <View height={14} />
        )}
      </YStack>
    </ListItem>
  )
}
