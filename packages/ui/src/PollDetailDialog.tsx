import { useRef } from 'react';
import { Dialog, YStack, XStack, Text, Button, Circle, ScrollView, Spinner } from 'tamagui';
import { MessageResponse } from 'app/types/Response';
import { useGetProfileQuery } from 'app/services/userApi';
import { useGetMessageQuery, useVotePollMutation } from 'app/services/chatApi';
import { PollDetail, PollDetailRef } from './PollDetail';
import { BarChart2, X } from '@tamagui/lucide-icons';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  pollId?: string;
  msg?: MessageResponse;
};

export const PollDetailDialog = ({ isOpen, pollId, msg, onOpenChange, roomId }: Props) => {
  const { data: myProfile } = useGetProfileQuery()
  const [votePoll] = useVotePollMutation();

  // 1. Tạo biến ref để chọc vào Component con
  const pollDetailRef = useRef<PollDetailRef>(null);

  const shouldFetch = isOpen && !msg && !!pollId;
  const { data: fetchedMsg, isLoading } = useGetMessageQuery(
    { roomId, messageId: pollId! },
    { skip: !shouldFetch }
  );

  const displayMsg = msg || fetchedMsg;

  // 2. Hàm API (Chỉ nhận mảng Ids và gọi xuống Backend)
  const handleSubmitApi = async (optionIds: string[]) => {
    const targetPollId = pollId || displayMsg?.id;
    if (!targetPollId) return;
    await votePoll({ roomId, pollId: targetPollId, optionIds }).unwrap();
  };

  // 3. Hàm kích hoạt khi bấm nút "Xác nhận"
  const onConfirm = async () => {
    if (pollDetailRef.current) {
      await pollDetailRef.current.submit(); // Lệnh này sẽ chạy Optimistic bên trong và gọi ngược ra handleSubmitApi
    }
    onOpenChange(false);
  }

  return (
    <Dialog modal open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" animation="quick" opacity={0.5} backgroundColor="#000" zIndex={100000} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          bordered elevate key="content" animation="quick"
          enterStyle={{ opacity: 0, scale: 0.98, y: -10 }} exitStyle={{ opacity: 0, scale: 0.98, y: -10 }}
          width="90%" height="auto" padding={0} borderRadius="$4" backgroundColor="$background" overflow="hidden"
        >
          <XStack padding="$2" alignItems="center" justifyContent="space-between" borderBottomWidth={1} borderColor="$borderColor">
            <Dialog.Title fontSize="$8" fontWeight="bold" letterSpacing={0.15}>
              <XStack alignItems="center" space="$2">
                <Circle size={28} bg="$blue3"><BarChart2 size={16} color="$blue10" /></Circle>
                <Text fontSize="$8" color="$color11" fontWeight="bold" letterSpacing={0.15}>Chi tiết bình chọn</Text>
              </XStack>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button backgroundColor="$background" size="$3" circular icon={X} chromeless />
            </Dialog.Close>
          </XStack>

          <YStack px="$4" minHeight={200} justifyContent={isLoading ? 'center' : 'flex-start'}>
            {isLoading ? (
              <YStack alignItems="center" space="$2">
                <Spinner size="large" color="$blue10" />
                <Text color="$color10">Đang tải dữ liệu bình chọn...</Text>
              </YStack>
            ) : displayMsg ? (
              <ScrollView maxHeight={500} showsVerticalScrollIndicator={false} mt="$3">
                <PollDetail
                  ref={pollDetailRef}
                  msg={displayMsg}
                  roomId={roomId}
                  mode="DETAIL"
                  currentUserId={myProfile?.id}
                  onSubmit={handleSubmitApi}
                />
              </ScrollView>) :
              (<YStack alignItems="center" justifyContent="center" flex={1}>
                <Text color="$red10" fontWeight="bold">Không tìm thấy thông tin bình chọn.</Text>
                <Text color="$color10" fontSize="$2">Cuộc bình chọn này có thể đã bị xóa hoặc xảy ra lỗi mạng.</Text>
              </YStack>)}

            <Button mt="$3" marginBottom="$2" onPress={onConfirm} backgroundColor="$blue10" variant="outlined" chromeless>
              <Text color="white">Xác nhận</Text>
            </Button>
            <Button marginBottom="$4" onPress={() => onOpenChange(false)} backgroundColor="$background" variant="outlined" chromeless>
              Huỷ
            </Button>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog >
  )
}