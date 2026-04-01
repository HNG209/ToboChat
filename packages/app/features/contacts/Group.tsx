import React, { useState } from 'react'
import { YStack, XStack, Input, Button, H3, Text, ScrollView, Avatar } from 'tamagui'
import { Search, Plus, Users, ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { ContactHeader, UserCard } from '@my/ui'

// Dữ liệu giả để hiển thị giao diện
const MOCK_GROUPS = [
  {
    id: '1',
    name: 'Nhóm Học Tập React Native',
    members: 12,
    lastMsg: 'Hôm nay có họp không mọi người?',
  },
  { id: '2', name: 'Dự án TOBOCHAT', members: 5, lastMsg: 'Đã cập nhật giao diện mới.' },
  { id: '3', name: 'Hội Game Thủ', members: 150, lastMsg: 'Tối nay 9h nhé!' },
]

export default function GroupPage() {
  const [keyword, setKeyword] = useState('')

  // Logic lọc tìm kiếm đơn giản cho Mock Data
  const filteredGroups = MOCK_GROUPS.filter((group) =>
    group.name.toLowerCase().includes(keyword.toLowerCase())
  )

  return (
    <XStack flex={1} height="100vh" padding="$4" gap="$4" alignItems="stretch">
      <YStack flex={1} gap="$4">
        {/* HEADER */}
        <ContactHeader
          title="Danh sách nhóm"
          subtitle={`${MOCK_GROUPS.length} nhóm đã tham gia`}
          onBackPath="/contacts"
          actionElement={
            <Button theme="blue" icon={<Plus size={18} />} borderRadius="$4">
              Tạo nhóm
            </Button>
          }
        />

        {/* NỘI DUNG */}
        <YStack
          flex={1}
          padding="$2"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$6"
          gap="$2"
        >
          <ScrollView flex={1}>
            <YStack gap="$2" padding="$1">
              {filteredGroups.map((group) => (
                <UserCard
                  key={group.id}
                  isGroup={true} // Báo cho component biết đây là Nhóm
                  description={`${group.members} thành viên`} // Đổ dữ liệu thành viên vào description
                  user={
                    {
                      id: group.id,
                      name: group.name,
                      avatarUrl: '', // Để trống để tự tạo avatar theo tên
                    } as any
                  }
                  onAction={(action) => {
                    if (action === 'join') console.log('Đang vào nhóm:', group.name) //cái join này để coi sau
                  }}
                />
              ))}
            </YStack>
          </ScrollView>
        </YStack>
      </YStack>
    </XStack>
  )
}
