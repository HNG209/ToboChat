'use client'

import React, { useState } from 'react'
import { YStack, XStack, H3, Text, Select, ScrollView, Button } from 'tamagui'
import { ChevronDown, ChevronLeft } from '@tamagui/lucide-icons'
import { ContactHeader, UserCard } from '@my/ui' 
import { useRouter } from 'solito/navigation'
// Import cái Type để mapping cho đúng logic của UserCard
import { FriendRequestType } from '../../types/Request' 

export default function GroupRequestPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('RECEIVED')

  const handleAction = async (action: string, id: string) => {
    console.log(`Hành động: ${action} trên ID: ${id}`)
    // Sau này gọi API xử lý lời mời nhóm ở đây
  }

  // Giả định dữ liệu mẫu để bạn thấy giao diện khi có item
  const data = {
    items: [
      { id: 'inv1', name: 'Cộng đồng React Việt', inviter: 'Nguyễn Văn A' },
      { id: 'inv2', name: 'Team Design UI/UX', inviter: 'Trần Thị B' }
    ]
  } 

  return (
    <XStack flex={1} height="100vh" padding="$4" gap="$4" alignItems="stretch">
      <YStack flex={1} gap="$4">
        
        {/* HEADER */}
        <ContactHeader
          title="Lời mời vào nhóm"
          subtitle={`${data?.items?.length ?? 0} lời mời`}
          onBackPath="/contact"
          actionElement={
            <Select value={filter} onValueChange={(val) => setFilter(val)}>
              <Select.Trigger width={180} borderRadius="$4" iconAfter={<ChevronDown size={16} />}>
                <Select.Value placeholder="Chọn loại" />
              </Select.Trigger>
              <Select.Content zIndex={200000}>
                <Select.Viewport>
                  <Select.Item index={0} value="RECEIVED">
                    <Select.ItemText>Lời mời đã nhận</Select.ItemText>
                  </Select.Item>
                  <Select.Item index={1} value="SENT">
                    <Select.ItemText>Yêu cầu đã gửi</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select>
          }
        />

        {/* DANH SÁCH NỘI DUNG */}
        <YStack flex={1} padding="$2" borderWidth={1} borderColor="$borderColor" borderRadius="$6">
          <ScrollView flex={1}>
            <YStack gap="$3" padding="$2">
              {data?.items?.map((item: any) => (
                <UserCard
                  key={item.id}
                  isGroup={true} // Bật chế độ hiển thị Nhóm
                  // Hiển thị thông tin người mời cho sinh động
                  description={filter === 'RECEIVED' ? `Người mời: ${item.inviter}` : 'Đang chờ duyệt'}
                  user={{
                    id: item.id,
                    name: item.name,
                    avatarUrl: ''
                  } as any}
                  // Mapping filter sang Type của UserCard để hiện đúng nút (Accept/Reject hoặc Cancel)
                  type={filter === 'RECEIVED' ? FriendRequestType.PENDING : FriendRequestType.SENT}
                  onAction={(action) => handleAction(action, item.id)}
                />
              ))}

              {data?.items?.length === 0 && (
                <Text color="$gray10" textAlign="center" marginTop="$10">
                  {filter === 'RECEIVED' 
                    ? 'Không có lời mời vào nhóm nào.' 
                    : 'Bạn chưa gửi yêu cầu gia nhập nhóm nào.'}
                </Text>
              )}
            </YStack>
          </ScrollView>
        </YStack>
      </YStack>
    </XStack>
  )
}