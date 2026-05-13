'use client'
import { YStack, XStack, H3, Text, Select, ScrollView, Button } from 'tamagui'
import { ContactHeader, UserCard } from '@my/ui'
// Import cái Type để mapping cho đúng logic của UserCard
import { FriendRequestType } from '../../types/Request'
import { Platform } from 'react-native'
import { useGetGroupInvitesQuery, useRespondGroupInviteMutation } from 'app/services/roomApi'
import { GroupAcceptRequestResponse, UserResponse } from 'app/types/Response'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'app/store'
import { roomApi } from 'app/services/roomApi'

export default function GroupRequestPage() {
  const { data, isLoading } = useGetGroupInvitesQuery() // Gọi API lấy lời mời nhóm ở đây, sau này sẽ dùng data này để render danh sách
  const groupInvitesData = data?.items as GroupAcceptRequestResponse[] | undefined
  const isWeb = Platform.OS === 'web'
  const dispatch = useDispatch<AppDispatch>()
  const [respondGroupInvite] = useRespondGroupInviteMutation()

  const handleAction = async (action: string, id: string) => {
    try {
      const isAccept = action === 'join';

      dispatch(
        roomApi.util.updateQueryData('getGroupInvites', undefined, (draft) => {
          const index = draft.items?.findIndex((r) => r.roomId === id);
          if (index !== -1 && index !== undefined) {
            draft.items.splice(index, 1);
          }
        })
      );
      const response = await respondGroupInvite({ groupId: id, accepted: isAccept }).unwrap();

      if (isAccept && response && response.id) {
        dispatch(
          roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
            if (draft && draft.items) {
              draft.items.unshift(response);
            }
          })
        );
      }
    } catch (error) {
      console.error('Lỗi phản hồi lời mời nhóm:', error);
    }
  };

  return (
    <XStack
      flex={1}
      padding="$4"
      gap="$4"
      alignItems="stretch"
      {...(isWeb ? { height: '100vh' } : {})}
    >
      <YStack flex={1} gap="$4">
        {/* HEADER */}
        <ContactHeader
          title="Lời mời vào nhóm"
          subtitle={`${groupInvitesData?.length ?? 0} lời mời`}
          onBackPath="/contacts"
        />

        {/* DANH SÁCH NỘI DUNG */}
        <YStack flex={1} padding="$2" borderColor="$borderColor" borderRadius="$6">
          <ScrollView flex={1}>
            <YStack gap="$3" padding="$2">
              {groupInvitesData?.map((item: GroupAcceptRequestResponse) => (
                <UserCard
                  key={item.roomId}
                  isGroup={true} // Bật chế độ hiển thị Nhóm
                  // Hiển thị thông tin người mời cho sinh động
                  description={`Người mời: ${item.inviter.name}`}
                  user={
                    {
                      id: item.roomId,
                      name: item.roomName,
                      avatarUrl: '',
                    } as UserResponse
                  }
                  // Mapping filter sang Type của UserCard để hiện đúng nút (Accept/Reject hoặc Cancel)
                  type={FriendRequestType.PENDING}
                  onAction={(action) => handleAction(action, item.roomId)}
                />
              ))
              }

              {groupInvitesData?.length === 0 && (
                <Text color="$color10" textAlign="center" marginTop="$10">
                  Không có lời mời vào nhóm nào.
                </Text>
              )}
            </YStack>
          </ScrollView>
        </YStack>
      </YStack>
    </XStack>
  )
}
