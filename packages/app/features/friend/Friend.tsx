import React, { useEffect, useState } from 'react'
import { YStack, XStack, Input, Button, H3, Text, Select, Image, Sheet } from 'tamagui'
import { Search, ChevronDown, ChevronLeft } from '@tamagui/lucide-icons'
import { useMedia } from 'tamagui'
import { UserCard } from '@my/ui'
import { UserSimpleCard } from '@my/ui'
import {
  useGetMyFriendListQuery,
  useLazyFindUserByEmailQuery,
  useGetMyFriendRequestsQuery,
  useSendFriendRequestMutation,
  useCancelFriendRequestMutation,
  useRespondFriendRequestMutation,
} from '../../store/api'
import { FriendRequestType } from '../../types/Request'
type TabType = 'FriendList' | 'FriendRequest'

export default function Friend() {
  const [activeTab, setActiveTab] = useState<TabType>('FriendList')
  const [requestFilter, setRequestFilter] = useState<FriendRequestType>(FriendRequestType.PENDING)
  const [searchFocus, setSearchFocus] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [showSidebarSheet, setShowSidebarSheet] = useState(false)
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())

  const [sendFriendRequest] = useSendFriendRequestMutation()
  const [cancelFriendRequest] = useCancelFriendRequestMutation()
  const [respondFriendRequest] = useRespondFriendRequestMutation()

  const media = useMedia()

  // Luôn fetch danh sách lời mời ĐÃ GỬI để đồng bộ trạng thái cho search
  const { data: sentData } = useGetMyFriendRequestsQuery(
    { type: FriendRequestType.SENT, limit: 100 },
    { skip: false }
  )

  // Đồng bộ sentRequests từ server
  useEffect(() => {
    if (sentData?.items) {
      const ids = sentData.items.map((req) => req.id).filter(Boolean) as string[]

      setSentRequests(new Set(ids))
    }
  }, [sentData])

  useEffect(() => {
    if (!media.sm) {
      setShowSidebarSheet(false)
    }
  }, [media.sm])

  const {
    data: friendsData,
    isLoading: friendsLoading,
    error: friendsError,
  } = useGetMyFriendListQuery({ limit: 10 })

  const [findUser, { data: searchData, isLoading: searchLoading, error: searchError }] =
    useLazyFindUserByEmailQuery()

  useEffect(() => {
    if (!keyword.trim()) return
    const timeout = setTimeout(() => findUser({ email: keyword, limit: 10 }), 400)
    return () => clearTimeout(timeout)
  }, [keyword, findUser])

  const hasKeyword = keyword.trim() !== ''
  const hasResults = hasKeyword && !searchLoading && (searchData?.items?.length ?? 0) > 0
  const noResults = hasKeyword && !searchLoading && (searchData?.items?.length ?? 0) === 0

  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
  } = useGetMyFriendRequestsQuery(
    { type: requestFilter, limit: 10 },
    { skip: activeTab !== 'FriendRequest' }
  )

  return (
    <>
      <XStack flex={1} height="100vh" padding="$4" gap="$4" alignItems="stretch">
        {/* BOX PHẢI */}
        <YStack flex={1} gap="$4">
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
              size="$3"
              circular
              display={media.sm ? 'flex' : 'none'}
              onPress={() => setShowSidebarSheet(true)}
            >
              <ChevronLeft size={20} />
            </Button>

            <YStack flex={1}>
              <H3>{activeTab === 'FriendList' ? 'Danh sách bạn bè' : 'Lời mời kết bạn'}</H3>
              <Text color="$gray10" fontSize="$3">
                {activeTab === 'FriendList'
                  ? (friendsData?.items?.length ?? 0)
                  : (requestsData?.items?.length ?? 0)}{' '}
                {activeTab === 'FriendList' ? 'bạn bè' : 'lời mời'}
              </Text>
            </YStack>
          </XStack>

          <YStack
            flex={1}
            padding="$2"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$6"
            gap="$2"
          >
            {activeTab === 'FriendRequest' && (
              <Select
                value={requestFilter}
                onValueChange={(val) => setRequestFilter(val as FriendRequestType)}
                disablePreventBodyScroll
              >
                <Select.Trigger width={200} borderRadius="$4" iconAfter={<ChevronDown size={16} />}>
                  <Select.Value placeholder="Chọn loại lời mời" />
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    <Select.Item index={0} value={FriendRequestType.PENDING}>
                      <Select.ItemText>Đã gửi</Select.ItemText>
                    </Select.Item>
                    <Select.Item index={1} value={FriendRequestType.SENT}>
                      <Select.ItemText>Đang chờ</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select>
            )}

            <YStack gap="$3" flex={1} overflow="auto">
              {activeTab === 'FriendList' && (
                <>
                  {friendsLoading && <Text>Đang tải...</Text>}
                  {friendsError && <Text color="red">{JSON.stringify(friendsError)}</Text>}
                  {friendsData?.items?.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                  {!friendsLoading && (friendsData?.items?.length ?? 0) === 0 && (
                    <Text color="$gray10" textAlign="center">
                      Chưa có bạn bè nào
                    </Text>
                  )}
                </>
              )}

              {activeTab === 'FriendRequest' && (
                <>
                  {requestsLoading && <Text>Đang tải...</Text>}
                  {requestsError && <Text color="red">{JSON.stringify(requestsError)}</Text>}
                  {requestsData?.items?.map((request, index) => {
                    return (
                      <UserCard
                        key={`${request.id}-${index}`}
                        user={request}
                        requestId={request.id}
                        type={requestFilter}
                        onAction={async (action) => {
                          const targetId = request.id

                          try {
                            if (action === 'accept') {
                              await respondFriendRequest({
                                otherId: targetId,
                                accepted: true,
                              }).unwrap()
                            }

                            if (action === 'reject') {
                              await respondFriendRequest({
                                otherId: targetId,
                                accepted: false,
                              }).unwrap()
                            }

                            if (action === 'cancel') {
                              await cancelFriendRequest({ otherId: targetId }).unwrap()
                            }
                          } catch (err) {
                            console.error('API error:', err)
                          }
                        }}
                      />
                    )
                  })}

                  {!requestsLoading && (requestsData?.items?.length ?? 0) === 0 && (
                    <Text color="$gray10" textAlign="center">
                      {requestFilter === FriendRequestType.SENT
                        ? 'Chưa gửi lời mời nào'
                        : 'Chưa có lời mời kết bạn nào đang chờ'}
                    </Text>
                  )}
                </>
              )}
            </YStack>
          </YStack>
        </YStack>
      </XStack>

      {/* Sheet sidebar mobile */}
      <Sheet
        open={showSidebarSheet}
        onOpenChange={setShowSidebarSheet}
        snapPoints={['90%']}
        position={0}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame padding="$4">
          <YStack flex={1} gap="$3">
            <XStack
              alignItems="center"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              paddingHorizontal="$3"
              backgroundColor="$background"
              focusWithinStyle={{
                borderColor: '$blue10',
                shadowColor: '$blue7',
                shadowOpacity: 0.25,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Search size={20} color="$gray10" />
              <Input
                flex={1}
                borderWidth={0}
                backgroundColor="transparent"
                placeholder="Tìm kiếm bạn bè qua email..."
                fontSize="$2"
                height={30}
                value={keyword}
                onChangeText={setKeyword}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
                outlineStyle="none"
                focusStyle={{ outlineWidth: 0 }}
              />
            </XStack>

            <Button
              justifyContent="flex-start"
              theme={activeTab === 'FriendList' ? 'blue' : undefined}
              onPress={() => {
                setActiveTab('FriendList')
                setShowSidebarSheet(false)
              }}
            >
              Danh sách bạn bè
            </Button>

            <Button
              justifyContent="flex-start"
              theme={activeTab === 'FriendRequest' ? 'blue' : undefined}
              onPress={() => {
                setActiveTab('FriendRequest')
                setShowSidebarSheet(false)
              }}
            >
              Lời mời kết bạn
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
}
