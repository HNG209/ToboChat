import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  XStack,
  YStack,
  Text,
  Avatar,
  Theme,
  Circle,
  Label,
  styled,
  Tooltip,
} from 'tamagui';
import { Check, Info, X } from '@tamagui/lucide-icons';
import { StyledFlatList } from './StyledFlatList';
import { useGetMyFriendListQuery } from 'app/services/contactApi';
import { roomApi, useCreateGroupMutation } from 'app/services/roomApi';
import { ActivityIndicator } from 'react-native';
import { AppDispatch } from 'app/store';
import { useDispatch } from 'react-redux';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const dispatch = useDispatch<AppDispatch>()
  const {
    data: friendsData,
    isLoading: friendsLoading,
    error: friendsError,
  } = useGetMyFriendListQuery({ limit: 10 })
  const [createGroup, { isLoading: isCreatingGroup }] = useCreateGroupMutation();

  // Hàm xử lý chọn/bỏ chọn thành viên
  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
    if (errorMsg) setErrorMsg('');
  };

  // Hàm xử lý validate và tạo nhóm
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setErrorMsg('Tên nhóm không được để trống.');
      return;
    }
    if (selectedMembers.length < 1) {
      setErrorMsg('Vui lòng chọn ít nhất 2 thành viên để tạo nhóm.');
      return;
    }

    setErrorMsg('');

    try {
      const result = await createGroup({ roomName: groupName, memberIds: selectedMembers }).unwrap()
      onOpenChange(false);
      // Cập nhật cache rtk-query để thêm nhóm mới vào danh sách phòng
      // Điều này sẽ tự động kích hoạt re-render ở những nơi sử dụng useGetJoinedRoomsQuery
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          if (draft) {
            draft.items.unshift(result);
            // draft.total += 1;
          }
        })
      );
    } catch (error) {
      console.error('Lỗi khi tạo nhóm:', error);
      setErrorMsg('Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    setGroupName('');
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
          // p="$4"
          borderRadius="$5"
        >
          {/* Nút tắt Modal ở góc */}
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
            {'Tạo nhóm mới'}
          </Dialog.Title>

          <YStack space="$4">
            {/* Input Tên nhóm */}
            <YStack>
              <Label fontSize="$3" htmlFor="group-name" color="gray">
                Tên nhóm <Text color="red">*</Text>
              </Label>
              <Input
                id="group-name"
                placeholder="Nhập tên nhóm..."
                fontSize="$3"
                value={groupName}
                onChangeText={(text) => {
                  setGroupName(text);
                  if (errorMsg) setErrorMsg('');
                }}
                focusStyle={{ borderColor: '#007AFF', borderWidth: 2 }}
              />
            </YStack>

            {/* Khung thêm thành viên */}
            <YStack>
              <Label fontSize="$3" color="gray">
                Thêm thành viên
              </Label>

              {/* Vùng cuộn bằng FlatList */}
              <StyledFlatList
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$3"
                data={friendsData?.items || []}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 250 }}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  friendsLoading ? (
                    <XStack justifyContent="center" alignItems="center" py="$4">
                      <ActivityIndicator size="small" color="#888" />
                    </XStack>
                  ) : null
                }
                contentContainerStyle={{ gap: 8 }} // Tạo khoảng cách giữa các item tương đương YStack space
                renderItem={({ item: friend }) => {
                  const isSelected = selectedMembers.includes(friend.id);
                  return (
                    <XStack
                      alignItems="center"
                      justifyContent="space-between"
                      p="$3"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isSelected ? '#007AFF' : '#E5E5EA'}
                      backgroundColor={isSelected ? '#E5F1FF' : 'transparent'}
                      onPress={() => toggleMember(friend.id)}
                      animation="quick"
                      pressStyle={{ scale: 0.98 }}
                    >
                      <XStack alignItems="center" space="$3">
                        <Avatar circular size="$4">
                          <Avatar.Image src={friend.avatarUrl} />
                          <Avatar.Fallback borderColor="#E5E5EA" />
                        </Avatar>
                        <Text fontSize="$3">
                          {friend.name}
                        </Text>

                        {!friend.allowAutoAddToGroup && (
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
                      </XStack>

                      {/* Nút Check mark / Trạng thái chọn */}
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

            {/* Khu vực hiển thị lỗi */}
            {errorMsg ? (
              <Text color="red" fontSize="$3" textAlign="center">
                {errorMsg}
              </Text>
            ) : null}

            {/* Các nút hành động */}
            <YStack space="$2" mt="$3" flexDirection="row" justifyContent="flex-end">
              <Theme>
                <Button onPress={handleCreateGroup} fontWeight="bold" disabled={isCreatingGroup}>
                  {isCreatingGroup ?
                    <ActivityIndicator size="small" color="#FFF" />
                    : 'Tạo nhóm'}
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