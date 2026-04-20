import React from 'react'
import {
  YStack, XStack, Text, Button, Avatar, ScrollView, Circle
} from 'tamagui'
import { ArrowLeft, Check, X, UserPlus } from '@tamagui/lucide-icons'
// import {
//   roomApi,
//   // Giả định các hook này tồn tại trong roomApi của bạn
//   useGetPendingMembersQuery,
//   useApproveMemberMutation,
//   useRejectMemberMutation
// } from 'app/services/roomApi'
import { ActivityIndicator } from 'react-native'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'app/store'
import { roomApi, useApproveMemberMutation, useGetPendingRequestQuery } from 'app/services/roomApi'
import { GroupPendingRequestResponse, UserResponse } from 'app/types/Response'

interface ApproveMembersContentProps {
  roomId: string
  onClose: () => void
}

export const ApproveMembersContent = ({ roomId, onClose }: ApproveMembersContentProps) => {
  const dispatch = useDispatch<AppDispatch>()

  // Lấy danh sách thành viên đang chờ duyệt
  const { data: pendingData, isLoading } = useGetPendingRequestQuery({ roomId })
  const [approveMember, { isLoading: isApproving }] = useApproveMemberMutation()
  // const [rejectMember, { isLoading: isRejecting }] = useRejectMemberMutation()

  // Xử lý Duyệt
  const handleApprove = async (userId: string) => {
    const patchResult = dispatch(
      roomApi.util.updateQueryData('getPendingRequest', { roomId }, (draft) => {
        const index = draft.items?.findIndex((r) => r.user.id === userId);
        if (index !== -1 && index !== undefined) {
          draft.items.splice(index, 1);
        }
      })
    );
    try {
      await approveMember({ roomId, userId, accept: true }).unwrap()

    } catch (e) {
      patchResult.undo()
      console.error("Lỗi khi duyệt thành viên", e)
    }
  }

  // Xử lý Từ chối
  const handleReject = async (userId: string) => {
    const patchResult = dispatch(
      roomApi.util.updateQueryData('getPendingRequest', { roomId }, (draft) => {
        const index = draft.items?.findIndex((r) => r.user.id === userId);
        if (index !== -1 && index !== undefined) {
          draft.items.splice(index, 1);
        }
      })
    );
    try {
      await approveMember({ roomId, userId, accept: false }).unwrap()
    } catch (e) {
      patchResult.undo()
      console.error("Lỗi khi từ chối thành viên", e)
    }
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* HEADER */}
      <XStack p="$3" alignItems="center" space="$2" borderBottomWidth={0.5} borderColor="$borderColor">
        <Button icon={ArrowLeft} chromeless circular onPress={onClose} />
        <YStack>
          <Text fontWeight="700" fontSize="$5" color="$color">Yêu cầu tham gia</Text>
          <Text fontSize="$2" color="$gray10">{pendingData?.items?.length || 0} người đang chờ</Text>
        </YStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack p="$2">
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="$blue10" />
          ) : pendingData?.items?.length === 0 ? (
            <YStack py="$10" alignItems="center" space="$3">
              <Circle size={60} backgroundColor="$gray3">
                <UserPlus size={30} color="$gray8" />
              </Circle>
              <Text color="$gray10">Không có yêu cầu nào mới</Text>
            </YStack>
          ) : (
            pendingData?.items?.map((item: GroupPendingRequestResponse) => {
              const user = item.user as UserResponse
              return (
                <XStack
                  key={user.id}
                  alignItems="center"
                  p="$3"
                  space="$3"
                  borderRadius="$4"
                  hoverStyle={{ backgroundColor: "$backgroundHover" }}
                >
                  <Avatar circular size="$4">
                    <Avatar.Image src={user.avatarUrl} />
                    <Avatar.Fallback backgroundColor="$blue5" />
                  </Avatar>

                  <YStack flex={1}>
                    <Text fontWeight="600" color="$color" numberOfLines={1}>
                      {user.name}
                    </Text>
                    <Text fontSize="$2" color="$color10" numberOfLines={1}>
                      {user.email || 'Muốn tham gia nhóm'}
                    </Text>
                  </YStack>

                  {/* CẶP NÚT DUYỆT / XÓA */}
                  <XStack space="$2">
                    <Button
                      size="$3"
                      circular
                      icon={X}
                      backgroundColor="$red3"
                      color="$red10"
                      borderWidth={0}
                      onPress={() => handleReject(user.id)}
                      disabled={isApproving}
                    />
                    <Button
                      size="$3"
                      circular
                      icon={Check}
                      backgroundColor="$green3"
                      color="$green10"
                      borderWidth={0}
                      onPress={() => handleApprove(user.id)}
                      disabled={isApproving}
                    />
                  </XStack>
                </XStack>
              )
            })
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}