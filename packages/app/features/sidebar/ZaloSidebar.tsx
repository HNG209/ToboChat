import { Image, View, YStack } from '@my/ui'
import { Space } from '@tamagui/lucide-icons'

export const ZaloSidebar = () => {
  return (
    <YStack
      width={64}
      height="100vh"
      backgroundColor="#006aff" // Màu xanh đặc trưng của Zalo
      alignItems="center"
      paddingVertical="$4"
    >
      {/* Avatar */}

      <View
        width={45}
        height={45}
        borderRadius={100}
        borderWidth={1}
        borderColor="rgba(255,255,255,0.3)"
        overflow="hidden"
      >
        <Image source={{ uri: 'https://your-avatar-link.png', width: 45, height: 45 }} />

        <Space size="$2" />

        {/* Icon Tin nhan */}
      </View>
    </YStack>
  )
}
