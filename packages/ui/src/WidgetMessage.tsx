import { YStack, XStack, Text, Circle, Button, ThemeName } from '@my/ui'
import { PhoneMissed, PhoneCall, Video, MapPin, BarChart2 } from '@tamagui/lucide-icons'
import { MessageResponse } from 'app/types/Response'
import { getSocket } from 'app/utils/socket'

interface WidgetMessageProps {
  msg: MessageResponse
  isMe: boolean
  roomId: string
}

const formatDuration = (seconds: string | number) => {
  const sec = Number(seconds) || 0
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function WidgetMessage({ msg, isMe, roomId }: WidgetMessageProps) {
  const metadata = msg.metadata || {}
  const widgetType = metadata.widgetType

  // Nơi phân phối các loại Widget
  switch (widgetType) {
    case 'CALL':
      return <CallWidget metadata={metadata} isMe={isMe} roomId={roomId} />

    // Thêm các case mới ở đây trong tương lai
    // case 'POLL': return <PollWidget metadata={metadata} />

    default:
      return (
        <YStack p="$3" bg="$backgroundHover" borderRadius="$4">
          <Text fontSize="$2" color="$color10">Widget này đang được phát triển</Text>
        </YStack>
      )
  }
}

function CallWidget({ metadata, isMe, roomId }: { metadata: any; isMe: boolean; roomId: string }) {
  const status = metadata.status // 'MISSED' hoặc 'ENDED'
  const duration = metadata.duration
  const isMissed = status === 'MISSED'
  const isGroupCall = metadata.isGroupCall === 'true'

  // Định nghĩa style riêng cho nhóm
  const borderColor = isMissed ? '$red5' : (isGroupCall ? '$color6' : '$color4')
  const icon = isGroupCall
    ? <BarChart2 size={20} color={isMissed ? '$red10' : '$purple10'} />
    : (isMissed
      ? <PhoneMissed size={20} color="$red10" />
      : <Video size={20} color="$green10" />)
  const title = isGroupCall
    ? (isMissed ? 'Cuộc gọi nhóm nhỡ' : 'Cuộc gọi nhóm video')
    : (isMissed ? 'Cuộc gọi nhỡ' : 'Cuộc gọi video')
  const titleColor = isGroupCall
    ? (isMissed ? '$red10' : '$purple10')
    : (isMissed ? '$red10' : '$color12')
  const buttonTheme = (isGroupCall ? 'purple' : (isMissed ? 'red' : 'active')) as ThemeName;
  const handleCallBack = () => {
    const socket = getSocket()
    if (socket) {
      socket.emit('request_call', { roomId })
    }
  }

  return (
    <YStack
      p="$3"
      minWidth={240}
      maxWidth={300}
      bg='$color1'
      borderRadius="$4"
      borderWidth={1}
      borderColor={borderColor}
    >
      <XStack space="$3" alignItems="center">
        <Circle size={42} bg={isMissed ? '$red3' : (isGroupCall ? '$purple3' : '$green3')}>
          {icon}
        </Circle>

        <YStack flex={1}>
          <Text fontWeight="bold" color={titleColor}>
            {title}
          </Text>
          {!isMissed && duration && (
            <Text fontSize="$2" color={isGroupCall ? '$purple10' : '$color11'}>
              Thời gian: {formatDuration(duration)}
            </Text>
          )}
        </YStack>
      </XStack>

      <Button
        mt="$3"
        size="$3"
        theme={buttonTheme}
        icon={<PhoneCall size={16} />}
        onPress={handleCallBack}
      >
        Gọi lại
      </Button>
    </YStack>
  )
}