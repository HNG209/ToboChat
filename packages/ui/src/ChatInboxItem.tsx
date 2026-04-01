import { Avatar, ListItem, Text, View, YStack } from '@my/ui'
import { Pin } from '@tamagui/lucide-icons'

type Props = {
  name: string
  message?: string
  time?: string
  avatar?: string
  pinned?: boolean
  onPress?: () => void
  selected?: boolean
}

export const ChatInboxItem = ({
  name,
  message,
  time,
  avatar,
  pinned,
  onPress,
  selected,
}: Props) => {
  return (
    <ListItem
      pressTheme
      backgroundColor={selected ? '$primary' : '$color3'}
      onPress={onPress}
      borderRadius={14}
      marginVertical={2}
      paddingVertical="$3"
      paddingHorizontal="$4"
      borderWidth={selected ? 1 : 0}
      borderColor={selected ? '$primary' : 'transparent'}
      hoverStyle={{
        background: selected ? '$primary' : '$gray2',
        borderWidth: 1,
        borderColor: '$primary',
      }}
      title={
        <Text fontWeight="700" fontSize={16} color={selected ? '$color1' : '$gray12'}>
          {name}
        </Text>
      }
      subTitle={
        <Text
          fontSize={13}
          color={selected ? '$color1' : '$gray10'}
          numberOfLines={1}
          marginTop={2}
        >
          {message || 'Chưa có tin nhắn'}
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
        <Text fontSize={11} color={selected ? '$color1' : '$gray9'}>
          {time}
        </Text>
        {pinned ? (
          <Pin
            size={14}
            color={selected ? '$color1' : '$gray8'}
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
