import React, { useEffect, useState, useMemo } from 'react'
import { YStack, XStack, Input, Button, Text, Spinner, Separator } from 'tamagui'
import { Search, ArrowDownUp } from '@tamagui/lucide-icons'
import { ContactHeader, UserCard } from '@my/ui'
import { Platform, FlatList } from 'react-native'
import { useGetMyFriendListQuery } from 'app/services/contactApi'
import { useLazyFindUserByEmailQuery } from 'app/services/userApi'

export default function Friend() {
  const [keyword, setKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' | 'desc'

  // State phục vụ phân trang
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const isWeb = Platform.OS === 'web'

  // Thêm cursor vào query lấy danh sách bạn bè
  const {
    data: friendsData,
    isLoading: friendsLoading,
    error: friendsError,
  } = useGetMyFriendListQuery({ limit: 10, cursor })

  const [findUser, { data: searchData, isLoading: searchLoading }] = useLazyFindUserByEmailQuery()

  // Logic Search Debounce
  useEffect(() => {
    if (!keyword.trim()) return
    const timeout = setTimeout(() => findUser({ email: keyword, limit: 10 }), 400)
    return () => clearTimeout(timeout)
  }, [keyword, findUser])

  // Logic Sắp xếp danh sách bạn bè
  const sortedFriends = useMemo(() => {
    if (!friendsData?.items) return []
    return [...friendsData.items].sort((a, b) => {
      const nameA = a.name || ''
      const nameB = b.name || ''
      return sortOrder === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    })
  }, [friendsData?.items, sortOrder])

  // Xác định dữ liệu nào sẽ được truyền vào FlatList
  const isSearching = keyword.trim() !== ''
  const listData = isSearching ? (searchData?.items || []) : sortedFriends

  // Logic phân trang khi lướt đến cuối danh sách (chỉ áp dụng khi không search)
  const handleFetchMore = () => {
    if (isSearching || friendsLoading || isFetchingMore || !friendsData?.nextCursor) return

    setIsFetchingMore(true)
    setCursor(friendsData.nextCursor)

    setTimeout(() => {
      setIsFetchingMore(false)
    }, 1000)
  }

  return (
    <XStack
      flex={1}
      padding="$2"
      gap="$2"
      alignItems="stretch"
      {...(isWeb ? { height: '100vh' } : {})}
    >
      <YStack flex={1} gap="$4">
        {/* HEADER */}
        <ContactHeader
          title="Danh sách bạn bè"
          subtitle={`${friendsData?.items?.length ?? 0} bạn bè`}
          onBackPath="/contacts"
        />

        {/* TOOLBAR: SEARCH & SORT */}
        <XStack gap="$2" alignItems="center">
          <XStack flex={1} alignItems="center" borderWidth={1} borderColor="$borderColor" borderRadius="$4" paddingHorizontal="$3">
            <Search size={18} color="$color10" />
            <Input
              flex={1}
              borderWidth={0}
              backgroundColor="transparent"
              placeholder="Tìm kiếm bằng email..."
              value={keyword}
              onChangeText={setKeyword}
              focusStyle={{ outlineWidth: 0 }}
            />
          </XStack>

          <Button
            icon={ArrowDownUp}
            size="$3"
            onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </Button>
        </XStack>

        {/* NỘI DUNG DANH SÁCH */}
        <YStack
          flex={1}
          padding="$2"
          borderColor="$borderColor"
          borderRadius="$6"
          gap="$2"
        >
          {friendsError && !isSearching && <Text color="red" padding="$2">Lỗi tải dữ liệu</Text>}

          <FlatList
            style={{ flex: 1 }}
            data={listData}
            keyExtractor={(user) => user.id}
            contentContainerStyle={{ gap: 8, padding: 4, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item: user }) => (
              <UserCard user={user} />
            )}
            ListEmptyComponent={
              (isSearching ? searchLoading : friendsLoading) ? (
                <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
                  <Spinner size="large" color="$blue10" />
                </YStack>
              ) : (
                <Text color="$color10" textAlign="center" marginTop="$10">
                  {isSearching ? 'Không tìm thấy người dùng nào' : 'Chưa có bạn bè nào'}
                </Text>
              )
            }
            onEndReached={handleFetchMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingMore && !isSearching ? (
                <YStack padding="$4" alignItems="center">
                  <Spinner size="small" color="$blue10" />
                </YStack>
              ) : null
            }
            ItemSeparatorComponent={() => <Separator borderColor="$borderColor" borderBottomWidth={1} />}
          />
        </YStack>
      </YStack>
    </XStack>
  )
}