import React, { useState } from 'react'
import { YStack, XStack, Input, Button, H3, Text, ScrollView, Avatar } from 'tamagui'
import { Search, Plus, Users, ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation';

// Dữ liệu giả để hiển thị giao diện
const MOCK_GROUPS = [
  { id: '1', name: 'Nhóm Học Tập React Native', members: 12, lastMsg: 'Hôm nay có họp không mọi người?' },
  { id: '2', name: 'Dự án TOBOCHAT', members: 5, lastMsg: 'Đã cập nhật giao diện mới.' },
  { id: '3', name: 'Hội Game Thủ', members: 150, lastMsg: 'Tối nay 9h nhé!' },
]

export default function GroupPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('')

  return (
    <XStack flex={1} height="100vh" padding="$4" gap="$4" alignItems="stretch">
      <YStack flex={1} gap="$4">
        {/* HEADER */}
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
            icon={<ChevronLeft size={24} />}
            height = {40}
            width = {40}
            padding = {0}
            chromeless
            display="none" // Mặc định ẩn trên Desktop
            $sm={{ display: 'flex' }} // Chỉ hiện khi màn hình nhỏ
            onPress={() => router.push('/chat/friend')}
            paddingLeft={0}
            />
          <YStack flex={1}>
            <H3>Danh sách nhóm</H3>
            <Text color="$gray10" fontSize="$3">{MOCK_GROUPS.length} nhóm đã tham gia</Text>
          </YStack>
          
          <Button theme="blue" icon={<Plus size={18} />} borderRadius="$4">
            Tạo nhóm
          </Button>
        </XStack>

        {/* NỘI DUNG */}
        <YStack flex={1} padding="$2" borderWidth={1} borderColor="$borderColor" borderRadius="$6" gap="$2">
          {/* Search */}
          <XStack alignItems="center" paddingHorizontal="$3" marginBottom="$2" backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
            <Search size={18} color="$gray10" />
            <Input 
              flex={1} 
              borderWidth={0} 
              placeholder="Tìm kiếm nhóm..." 
              value={keyword} 
              onChangeText={setKeyword}
              backgroundColor="transparent"
            />
          </XStack>

          <ScrollView gap="$2" flex={1}>
            {MOCK_GROUPS.map((group) => (
              <XStack 
                key={group.id} 
                padding="$3" 
                backgroundColor="$background" 
                borderRadius="$4" 
                hoverStyle={{ backgroundColor: '$gray3' }}
                alignItems="center"
                gap="$3"
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
              >
                <Avatar circular size="$4">
                  <Avatar.Image src={`https://ui-avatars.com/api/?name=${group.name}&background=random`} />
                  <Avatar.Fallback backgroundColor="$gray5" />
                </Avatar>
                
                <YStack flex={1}>
                  <Text fontWeight="bold" fontSize="$4">{group.name}</Text>
                  <XStack alignItems="center" gap="$1">
                    <Users size={12} color="$gray10" />
                    <Text color="$gray10" fontSize="$2">{group.members} thành viên</Text>
                  </XStack>
                </YStack>
                
                <Button size="$2" variant="outline">Vào nhóm</Button>
              </XStack>
            ))}
          </ScrollView>
        </YStack>
      </YStack>
    </XStack>
  )
}