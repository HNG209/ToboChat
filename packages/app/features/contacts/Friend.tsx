import React, { useEffect, useState } from 'react'
import { YStack, XStack, Input, Button, H3, Text, Image, ScrollView } from 'tamagui'
import { Search, ChevronLeft, Contact } from '@tamagui/lucide-icons'
import { useMedia } from 'tamagui'
import { ContactHeader, UserCard } from '@my/ui'
import { useRouter } from 'solito/navigation'
import { useGetMyFriendListQuery } from 'app/services/contactApi'
import { useLazyFindUserByEmailQuery } from 'app/services/userApi'

export default function Friend() {
  const [keyword, setKeyword] = useState('')

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

  return (
    <XStack flex={1} height="100vh" padding="$4" gap="$4" alignItems="stretch">
      <YStack flex={1} gap="$4">
        {/* HEADER */}
        <ContactHeader
          title="Danh sách bạn bè"
          subtitle={`${friendsData?.items?.length ?? 0} bạn bè`}
          onBackPath="/contacts"
        />

        {/* NỘI DUNG DANH SÁCH */}
        <YStack
          flex={1}
          padding="$2"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$6"
          gap="$2"
        >
          {/* Thanh Search tích hợp luôn vào trang List */}
          <XStack
            alignItems="center"
            paddingHorizontal="$3"
            marginBottom="$2"
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Search size={18} color="$gray10" />
            <Input
              flex={1}
              borderWidth={0}
              placeholder="Tìm kiếm bạn qua email..."
              value={keyword}
              onChangeText={setKeyword}
              backgroundColor="transparent"
            />
          </XStack>

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
              // Danh sách bạn bè
              <>
                {friendsLoading && <Text>Đang tải...</Text>}
                {friendsError && <Text color="red">Lỗi tải dữ liệu</Text>}
                {friendsData?.items?.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
                {!friendsLoading && (friendsData?.items?.length ?? 0) === 0 && (
                  <Text color="$gray10" textAlign="center" marginTop="$10">
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
