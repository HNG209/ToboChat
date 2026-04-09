import React, { useEffect, useState } from 'react'
import { ScrollView, Text, XStack, YStack } from 'tamagui'
import { ContactHeader, UserCard } from '@my/ui'
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

  useEffect(() => {
    if (!keyword.trim()) return
    const timeout = setTimeout(() => findUser({ email: keyword, limit: 10 }), 400)
    return () => clearTimeout(timeout)
  }, [keyword, findUser])

  return (
    <YStack flex={1} padding="$3" gap="$4" backgroundColor="$background">
      <ContactHeader
        title="Danh sách bạn bè"
        subtitle={`${friendsData?.items?.length ?? 0} bạn bè`}
        onBackPath="/contacts"
      />

      <YStack
        flex={1}
        padding="$2"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$6"
        gap="$2"
      >
        <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 12 }}>
          {keyword.trim() !== '' ? (
            <>
              {searchLoading && <Text>Đang tìm...</Text>}
              {searchData?.items?.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </>
          ) : (
            <>
              {friendsLoading && <Text>Đang tải...</Text>}
              {friendsError && <Text color="red">Lỗi tải dữ liệu</Text>}
              {friendsData?.items?.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
              {!friendsLoading && (friendsData?.items?.length ?? 0) === 0 && (
                <XStack justifyContent="center" paddingVertical="$6">
                  <Text color="$color10" textAlign="center">
                    Chưa có bạn bè nào
                  </Text>
                </XStack>
              )}
            </>
          )}
        </ScrollView>
      </YStack>
    </YStack>
  )
}
