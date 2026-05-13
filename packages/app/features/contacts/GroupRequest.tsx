import React, { useState } from 'react'
import { YStack, XStack, Text, Spinner } from 'tamagui'
import { ContactHeader, UserCard } from '@my/ui'
import { FriendRequestType } from '../../types/Request'
import { Platform, FlatList } from 'react-native'
import { useGetGroupInvitesQuery, useRespondGroupInviteMutation } from 'app/services/roomApi'
import { GroupAcceptRequestResponse, UserResponse } from 'app/types/Response'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'app/store'
import { roomApi } from 'app/services/roomApi'

export default function GroupRequestPage() {
  // State phục vụ phân trang
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  // Truyền thêm param phân trang, giữ nguyên tên biến data của bạn
  const { data, isLoading } = useGetGroupInvitesQuery({ cursor, limit: 20 })
  const groupInvitesData = data?.items as GroupAcceptRequestResponse[] | undefined
  const isWeb = Platform.OS === 'web'
  const dispatch = useDispatch<AppDispatch>()
  const [respondGroupInvite] = useRespondGroupInviteMutation()

  // Không đụng gì đến logic action của bạn
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

  // Logic phân trang khi lướt đến cuối danh sách
  const handleFetchMore = () => {
    if (isLoading || isFetchingMore || !data?.nextCursor) return

    setIsFetchingMore(true)
    setCursor(data.nextCursor)

    setTimeout(() => {
      setIsFetchingMore(false)
    }, 1000)
  }

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
          <FlatList
            style={{ flex: 1 }}
            data={groupInvitesData || []}
            keyExtractor={(item) => item.roomId}
            contentContainerStyle={{ gap: 12, padding: 8, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (
              <UserCard
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
            )}
            ListEmptyComponent={
              isLoading ? (
                <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
                  <Spinner size="large" color="$blue10" />
                </YStack>
              ) : (
                <Text color="$color10" textAlign="center" marginTop="$10">
                  Không có lời mời vào nhóm nào.
                </Text>
              )
            }
            onEndReached={handleFetchMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingMore ? (
                <YStack padding="$4" alignItems="center">
                  <Spinner size="small" color="$blue10" />
                </YStack>
              ) : null
            }
          />
        </YStack>
      </YStack>
    </XStack>
  )
}