import { Avatar, ListItem, Text, View, YStack, Circle, XStack } from '@my/ui'
import { MessageResponse } from 'app/types/Response'
import { Pin } from '@tamagui/lucide-icons'

type Props = {
  name: string
  latestMessage: MessageResponse
  time?: string
  avatarUrl?: string
  pinned?: boolean
  onPress?: () => void
  selected?: boolean
  unreadCount: number
  isOnline?: boolean
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
  return date.toLocaleDateString('vi-VN')
}

export const ChatInboxItem = ({
  name,
  latestMessage,
  time,
  avatarUrl,
  pinned,
  onPress,
  selected,
  unreadCount,
  isOnline,
}: Props) => {
  // Màu nền và màu chữ tuỳ theo trạng thái
  const bgColor = selected ? '$blue2' : 'transparent'
  const hoverBg = selected ? '$blue2' : '$gray2'
  const nameColor = selected ? '$blue12' : '$color12'
  const subColor = selected ? '$blue10' : '$color10'
  const pinColor = selected ? '$blue10' : '$color10'
  const pinFill = selected ? '$blue3' : '$gray3'

  return (
    <ListItem
      pressTheme
      backgroundColor={bgColor}
      onPress={onPress}
      borderRadius={14}
      marginVertical={3}
      paddingVertical="$3"
      paddingHorizontal={14}
      hoverStyle={{
        background: hoverBg,
        scale: 1.02,
      }}
      transition="all 0.15s"
      icon={
        <View position="relative">
          <Avatar circular size="$6" borderWidth={2} borderColor={selected ? '$blue4' : '$color4'}>
            <Avatar.Image src={avatarUrl} />
          </Avatar>
          {typeof isOnline === 'boolean' && (
            <Circle
              size={13}
              backgroundColor={isOnline ? '$green10' : '$gray8'}
              borderWidth={2}
              borderColor="white"
              position="absolute"
              bottom={2}
              right={2}
              zIndex={2}
            />
          )}
        </View>
      }
    >
      <XStack flex={1} alignItems="center" justifyContent="space-between">
        <YStack flex={1} minWidth={0}>
          <XStack alignItems="center" gap={6}>
            <Text
              fontWeight="700"
              fontSize={16}
              color={nameColor}
              numberOfLines={1}
              flexShrink={1}
            >
              {name}
            </Text>
            {pinned && (
              <Pin
                size={15}
                color={pinColor}
                style={{ marginLeft: 2, marginTop: 1 }}
                fill={pinFill}
              />
            )}

          </XStack>
          <Text
            fontSize={13}
            color={subColor}
            numberOfLines={1}
            marginTop={2}
            fontWeight={unreadCount > 0 && !selected ? '700' : '400'}
            opacity={latestMessage?.content ? 1 : 0.7}
          >
            {latestMessage?.content || 'Chưa có tin nhắn'}
          </Text>
        </YStack>
        <YStack alignItems="flex-end" minWidth={60} gap="$2">
          {unreadCount > 0 && (
            <Circle
              size={22}
              backgroundColor="$red10"
              marginLeft={6}
              animation="bouncy"
              enterStyle={{ scale: 0 }}
              borderWidth={2}
              borderColor="white"
              shadowColor="#000"
              shadowOpacity={0.10}
              shadowRadius={6}
            >
              <Text color="white" fontSize={11} fontWeight="700">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </Circle>
          )}
          <Text fontSize={11} color={subColor} marginBottom={2}>
            {formatTime(time)}
          </Text>
        </YStack>
      </XStack>
    </ListItem>
  )
}
