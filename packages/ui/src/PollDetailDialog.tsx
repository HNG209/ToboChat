import { useMemo, useState } from 'react';
import { Dialog, YStack, XStack, Text, Button, Circle, ScrollView, ZStack, Avatar, Spinner, Unspaced } from 'tamagui';
import { X, CheckCircle2, Users, BarChart2, Edit3 } from '@tamagui/lucide-icons';
import { useDispatch } from 'react-redux';
import { MessageResponse } from 'app/types/Response';
import { useGetProfileQuery } from 'app/services/userApi';
import { chatApi, useVotePollMutation } from 'app/services/chatApi';
import { CreatePollSheet } from './CreatePollSheet';
import { AppDispatch } from 'app/store';
import { PollDetail } from './PollDetail';

type Props = {
  isOpen: boolean;
  msg: MessageResponse;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  pollId: string;
  initialMessage?: MessageResponse | null;
};

export const PollDetailDialog = ({ isOpen, msg, onOpenChange, roomId }: Props) => {
  const { data: myProfile } = useGetProfileQuery()

  return (
    <Dialog modal open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" animation="quick" opacity={0.5} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animation="quick"
          width="95%"
          maxWidth={500}
          borderRadius="$4"
          p="$0"
        >
          <YStack p="$4" space="$4">
            <ScrollView maxHeight={500}>
              <PollDetail msg={msg} roomId={roomId} mode="DETAIL" currentUserId={myProfile?.id} />
            </ScrollView>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}