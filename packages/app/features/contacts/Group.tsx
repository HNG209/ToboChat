import React, { useState, useMemo } from 'react'
import { YStack, XStack, Input, Button, Text, Spinner, Separator } from 'tamagui'
import { Plus, Search } from '@tamagui/lucide-icons'
import { ContactHeader, UserCard } from '@my/ui'
import { Platform, FlatList } from 'react-native'
import { useGetJoinedRoomsQuery } from 'app/services/roomApi'
import { CreateGroupDialog } from '@my/ui/src/CreateGroupDialog'

export default function GroupPage() {
  const [keyword, setKeyword] = useState('')

  // State phục vụ phân trang
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  // State xử lý Modal tạo nhóm
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const isWeb = Platform.OS === 'web'

  const {
    data: groupsData,
    isLoading: groupsLoading,
    isError: groupsError,
  } = useGetJoinedRoomsQuery({
    status: 'ACTIVE',
    cursor,
    limit: 20
  })

  // Logic lọc tìm kiếm theo keyword ở client
  const filteredGroups = useMemo(() => {
    if (!groupsData?.items) return []

    return groupsData.items.filter((room) => {
      // 1. Chỉ lấy những room có type là 'GROUP'
      const isGroupType = room.roomType === 'GROUP'

      // 2. Kết hợp với điều kiện tìm kiếm từ khóa
      const matchesKeyword = room.roomName?.toLowerCase().includes(keyword.trim().toLowerCase())

      return isGroupType && matchesKeyword
    })
  }, [groupsData?.items, keyword])

  // Logic phân trang khi lướt đến cuối danh sách
  const handleFetchMore = () => {
    if (groupsLoading || isFetchingMore || !groupsData?.nextCursor) return

    setIsFetchingMore(true)
    setCursor(groupsData.nextCursor)

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
          title="Danh sách nhóm"
          subtitle={`${filteredGroups.length} nhóm`} // Đếm chuẩn theo số nhóm đã lọc
          onBackPath="/contacts"
          actionElement={
            <Button
              theme="blue"
              icon={<Plus size={18} />}
              borderRadius="$4"
              onPress={() => setIsCreateModalOpen(true)}
            >
              Tạo nhóm
            </Button>
          }
        />

        {/* TOOLBAR: SEARCH */}
        <XStack gap="$2" alignItems="center">
          <XStack flex={1} alignItems="center" borderWidth={1} borderColor="$borderColor" borderRadius="$4" paddingHorizontal="$3">
            <Search size={18} color="$color10" />
            <Input
              flex={1}
              borderWidth={0}
              backgroundColor="transparent"
              placeholder="Tìm kiếm tên nhóm..."
              value={keyword}
              onChangeText={setKeyword}
              focusStyle={{ outlineWidth: 0 }}
            />
          </XStack>
        </XStack>

        {/* NỘI DUNG DANH SÁCH NHÓM */}
        <YStack
          flex={1}
          padding="$2"
          borderColor="$borderColor"
          borderRadius="$6"
          gap="$2"
        >
          {groupsError && <Text color="red" padding="$2">Lỗi tải dữ liệu</Text>}

          {/* Đã thêm lại các props tối ưu cho FlatList trên mobile */}
          <FlatList
            style={{ flex: 1 }}
            data={filteredGroups}
            keyExtractor={(group) => group.id}
            contentContainerStyle={{ gap: 8, padding: 4, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item: group }) => (
              <UserCard
                isGroup={true}
                description={`${group.memberCount ?? 0} thành viên`}
                user={
                  {
                    id: group.id,
                    name: group.roomName,
                    avatarUrl: group.avatarUrl || '',
                  } as any
                }

              />
            )}
            ListEmptyComponent={
              groupsLoading ? (
                <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
                  <Spinner size="large" color="$blue10" />
                </YStack>
              ) : (
                <Text color="$color10" textAlign="center" marginTop="$10">
                  {keyword.trim() !== '' ? 'Không tìm thấy nhóm nào' : 'Bạn chưa tham gia nhóm nào'}
                </Text>
              )
            }
            ItemSeparatorComponent={() => <Separator borderColor="$borderColor" borderBottomWidth={1} />}

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

      <CreateGroupDialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </XStack>
  )
}