import React, { useState } from 'react';
import {
  Button,
  XStack,
  YStack,
  Text,
  Avatar,
  Theme,
  Circle,
  Label,
  Tooltip,
  Separator,
} from 'tamagui';
import { Check, ArrowLeft, Info, UserPlus } from '@tamagui/lucide-icons';
import { StyledFlatList } from '../StyledFlatList';
import { useGetMyFriendListQuery } from 'app/services/contactApi';
import { roomApi, useAddMembersMutation } from 'app/services/roomApi';
import { ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux'
import { Platform } from 'expo-modules-core'
import { AppDispatch } from 'app/store'

interface AddMemberContentProps {
  roomId: string;
  onClose: () => void; // Hàm để quay lại trang Info
}

export const AddMemberContent = ({ roomId, onClose }: AddMemberContentProps) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const dispatch = useDispatch<AppDispatch>()
  const {
    data: friendsData,
    isLoading: friendsLoading,
  } = useGetMyFriendListQuery({ limit: 20, roomId });

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
      setErrorMsg('Vui lòng chọn ít nhất 1 người.');
      return;
    }

    try {
      // Cập nhật memberCount cho chính mình thấy ngay trên UI
      dispatch(
        roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
          const room = draft.items?.find((r) => r.id === roomId);
          if (room) {
            room.memberCount = (room.memberCount || 0) + selectedMembers.length;
          }
        })
      );
      await addMembers({ roomId, targetUserIds: selectedMembers }).unwrap();



      onClose();
    } catch (error) {
      console.error("Lỗi thêm thành viên:", error);
      setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* --- HEADER ĐỒNG BỘ --- */}
      <XStack
        p="$3"
        alignItems="center"
        space="$2"
        borderBottomWidth={0.5}
        borderColor="$borderColor"
      >
        <Button
          icon={ArrowLeft}
          chromeless
          circular
          onPress={onClose}
          backgroundColor="transparent"
        />
        <Text fontWeight="700" fontSize="$5">Thêm thành viên</Text>
      </XStack>

      {/* --- DANH SÁCH --- */}
      <YStack flex={1} p="$2">
        <StyledFlatList
          data={friendsData?.items || []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text fontSize="$3" color="$color10" px="$2" py="$2">
              Gợi ý bạn bè ({friendsData?.items?.length || 0})
            </Text>
          }
          ListFooterComponent={
            friendsLoading ? (
              <XStack justifyContent="center" py="$4">
                <ActivityIndicator size="small" color="$blue10" />
              </XStack>
            ) : <YStack height={80} /> // Khoảng trống cuối để không bị nút đè
          }
          contentContainerStyle={{ gap: 4 }}
          renderItem={({ item: friend }) => {
            const isSelected = selectedMembers.includes(friend.id);
            const isAlreadyInGroup = friend.inRoom;

            return (
              <XStack
                alignItems="center"
                justifyContent="space-between"
                p="$3"
                borderRadius="$4"
                onPress={() => toggleMember(friend.id, isAlreadyInGroup)}
                backgroundColor={isSelected ? '$blue2' : 'transparent'}
                opacity={isAlreadyInGroup ? 0.6 : 1}
                pressStyle={isAlreadyInGroup ? undefined : { backgroundColor: '$backgroundHover' }}
              >
                <XStack alignItems="center" space="$3">
                  <Avatar circular size="$4">
                    <Avatar.Image src={friend.avatarUrl} />
                    <Avatar.Fallback backgroundColor="$blue5" />
                  </Avatar>
                  <YStack>
                    <Text fontSize="$3" fontWeight={isSelected ? '600' : '500'}>
                      {friend.name}
                    </Text>
                    {isAlreadyInGroup ? (
                      <Text fontSize="$1" color="$green10">Đã là thành viên</Text>
                    ) : !friend.allowAutoAddToGroup && (
                      <XStack alignItems="center" space="$1">
                        <Text fontSize="$1" color="$gray10">Cần gửi yêu cầu</Text>
                        <Info size={12} color="$gray10" />
                      </XStack>
                    )}
                  </YStack>
                </XStack>

                {!isAlreadyInGroup && (
                  <Circle
                    size={22}
                    borderWidth={2}
                    borderColor={isSelected ? '$blue10' : '$gray7'}
                    backgroundColor={isSelected ? '$blue10' : 'transparent'}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isSelected && <Check size={14} color="white" />}
                  </Circle>
                )}
              </XStack>
            );
          }}
        />
      </YStack>

      {/* --- NÚT THỰC THI (FIXED BOTTOM) --- */}
      <YStack p="$4" backgroundColor="$background" borderTopWidth={0.5} borderColor="$borderColor">
        {errorMsg ? (
          <Text color="$red10" fontSize="$2" textAlign="center" mb="$2">
            {errorMsg}
          </Text>
        ) : null}
        <Theme name="blue">
          <Button
            size="$4"
            fontWeight="700"
            onPress={handleAddMembers}
            disabled={isAddingMembers || selectedMembers.length === 0}
            opacity={selectedMembers.length === 0 ? 0.5 : 1}
            icon={isAddingMembers ? undefined : UserPlus}
          >
            {isAddingMembers ? <ActivityIndicator color="white" /> : `Thêm ${selectedMembers.length} thành viên`}
          </Button>
        </Theme>
      </YStack>
    </YStack>
  );
};