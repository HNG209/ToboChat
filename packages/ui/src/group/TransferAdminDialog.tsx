import React, { useState } from 'react';
import {
  Dialog, Button, XStack, YStack, Text, Avatar, Theme, Circle, Label,
} from 'tamagui';
import { Check, X } from '@tamagui/lucide-icons';
import { StyledFlatList } from '../StyledFlatList';
import { ActivityIndicator } from 'react-native';
import { useGetMyInfoQuery, useGetRoomMembersQuery, useLeaveGroupMutation } from 'app/services/roomApi';

interface TransferAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onSuccess: () => void;
}

export function TransferAdminDialog({ open, onOpenChange, roomId, onSuccess }: TransferAdminDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: membersData, isLoading: membersLoading } = useGetRoomMembersQuery({ roomId });
  const { data: myInfo } = useGetMyInfoQuery({ roomId });
  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation();

  const handleTransferAndLeave = async () => {
    if (!selectedMemberId) {
      setErrorMsg('Vui lòng chọn 1 thành viên để nhường quyền trưởng nhóm.');
      return;
    }

    setErrorMsg('');

    try {
      await leaveGroup({ roomId, newAdminId: selectedMemberId }).unwrap();
      onSuccess();
    } catch (error) {
      console.error('Lỗi khi nhường quyền và rời nhóm:', error);
      setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    setSelectedMemberId(null);
    setErrorMsg('');
    onOpenChange(false);
  };

  // Lọc bỏ user hiện tại ra khỏi danh sách trước khi render
  const filteredMembers = membersData?.items?.filter((item: any) => {
    return !myInfo || item.id !== myInfo.id;
  }) || [];

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animation={['quick', { opacity: { overshootClamping: true } }]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0} y={0} scale={1} opacity={1}
          width="90%"
          maxWidth={400}
          borderRadius="$5"
        >
          <Dialog.Close asChild onPress={handleClose}>
            <Button position="absolute" top="$3" right="$3" size="$2" circular icon={X} chromeless />
          </Dialog.Close>

          <Dialog.Title fontSize="$7" fontWeight="bold" letterSpacing={0.15} mb="$2">
            Nhường quyền Trưởng nhóm
          </Dialog.Title>
          <Text color="gray" fontSize="$3" mb="$4">
            Bạn là trưởng nhóm. Vui lòng chọn một thành viên khác để tiếp quản nhóm trước khi rời đi.
          </Text>

          <YStack space="$4">
            <YStack>
              <StyledFlatList
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$3"
                data={filteredMembers} // Sử dụng danh sách đã được lọc ở đây
                keyExtractor={(item: any) => item.id}
                style={{ maxHeight: 300 }}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  membersLoading ? (
                    <XStack justifyContent="center" alignItems="center" py="$4">
                      <ActivityIndicator size="small" color="#888" />
                    </XStack>
                  ) : null
                }
                contentContainerStyle={{ gap: 8, padding: 8 }}
                renderItem={({ item }: any) => {
                  // Đã xoá dòng if (myInfo...) continue;
                  const isSelected = selectedMemberId === item.member.id;

                  return (
                    <XStack
                      alignItems="center"
                      justifyContent="space-between"
                      p="$3"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isSelected ? 'transparent' : isSelected ? '#007AFF' : '#E5E5EA'}
                      onPress={() => setSelectedMemberId(item.member.id)}
                      animation="quick"
                      pressStyle={{ scale: 0.98 }}
                    >
                      <XStack alignItems="center" space="$3">
                        <Avatar circular size="$4">
                          <Avatar.Image src={item.member.avatarUrl} />
                          <Avatar.Fallback borderColor="$gray5" />
                        </Avatar>
                        <Text fontSize="$3" fontWeight={isSelected ? 'bold' : 'normal'}>
                          {item.member.name}
                        </Text>
                      </XStack>

                      <Circle
                        size="$1"
                        borderWidth={isSelected ? 0 : 2}
                        borderColor="gray"
                        backgroundColor={isSelected ? '#007AFF' : 'transparent'}
                      >
                        {isSelected && <Check size={14} color="white" />}
                      </Circle>
                    </XStack>
                  );
                }}
              />
            </YStack>

            {errorMsg ? (
              <Text color="red" fontSize="$3" textAlign="center">{errorMsg}</Text>
            ) : null}

            <YStack space="$2" mt="$2" flexDirection="row" justifyContent="flex-end">
              <Theme name="active">
                <Button
                  onPress={handleTransferAndLeave}
                  fontWeight="bold"
                  backgroundColor="$red9"
                  color="white"
                  hoverStyle={{ backgroundColor: '$red10' }}
                  disabled={isLeaving || !selectedMemberId}
                  opacity={!selectedMemberId ? 0.6 : 1}
                >
                  {isLeaving ? <ActivityIndicator size="small" color="#FFF" /> : 'Nhường quyền & Rời đi'}
                </Button>
              </Theme>
            </YStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}