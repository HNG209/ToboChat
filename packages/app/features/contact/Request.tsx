import React, { useState } from 'react'
import { YStack, XStack, H3, Text, Select, ScrollView, Button } from 'tamagui'
import { ChevronDown, ChevronLeft } from '@tamagui/lucide-icons'
import { UserCard } from '@my/ui'
import {
  useGetMyFriendRequestsQuery,
  useCancelFriendRequestMutation,
  useRespondFriendRequestMutation,
} from '../../store/api'
import { FriendRequestType } from '../../types/Request'
import { useRouter } from 'solito/navigation'

export default function RequestPage() {
  const router = useRouter();
  const [requestFilter, setRequestFilter] = useState<FriendRequestType>(FriendRequestType.PENDING)

  const [cancelFriendRequest] = useCancelFriendRequestMutation()
  const [respondFriendRequest] = useRespondFriendRequestMutation()

  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
  } = useGetMyFriendRequestsQuery(
    { type: requestFilter, limit: 10 }
  )

  const handleAction = async (action: string, targetId: string) => {
    try {
      if (action === 'accept') await respondFriendRequest({ otherId: targetId, accepted: true }).unwrap()
      if (action === 'reject') await respondFriendRequest({ otherId: targetId, accepted: false }).unwrap()
      if (action === 'cancel') await cancelFriendRequest({ otherId: targetId }).unwrap()
    } catch (err) {
      console.error('API error:', err)
    }
  }

  return (
    <XStack flex={1} height="100vh" padding="$4" gap="$4" alignItems="stretch">
      <YStack flex={1} gap="$4">
        {/* HEADER */}
        <XStack
          alignItems="center"
          padding="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$6"
          backgroundColor="$background"
          gap="$3"
        >
          <Button
          icon={<ChevronLeft size={24} />}
          height = {40}
          width = {40}
          padding = {0}
          chromeless
          display="none" // Mặc định ẩn trên Desktop
          $sm={{ display: 'flex' }} // Chỉ hiện khi màn hình nhỏ
          onPress={() => router.push('/chat/friend')}
          />
          <YStack flex={1}>
            <H3>Lời mời kết bạn</H3>
            <Text color="$gray10" fontSize="$3">
              {(requestsData?.items?.length ?? 0)} lời mời
            </Text>
          </YStack>

          {/* BỘ LỌC (Filter) */}
          <Select
            value={requestFilter}
            onValueChange={(val) => setRequestFilter(val as FriendRequestType)}
            disablePreventBodyScroll
          >
            <Select.Trigger width={180} borderRadius="$4" iconAfter={<ChevronDown size={16} />}>
              <Select.Value placeholder="Chọn loại lời mời" />
            </Select.Trigger>
            <Select.Content zIndex={200000}>
              <Select.Viewport>
                <Select.Item index={0} value={FriendRequestType.PENDING}>
                  <Select.ItemText>Lời mời đã nhận</Select.ItemText>
                </Select.Item>
                <Select.Item index={1} value={FriendRequestType.SENT}>
                  <Select.ItemText>Lời mời đã gửi</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select>
        </XStack>

        {/* NỘI DUNG DANH SÁCH LỜI MỜI */}
        <YStack
          flex={1}
          padding="$2"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$6"
          gap="$2"
        >
          <ScrollView gap="$3" flex={1}>
            {requestsLoading && <Text>Đang tải...</Text>}
            {requestsError && <Text color="red">Lỗi tải dữ liệu</Text>}
            
            {requestsData?.items?.map((request, index) => (
              <UserCard
                key={`${request.id}-${index}`}
                user={request}
                requestId={request.id}
                type={requestFilter}
                onAction={(action) => handleAction(action, request.id)}
              />
            ))}

            {!requestsLoading && (requestsData?.items?.length ?? 0) === 0 && (
              <Text color="$gray10" textAlign="center" marginTop="$10">
                {requestFilter === FriendRequestType.SENT
                  ? 'Chưa gửi lời mời nào'
                  : 'Chưa có lời mời kết bạn nào đang chờ'}
              </Text>
            )}
          </ScrollView>
        </YStack>
      </YStack>
    </XStack>
  )
}