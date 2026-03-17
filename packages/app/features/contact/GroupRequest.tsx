'use client'

import React, { useState } from 'react'
import { YStack, XStack, H3, Text, Select, ScrollView, Button } from 'tamagui'
import { ChevronDown, ChevronLeft } from '@tamagui/lucide-icons'
// Giả định bạn sẽ dùng UserCard hoặc một component GroupCard tương tự trong @my/ui
import { UserCard } from '@my/ui' 
import { useRouter } from 'solito/navigation'

// Lưu ý: Sau này bạn sẽ thêm các Hook API của Group vào đây
// Ví dụ: useGetGroupInvitesQuery, useRespondGroupInviteMutation...

export default function GroupRequestPage() {
  const router = useRouter();
  // 1. Quản lý bộ lọc (Ví dụ: 'RECEIVED' là lời mời mình nhận, 'SENT' là yêu cầu mình xin gia nhập)
  const [filter, setFilter] = useState('RECEIVED')

  // 2. Placeholder cho các hàm xử lý API sau này
  const handleAction = async (action: 'accept' | 'reject' | 'cancel', id: string) => {
    console.log(`Thực hiện ${action} cho group invite id: ${id}`)
    // Logic gọi API sẽ nằm ở đây
  }

  // 3. Giả định dữ liệu (Sau này thay bằng data từ API)
  const data = { items: [] } // Hiện tại để trống theo yêu cầu của bạn
  const isLoading = false
  const error = null

  return (
    <XStack flex={1} height="100vh" padding="$4" gap="$4" alignItems="stretch">
      <YStack flex={1} gap="$4">
        
        {/* HEADER: Giống hệt trang Friend Request */}
        <XStack
          alignItems="center"
          padding="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$6"
          backgroundColor="$background"
          gap="$3"
          justifyContent="space-between"
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
            <H3>Lời mời vào nhóm</H3>
            <Text color="$gray10" fontSize="$3">
              {data?.items?.length ?? 0} lời mời
            </Text>
          </YStack>

          {/* BỘ LỌC SELECT: Đồng nhất UI */}
          <Select
            value={filter}
            onValueChange={(val) => setFilter(val)}
            disablePreventBodyScroll
          >
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
        </XStack>

        {/* DANH SÁCH NỘI DUNG: Đồng nhất với khung chứa của Friend Request */}
        <YStack
          flex={1}
          padding="$2"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$6"
          gap="$2"
        >
          <ScrollView flex={1}>
            <YStack gap="$3" padding="$2">
              {isLoading && <Text textAlign="center" marginTop="$4">Đang tải...</Text>}
              
              {error && (
                <Text color="$red10" textAlign="center" marginTop="$4">
                  Có lỗi xảy ra khi tải danh sách.
                </Text>
              )}

              {/* Map dữ liệu (Sau này khi có API bạn chỉ cần mở ra) */}
              {data?.items?.map((item: any) => (
                <UserCard
                  key={item.id}
                  user={item} // Hoặc GroupCard tùy bạn thiết kế
                  onAction={(action) => handleAction(action as any, item.id)}
                />
              ))}

              {/* Trạng thái trống */}
              {!isLoading && data?.items?.length === 0 && (
                <Text color="$gray10" textAlign="center" marginTop="$10">
                  {filter === 'RECEIVED' 
                    ? 'Không có lời mời vào nhóm nào đang chờ.' 
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