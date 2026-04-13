import React, { useState } from 'react'
import { Button, ScrollView, XStack, YStack } from 'tamagui'
import { Plus } from '@tamagui/lucide-icons'
import { useMedia } from 'tamagui'
import { ContactHeader, UserCard } from '@my/ui'

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
  const media = useMedia()
  const [keyword, setKeyword] = useState('')

  const filteredGroups = MOCK_GROUPS.filter((group) =>
    group.name.toLowerCase().includes(keyword.toLowerCase())
  )

  return (
    <YStack flex={1} padding="$3" gap="$4" backgroundColor="$background">
      <ContactHeader
        title="Danh sách nhóm"
        subtitle={`${MOCK_GROUPS.length} nhóm đã tham gia`}
        onBackPath="/contacts"
        actionElement={
          <XStack flexShrink={1}>
            <Button
              theme="blue"
              size={media.sm ? '$2' : '$3'}
              icon={<Plus size={18} />}
              borderRadius="$4"
            >
              {media.sm ? 'Tạo' : 'Tạo nhóm'}
            </Button>
          </XStack>
        }
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
          <YStack gap="$2" padding="$1">
            {filteredGroups.map((group) => (
              <UserCard
                key={group.id}
                isGroup
                description={`${group.members} thành viên`}
                user={
                  {
                    id: group.id,
                    name: group.name,
                    avatarUrl: '',
                  } as any
                }
                onAction={(action) => {
                  if (action === 'join') console.log('Đang vào nhóm:', group.name)
                }}
              />
            ))}
          </YStack>
        </ScrollView>
      </YStack>
    </YStack>
  )
}
