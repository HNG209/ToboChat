import React, { useEffect, useState } from 'react'
import { YStack, XStack, Input, Button, H3, Text, Image, ScrollView } from 'tamagui'
import { Search, ChevronLeft, Contact, ArrowDownUp } from '@tamagui/lucide-icons'
import { useMedia } from 'tamagui'
import { ContactHeader, UserCard } from '@my/ui'
import { useRouter } from 'solito/navigation'
import { useGetMyFriendListQuery } from 'app/services/contactApi'
import { useLazyFindUserByEmailQuery } from 'app/services/userApi'
import { Platform } from 'react-native'

export default function Friend() {
  const [keyword, setKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' | 'desc'

  const {
    data: friendsData,
    isLoading: friendsLoading,
    error: friendsError,
  } = useGetMyFriendListQuery({ limit: 10 })

  const [findUser, { data: searchData, isLoading: searchLoading }] = useLazyFindUserByEmailQuery()

  // Logic Search Debounce
  useEffect(() => {
    if (!keyword.trim()) return
    const timeout = setTimeout(() => findUser({ email: keyword, limit: 10 }), 400)
    return () => clearTimeout(timeout)
  }, [keyword, findUser])

  const isWeb = Platform.OS === 'web'

  // Logic Sắp xếp danh sách bạn bè
  const sortedFriends = React.useMemo(() => {
    if (!friendsData?.items) return []
    return [...friendsData.items].sort((a, b) => {
      const nameA = a.name || a.email || ''
      const nameB = b.name || b.email || ''
      return sortOrder === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    })
  }, [friendsData?.items, sortOrder])

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
          <ScrollView gap="$3" flex={1}>
            {keyword.trim() !== '' ? (
              // Kết quả Search
              <>
                {searchLoading && <Text>Đang tìm...</Text>}
                {searchData?.items?.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </>
            ) : (
              // Danh sách bạn bè đã sắp xếp
              <>
                {friendsLoading && <Text>Đang tải...</Text>}
                {friendsError && <Text color="red">Lỗi tải dữ liệu</Text>}
                {sortedFriends.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
                {!friendsLoading && sortedFriends.length === 0 && (
                  <Text color="$color10" textAlign="center" marginTop="$10">
                    Chưa có bạn bè nào
                  </Text>
                )}
              </>
            )}
          </ScrollView>
        </YStack>
      </YStack>
    </XStack>
  )
}