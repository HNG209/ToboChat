import { Button, Input, XStack, YStack } from '@my/ui'
import { Search, UserPlus, Users } from '@tamagui/lucide-icons'

export default function SearchHeader() {
  return (
    <YStack padding="$3" backgroundColor="white" space="$2">
      {/* Container chính chứa Search và Icons */}
      <XStack alignItems="center" space="$2">
        {/* Thanh Search bọc trong 1 XStack để giả Input Group */}
        <XStack
          flex={1}
          backgroundColor="#eaedf0" // Màu xám nhạt đặc trưng của Zalo
          borderRadius={6}
          alignItems="center"
          paddingHorizontal="$2"
          height={32}
        >
          <Search size={16} color="#65717e" />
          <Input
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            placeholder="Tìm kiếm"
            placeholderTextColor="#65717e"
            fontSize={13}
            height="100%"
            focusStyle={{ outlineWidth: 0 }}
          />
        </XStack>

        {/* Cụm icon chức năng bên phải */}
        <XStack space="$1">
          <Button
            size="$2"
            circular
            backgroundColor="transparent"
            icon={<UserPlus size={18} color="#404e5a" />}
            hoverStyle={{ backgroundColor: '#dfe2e7' }}
          />
          <Button
            size="$2"
            circular
            backgroundColor="transparent"
            icon={<Users size={18} color="#404e5a" />}
            hoverStyle={{ backgroundColor: '#dfe2e7' }}
          />
        </XStack>
      </XStack>
    </YStack>
  )
}
