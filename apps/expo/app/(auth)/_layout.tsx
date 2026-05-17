import React from 'react'
import { YStack } from 'tamagui'
import { Auth } from 'app/features/auth/Auth'
import { Slot } from 'expo-router'
export default function Layout() {
	return (
		<YStack flex={1} bg="$background" justifyContent="center" alignItems="center">
			{/* Cần truyền nội dung vào giữa hai thẻ Auth */}
			<Auth>
				<Slot /> {/* Nếu dùng Expo Router, Slot sẽ đại diện cho trang con hiện tại */}
			</Auth>
		</YStack>
	)
}

