import React, { useState, useMemo } from 'react'
import { YStack, XStack, Input, Button, Text, Spinner, Separator } from 'tamagui'
import { Search, ArrowDownUp } from '@tamagui/lucide-icons'
import { ContactHeader, UserCard } from '@my/ui'
import { Platform, FlatList } from 'react-native'
import { useGetMyFriendListQuery } from 'app/services/contactApi'

export default function Friend() {
  const [keyword, setKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const isWeb = Platform.OS === 'web'

  const {
    data: friendsData,
    isLoading: friendsLoading,
    error: friendsError,
  } = useGetMyFriendListQuery({ limit: 10, cursor })

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

  const filteredFriends = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    if (!search) return sortedFriends

    return sortedFriends.filter((friend) => {
      const name = friend.name?.toLowerCase() || ''
      const email = friend.email?.toLowerCase() || ''

      return name.includes(search) || email.includes(search)
    })
  }, [sortedFriends, keyword])

  const isSearching = keyword.trim() !== ''
  const listData = filteredFriends

  const handleFetchMore = () => {
    if (
      isSearching ||
      friendsLoading ||
      isFetchingMore ||
      !friendsData?.nextCursor
    ) {
      return
    }

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
        <ContactHeader
          title="Danh sách bạn bè"
          subtitle={`${friendsData?.items?.length ?? 0} bạn bè`}
          onBackPath="/contacts"
        />

        <XStack gap="$2" alignItems="center">
          <XStack
            flex={1}
            alignItems="center"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$3"
          >
            <Search size={18} color="$color10" />

            <Input
              flex={1}
              borderWidth={0}
              backgroundColor="transparent"
              placeholder="Tìm kiếm bạn bè..."
              value={keyword}
              onChangeText={setKeyword}
              focusStyle={{ outlineWidth: 0 }}
            />
          </XStack>

          <Button
            icon={ArrowDownUp}
            size="$3"
            onPress={() =>
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
          >
            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </Button>
        </XStack>

        <YStack
          flex={1}
          padding="$2"
          borderColor="$borderColor"
          borderRadius="$6"
          gap="$2"
        >
          {friendsError && !isSearching && (
            <Text color="red" padding="$2">
              Lỗi tải dữ liệu
            </Text>
          )}

          <FlatList
            style={{ flex: 1 }}
            data={listData}
            keyExtractor={(user) => user.id}
            contentContainerStyle={{
              gap: 8,
              padding: 4,
              paddingBottom: 24,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item: user }) => <UserCard user={user} />}
            ListEmptyComponent={
              friendsLoading ? (
                <YStack
                  flex={1}
                  justifyContent="center"
                  alignItems="center"
                  padding={20}
                >
                  <Spinner size="large" color="$blue10" />
                </YStack>
              ) : (
                <Text color="$color10" textAlign="center" marginTop="$10">
                  {isSearching
                    ? 'Không tìm thấy bạn bè trong danh sách hiện tại'
                    : 'Chưa có bạn bè nào'}
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
            ItemSeparatorComponent={() => (
              <Separator
                borderColor="$borderColor"
                borderBottomWidth={1}
              />
            )}
          />
        </YStack>
      </YStack>
    </XStack>
  )
}