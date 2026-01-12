import React, { useState } from 'react'
import { YStack, Button, Text, H3, ScrollView, XStack, Separator, Theme } from 'tamagui'
import { Activity, RefreshCcw, CheckCircle, AlertCircle } from '@tamagui/lucide-icons'
import { useLazyGetProfileQuery } from '../../store/api' // Import hook Lazy
import { useDispatch } from 'react-redux'
// import { logout } from '../../store/authSlice'

export function TestRefreshScreen() {
  // Hook Lazy: Chỉ chạy khi gọi hàm trigger()
  const [trigger, { data, isLoading, isError, error, isSuccess, isFetching }] =
    useLazyGetProfileQuery()

  const [requestTime, setRequestTime] = useState<string>('')
  const dispatch = useDispatch()

  const handleCallApi = async () => {
    setRequestTime(new Date().toLocaleTimeString())
    try {
      // Gọi API /me
      console.log('--- Bắt đầu gọi API /me ---')
      await trigger(null)
    } catch (e) {
      console.log('Lỗi UI:', e)
    }
  }

  const handleLogout = () => {
    // dispatch(logout())
  }

  return (
    <Theme name="light">
      <YStack flex={1} bg="$background" pt="$8" px="$4" space="$4">
        <H3 textAlign="center">Test Refresh Token</H3>
        <Text textAlign="center" color="$color10">
          Mô phỏng: Đợi Access Token hết hạn rồi bấm nút dưới để xem App có tự động lấy Token mới
          không.
        </Text>

        <Separator />

        {/* NÚT BẤM GỌI API */}
        <Button
          size="$5"
          themeInverse
          onPress={handleCallApi}
          icon={isFetching ? <Activity className="spin" /> : <RefreshCcw />}
          disabled={isFetching}
        >
          {isFetching ? 'Đang gọi API...' : 'Gọi API /me'}
        </Button>

        {/* KHU VỰC HIỂN THỊ TRẠNG THÁI */}
        <YStack
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$4"
          p="$3"
          height={300}
          bg="$color2"
        >
          <ScrollView>
            <YStack space="$2">
              <XStack space="$2">
                <Text fontWeight="bold">Thời gian gọi:</Text>
                <Text>{requestTime || 'Chưa gọi'}</Text>
              </XStack>

              <XStack space="$2">
                <Text fontWeight="bold">Trạng thái:</Text>
                {isLoading ? (
                  <Text color="$yellow10">Loading...</Text>
                ) : isError ? (
                  <XStack space="$1" alignItems="center">
                    <AlertCircle size={16} color="red" />
                    <Text color="$red10">Thất bại (401/403/500)</Text>
                  </XStack>
                ) : isSuccess ? (
                  <XStack space="$1" alignItems="center">
                    <CheckCircle size={16} color="green" />
                    <Text color="$green10">Thành công (200 OK)</Text>
                  </XStack>
                ) : (
                  <Text>Đang chờ...</Text>
                )}
              </XStack>

              <Separator my="$2" />

              <Text fontWeight="bold" mb="$1">
                Kết quả JSON:
              </Text>
              {data ? (
                <Text fontSize="$2" color="$blue10">
                  {JSON.stringify(data, null, 2)}
                </Text>
              ) : error ? (
                <Text fontSize="$2" color="$red10">
                  {JSON.stringify(error, null, 2)}
                </Text>
              ) : (
                <Text color="$color8" fontStyle="italic">
                  Chưa có dữ liệu
                </Text>
              )}
            </YStack>
          </ScrollView>
        </YStack>

        <Button theme="red" variant="outlined" onPress={handleLogout} mt="$4">
          Đăng xuất (Xóa Redux State)
        </Button>
      </YStack>
    </Theme>
  )
}
