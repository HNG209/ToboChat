import { YStack, XStack, Text, Circle, Button, ThemeName, ZStack } from '@my/ui'
import { PhoneMissed, PhoneCall, Video, MapPin, BarChart2, CheckCircle2, Edit3 } from '@tamagui/lucide-icons'
import { chatApi } from 'app/services/chatApi'
import { useGetProfileQuery } from 'app/services/userApi'
import { AppDispatch } from 'app/store'
import { MessageResponse } from 'app/types/Response'
import { getSocket } from 'app/utils/socket'
import { useDispatch } from 'react-redux'
import { useVotePollMutation } from 'app/services/chatApi'
import { useState } from 'react'
import { CreatePollSheet } from './CreatePollSheet'

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

    case 'POLL':
      return <PollWidget msg={msg} roomId={roomId} />

    // Thêm các case mới ở đây trong tương lai

    default:
      return (
        <YStack p="$3" bg="$backgroundHover" borderRadius="$4">
          <Text fontSize="$2" color="$color10">Widget này đang được phát triển</Text>
        </YStack>
      )
  }
}

function PollWidget({ msg, roomId }: { msg: MessageResponse; roomId: string }) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const metadata = msg.metadata || {};
  const msgId = msg.id;

  const { data: myProfile } = useGetProfileQuery();
  const currentUserId = myProfile?.id;
  const isCreator = msg.user?.id === currentUserId;

  const dispatch = useDispatch<AppDispatch>();
  const [votePoll] = useVotePollMutation();

  let pollData: any = null;
  try {
    pollData = JSON.parse(metadata.pollData || '{}');
  } catch (error) {
    return <Text color="$red10">Dữ liệu bình chọn bị lỗi</Text>;
  }

  const { question, options = [], multipleChoice } = pollData;
  const totalVotes = options.reduce((sum: number, opt: any) => sum + (opt.votedUserIds?.length || 0), 0);

  const handleVote = async (optionId: string) => {
    if (!currentUserId) return;

    const patchResult = dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        // Tìm tin nhắn chứa Poll trong danh sách
        const message = draft.items.find((m) => m.id === msgId);
        if (!message || !message.metadata?.pollData) return;

        // Parse dữ liệu nháp (Draft Data)
        const draftPollData = JSON.parse(message.metadata.pollData);
        let isToggleOn = false; // Cờ kiểm tra xem user vừa thêm vote hay hủy vote

        // Lặp qua các option để xử lý logic vote của user
        draftPollData.options.forEach((opt: any) => {
          if (opt.id === optionId) {
            const userIndex = opt.votedUserIds.indexOf(currentUserId);
            if (userIndex !== -1) {
              // Nếu đã vote rồi -> Hủy vote
              opt.votedUserIds.splice(userIndex, 1);
            } else {
              // Nếu chưa vote -> Thêm vote
              opt.votedUserIds.push(currentUserId);
              isToggleOn = true;
            }
          }
        });

        // Xử lý ràng buộc: Nếu CHỈ ĐƯỢC CHỌN 1 (không có multipleChoice) VÀ user vừa thêm vote
        if (!draftPollData.multipleChoice && isToggleOn) {
          draftPollData.options.forEach((opt: any) => {
            if (opt.id !== optionId) {
              // Xóa vote của user ở tất cả các option khác
              opt.votedUserIds = opt.votedUserIds.filter((id: string) => id !== currentUserId);
            }
          });
        }

        // Đóng gói lại thành chuỗi JSON và gắn lại vào draft cache
        message.metadata.pollData = JSON.stringify(draftPollData);
      })
    );

    try {
      await votePoll({ roomId, pollId: msgId, optionId }).unwrap();
    } catch (error) {
      console.error("Lỗi khi vote:", error);
      patchResult.undo();
      alert("Lỗi bình chọn. Vui lòng thử lại!");
    }
  }

  return (
    <YStack
      p="$4"
      width="100%"
      minWidth={300}
      maxWidth={450}
      alignSelf="center"
      marginVertical="$2"
      bg="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      space="$3"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" space="$2">
          <Circle size={28} bg="$blue3">
            <BarChart2 size={16} color="$blue10" />
          </Circle>
          <Text fontSize="$2" color="$color11" fontWeight="600">
            Cuộc bình chọn
          </Text>
        </XStack>

        {/* Nút Mở Form Chỉnh Sửa */}
        <Button
          size="$2"
          circular
          chromeless
          icon={<Edit3 size={16} color="$color10" />}
          onPress={() => setIsEditOpen(true)}
        />
      </XStack>

      <Text fontWeight="bold" fontSize="$5" color="$color12">
        {question}
      </Text>

      <YStack space="$2">
        {options.map((opt: any) => {
          const votesCount = opt.votedUserIds?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
          const isVotedByMe = opt.votedUserIds?.includes(currentUserId);

          return (
            <Button
              key={opt.id}
              p={0}
              height={44}
              bg="transparent"
              borderWidth={1}
              borderColor={isVotedByMe ? "$blue8" : "$color5"}
              borderRadius="$3"
              overflow="hidden"
              onPress={() => handleVote(opt.id)}
            >
              <ZStack fullscreen>
                <YStack
                  height="100%"
                  width={`${percentage}%`}
                  bg={isVotedByMe ? "$blue4" : "$color3"}
                  animation="quick"
                />

                <XStack fullscreen px="$3" alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" space="$2" flex={1}>
                    {isVotedByMe && <CheckCircle2 size={18} color="$blue10" />}
                    <Text
                      fontWeight={isVotedByMe ? "bold" : "normal"}
                      color={isVotedByMe ? "$blue11" : "$color11"}
                      numberOfLines={1}
                      flex={1}
                    >
                      {opt.text}
                    </Text>
                  </XStack>

                  <Text fontSize="$3" color="$color10" fontWeight="600">
                    {votesCount > 0 ? votesCount : ''}
                  </Text>
                </XStack>
              </ZStack>
            </Button>
          )
        })}
      </YStack>

      <XStack justifyContent="space-between" alignItems="center" mt="$1">
        <Text fontSize="$2" color="$color10">
          {totalVotes} lượt bình chọn
        </Text>
        {multipleChoice && (
          <Text fontSize="$2" color="$color10">
            Chọn nhiều
          </Text>
        )}
      </XStack>

      <CreatePollSheet
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        roomId={roomId}
        initialPoll={msg} // Truyền thẳng message hiện tại vào
      />
    </YStack>
  )
}

function CallWidget({ metadata, isMe, roomId }: { metadata: any; isMe: boolean; roomId: string }) {
  const status = metadata.status // 'MISSED' hoặc 'ENDED'
  const duration = metadata.duration
  const isMissed = status === 'MISSED'
  const isGroupCall = metadata.isGroupCall === 'true'
  const isVideoCall = metadata.isVideoCall === 'true'

  // Định nghĩa style riêng cho nhóm
  const borderColor = isMissed ? '$red5' : (isGroupCall ? '$color6' : '$color4')
  const icon = isGroupCall
    ? <BarChart2 size={20} color={isMissed ? '$red10' : '$purple10'} />
    : (isMissed
      ? <PhoneMissed size={20} color="$red10" />
      : (isVideoCall
        ? <Video size={20} color="$green10" />
        : <PhoneCall size={20} color="$green10" />)
    );

  const title = isGroupCall
    ? (isMissed ? 'Cuộc gọi nhóm nhỡ' : (isVideoCall ? 'Cuộc gọi nhóm video' : 'Cuộc gọi nhóm thoại'))
    : (isMissed ? 'Cuộc gọi nhỡ' : (isVideoCall ? 'Cuộc gọi video' : 'Cuộc gọi thoại'));

  const titleColor = isGroupCall
    ? (isMissed ? '$red10' : '$purple10')
    : (isMissed ? '$red10' : '$color12')
  const buttonTheme = (isGroupCall ? 'purple' : (isMissed ? 'red' : 'active')) as ThemeName;

  const handleCallBack = () => {
    const socket = getSocket()
    if (socket) {
      socket.emit('request_call', { roomId: roomId, isVideoCall: isVideoCall ?? true });
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