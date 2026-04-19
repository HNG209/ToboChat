import React, { useState } from 'react';
import {
  Dialog,
  Button,
  XStack,
  YStack,
  Text,
  Avatar,
  Theme,
  Circle,
  Label,
  Tooltip, // Thêm Tooltip từ tamagui
} from 'tamagui';
import { Check, X, Info } from '@tamagui/lucide-icons'; // Thêm Info icon
import { StyledFlatList } from '../StyledFlatList'; // Chỉnh lại đường dẫn nếu cần
import { useGetMyFriendListQuery } from 'app/services/contactApi';
import { roomApi, useAddMembersMutation } from 'app/services/roomApi';
import { ActivityIndicator } from 'react-native';
import { AppDispatch } from 'app/store';
import { useDispatch } from 'react-redux';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export function AddMemberDialog({ open, onOpenChange, roomId }: AddMemberDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  const {
    data: friendsData,
    isLoading: friendsLoading,
    error: friendsError,
  } = useGetMyFriendListQuery({ limit: 10, roomId });

  const [addMembers, { isLoading: isAddingMembers }] = useAddMembersMutation();

  const toggleMember = (id: string, inGroup?: boolean) => {
    if (inGroup) return;

    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
    if (errorMsg) setErrorMsg('');
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length < 1) {
      setErrorMsg('Vui lòng chọn ít nhất 1 thành viên để thêm vào nhóm.');
      return;
    }

    setErrorMsg('');

    try {
      const result = await addMembers({ roomId, targetUserIds: selectedMembers }).unwrap();
      handleClose();
    } catch (error) {
      console.error('Lỗi khi thêm thành viên:', error);
      setErrorMsg('Có lỗi xảy ra khi thêm thành viên. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setErrorMsg('');
    onOpenChange(false);
  };

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
          animation={[
            'quick',
            { opacity: { overshootClamping: true } },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          y={0}
          scale={1}
          opacity={1}
          width="90%"
          maxWidth={400}
          borderRadius="$5"
        >
          <Dialog.Close asChild onPress={handleClose}>
            <Button
              position="absolute"
              top="$3"
              right="$3"
              size="$2"
              circular
              icon={X}
              chromeless
            />
          </Dialog.Close>

          <Dialog.Title
            fontSize="$8"
            fontWeight="bold"
            letterSpacing={0.15}
          >
            {'Thêm thành viên'}
          </Dialog.Title>

          <YStack space="$4">
            <YStack>
              <Label fontSize="$3" color="gray" mb="$2">
                Chọn bạn bè để thêm
              </Label>

              <StyledFlatList
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$3"
                data={friendsData?.items || []}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 350 }}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  friendsLoading ? (
                    <XStack justifyContent="center" alignItems="center" py="$4">
                      <ActivityIndicator size="small" color="#888" />
                    </XStack>
                  ) : null
                }
                contentContainerStyle={{ gap: 8, padding: 8 }}
                renderItem={({ item: friend }) => {
                  const isSelected = selectedMembers.includes(friend.id);
                  const isAlreadyInGroup = friend.inRoom;

                  return (
                    <XStack
                      alignItems="center"
                      justifyContent="space-between"
                      p="$3"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isAlreadyInGroup ? 'transparent' : isSelected ? '#007AFF' : '#E5E5EA'}
                      backgroundColor={isAlreadyInGroup ? '$gray3' : isSelected ? '#E5F1FF' : 'transparent'}
                      onPress={() => toggleMember(friend.id, isAlreadyInGroup)}
                      animation="quick"
                      pressStyle={isAlreadyInGroup ? undefined : { scale: 0.98 }}
                      opacity={isAlreadyInGroup ? 0.5 : 1}
                      pointerEvents={isAlreadyInGroup ? 'none' : 'auto'}
                    >
                      <XStack alignItems="center" space="$3">
                        <Avatar circular size="$4">
                          <Avatar.Image src={friend.avatarUrl} />
                          <Avatar.Fallback borderColor="#E5E5EA" />
                        </Avatar>
                        <YStack space="$1">
                          <Text fontSize="$3" fontWeight={isSelected ? 'bold' : 'normal'}>
                            {friend.name}
                          </Text>

                          {isAlreadyInGroup && (
                            <Text fontSize="$2" color="gray">Đã tham gia</Text>
                          )}

                          {/* Khu vực Gửi yêu cầu tích hợp Tooltip */}
                          {(!isAlreadyInGroup && !friend.allowAutoAddToGroup) && (
                            <XStack alignItems="center" space="$1.5">
                              <Text fontSize="$2" color="gray">Gửi yêu cầu</Text>

                              <Tooltip placement="top">
                                <Tooltip.Trigger>
                                  <Info size={14} color="gray" />
                                </Tooltip.Trigger>

                                <Tooltip.Content
                                  enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
                                  exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
                                  scale={1}
                                  x={0}
                                  y={0}
                                  opacity={1}
                                  animation={[
                                    'quick',
                                    { opacity: { overshootClamping: true } },
                                  ]}
                                  p="$2"
                                  borderRadius="$3"
                                  backgroundColor="$background"
                                  elevation="$2"
                                >
                                  <Tooltip.Arrow />
                                  <Text fontSize="$2" color="$color">
                                    Người dùng này đang tắt tự động thêm vào nhóm
                                  </Text>
                                </Tooltip.Content>
                              </Tooltip>
                            </XStack>
                          )}
                        </YStack>
                      </XStack>

                      {!isAlreadyInGroup && (
                        <Circle
                          size="$1"
                          borderWidth={isSelected ? 0 : 2}
                          borderColor="gray"
                          backgroundColor={isSelected ? '#007AFF' : 'transparent'}
                        >
                          {isSelected && <Check size={14} color="white" />}
                        </Circle>
                      )}
                    </XStack>
                  );
                }}
              />
            </YStack>

            {errorMsg ? (
              <Text color="red" fontSize="$3" textAlign="center">
                {errorMsg}
              </Text>
            ) : null}

            <YStack space="$2" mt="$3" flexDirection="row" justifyContent="flex-end">
              <Theme>
                <Button
                  onPress={handleAddMembers}
                  fontWeight="bold"
                  disabled={isAddingMembers || selectedMembers.length === 0}
                  opacity={selectedMembers.length === 0 ? 0.6 : 1}
                >
                  {isAddingMembers ?
                    <ActivityIndicator size="small" color="#FFF" />
                    : 'Thêm vào nhóm'}
                </Button>
              </Theme>
              <Button onPress={handleClose} variant="outlined" chromeless>
                Huỷ
              </Button>
            </YStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}