import React from 'react'
import { YStack } from 'tamagui'
import { Auth } from 'app/features/auth/Auth'

export default function Layout() {
	return (
		<YStack flex={1} bg="$background" justifyContent="center" alignItems="center">
			<Auth />
		</YStack>
	)
}

