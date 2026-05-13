import React, { useState } from 'react'
import { YStack, XStack, Text, Select, Button, Spinner } from 'tamagui'
import { ChevronDown } from '@tamagui/lucide-icons'
import { ContactHeader, UserCard } from '@my/ui'
import { FriendRequestType } from '../../types/Request'
import { useRouter } from 'solito/navigation'
import {
  useCancelFriendRequestMutation,
  useGetMyFriendRequestsQuery,
  useRespondFriendRequestMutation,
} from 'app/services/contactApi'
import { Platform, FlatList } from 'react-native'

export default function RequestPage() {
  const router = useRouter()
  const [requestFilter, setRequestFilter] = useState<FriendRequestType>(FriendRequestType.PENDING)

  // State phục vụ phân trang
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const isWeb = Platform.OS === 'web'

  const [cancelFriendRequest] = useCancelFriendRequestMutation()
  const [respondFriendRequest] = useRespondFriendRequestMutation()

  // Thêm cursor vào query
  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
  } = useGetMyFriendRequestsQuery({ type: requestFilter, cursor, limit: 10 })

  const handleAction = async (action: string, targetId: string) => {
    try {
      if (action === 'accept')
        await respondFriendRequest({ otherId: targetId, accepted: true }).unwrap()
      if (action === 'reject')
        await respondFriendRequest({ otherId: targetId, accepted: false }).unwrap()
      if (action === 'cancel') await cancelFriendRequest({ otherId: targetId }).unwrap()
    } catch (err) {
      console.error('API error:', err)
    }
  }

  // Chuyển đổi tab cần reset lại cursor
  const handleFilterChange = (val: FriendRequestType) => {
    setRequestFilter(val)
    setCursor(undefined)
  }

  // Logic phân trang khi lướt đến cuối danh sách
  const handleFetchMore = () => {
    if (requestsLoading || isFetchingMore || !requestsData?.nextCursor) return

    setIsFetchingMore(true)
    setCursor(requestsData.nextCursor)

    setTimeout(() => {
      setIsFetchingMore(false)
    }, 1000)
  }

  return (
    <XStack
      flex={1}
      padding="$2" // Đổi thành $2 cho đồng bộ với các trang khác
      gap="$2"
      alignItems="stretch"
      {...(isWeb ? { height: '100vh' } : {})}
    >
      <YStack flex={1} gap="$4">
        {/* HEADER */}
        <ContactHeader
          title="Lời mời kết bạn"
          subtitle={`${requestsData?.items?.length ?? 0} lời mời`}
          onBackPath="/contacts"
          actionElement={
            isWeb ? (
              // Web: giữ Select như cũ
              <Select
                value={requestFilter}
                onValueChange={(val) => handleFilterChange(val as FriendRequestType)}
                disablePreventBodyScroll
              >
                <Select.Trigger width={180} borderRadius="$4" iconAfter={<ChevronDown size={16} />}>
                  <Select.Value placeholder="Chọn loại lời mời" />
                </Select.Trigger>
                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    <Select.Item index={0} value={FriendRequestType.PENDING}>
                      <Select.ItemText>Đã nhận</Select.ItemText>
                    </Select.Item>
                    <Select.Item index={1} value={FriendRequestType.SENT}>
                      <Select.ItemText>Đã gửi</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select>
            ) : (
              // Native: toggle gọn để tránh vỡ layout
              <XStack space="$2">
                <Button
                  size="$2"
                  borderRadius="$4"
                  themeInverse={requestFilter === FriendRequestType.PENDING}
                  variant={requestFilter === FriendRequestType.PENDING ? undefined : 'outlined'}
                  onPress={() => handleFilterChange(FriendRequestType.PENDING)}
                >
                  Đã nhận
                </Button>
                <Button
                  size="$2"
                  borderRadius="$4"
                  themeInverse={requestFilter === FriendRequestType.SENT}
                  variant={requestFilter === FriendRequestType.SENT ? undefined : 'outlined'}
                  onPress={() => handleFilterChange(FriendRequestType.SENT)}
                >
                  Đã gửi
                </Button>
              </XStack>
            )
          }
        />

        {/* NỘI DUNG DANH SÁCH LỜI MỜI */}
        <YStack
          flex={1}
          padding="$2"
          borderColor="$borderColor"
          borderRadius="$6"
          gap="$2"
        >
          {requestsError && <Text color="red" padding="$2">Lỗi tải dữ liệu</Text>}

          <FlatList
            style={{ flex: 1 }}
            data={requestsData?.items || []}
            keyExtractor={(request, index) => `${request.id}-${index}`}
            contentContainerStyle={{ gap: 12, padding: 8, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item: request }) => (
              <UserCard
                user={request}
                requestId={request.id}
                type={requestFilter}
                onAction={(action) => handleAction(action, request.id)}
              />
            )}
            ListEmptyComponent={
              requestsLoading ? (
                <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
                  <Spinner size="large" color="$blue10" />
                </YStack>
              ) : (
                <Text color="$color10" textAlign="center" marginTop="$10">
                  {requestFilter === FriendRequestType.SENT
                    ? 'Chưa gửi lời mời nào'
                    : 'Chưa có lời mời kết bạn nào đang chờ'}
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