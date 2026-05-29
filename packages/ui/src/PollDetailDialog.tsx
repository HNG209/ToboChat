import { useMemo, useState } from 'react';
import { Dialog, YStack, XStack, Text, Button, Circle, ScrollView, ZStack, Avatar, Spinner, Unspaced } from 'tamagui';
import { MessageResponse } from 'app/types/Response';
import { useGetProfileQuery } from 'app/services/userApi';
import { chatApi, useGetMessageQuery, useVotePollMutation } from 'app/services/chatApi';
import { PollDetail } from './PollDetail';
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

  const shouldFetch = isOpen && !msg && !!pollId;

  const { data: fetchedMsg, isLoading } = useGetMessageQuery(
    { roomId, messageId: pollId! },
    { skip: !shouldFetch }
  );

  const displayMsg = msg || fetchedMsg;

  return (
    <Dialog modal open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          backgroundColor="#000"
          zIndex={100000}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          bordered
          elevate
          key="content"
          animation="quick"
          enterStyle={{ opacity: 0, scale: 0.98, y: -10 }}
          exitStyle={{ opacity: 0, scale: 0.98, y: -10 }}
          width={400}
          padding={0}
          borderRadius="$4"
          backgroundColor="$background"
          overflow="hidden"
        >
          <XStack
            padding="$2"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderColor="$borderColor"
          >
            <Dialog.Title asChild unstyled>
              <XStack alignItems="center" space="$2">
                <Circle size={28} bg="$blue3">
                  <BarChart2 size={16} color="$blue10" />
                </Circle>
              </XStack>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="$3" circular icon={X} chromeless />
            </Dialog.Close>
          </XStack>

          <YStack px="$4" space="$4" minHeight={200} justifyContent={isLoading ? 'center' : 'flex-start'}>
            {isLoading ? (
              <YStack alignItems="center" space="$2">
                <Spinner size="large" color="$blue10" />
                <Text color="$color10">Đang tải dữ liệu bình chọn...</Text>
              </YStack>
            ) : displayMsg ? (
              < ScrollView maxHeight={500} showsVerticalScrollIndicator={false}>
                <PollDetail
                  msg={displayMsg}
                  roomId={roomId}
                  mode="DETAIL"
                  currentUserId={myProfile?.id}
                />
              </ScrollView>) :
              (<YStack alignItems="center" justifyContent="center" flex={1}>
                <Text color="$red10" fontWeight="bold">Không tìm thấy thông tin bình chọn.</Text>
                <Text color="$color10" fontSize="$2">Cuộc bình chọn này có thể đã bị xóa hoặc xảy ra lỗi mạng.</Text>
              </YStack>)}
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog >
  )
}