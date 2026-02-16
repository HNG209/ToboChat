import { Button, XStack } from '@my/ui'
import { Input } from '@my/ui'
import { YStack } from '@my/ui'
import { Search, UserPlus, Users } from '@tamagui/lucide-icons'

export default function SearchHeader() {
  return (
    <YStack padding="$3" space="$2" backgroundColor="$background">
      <XStack alignItems="center" space="$2">
        <XStack
          flex={1}
          // Sửa từ #eaedf0 sang token color bậc thấp
          backgroundColor="$color3"
          borderRadius={6}
          alignItems="center"
          paddingHorizontal="$2"
          height={37}
        >
          <Search size={16} color="$color10" />
          <Input
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            placeholder="Tìm kiếm"
            // Sửa màu placeholder để tự đổi theo theme
            placeholderTextColor="$color10"
            fontSize={13}
            height="100%"
            color="$color" // Thêm dòng này để chữ nhập vào cũng đổi màu
            focusStyle={{ outlineWidth: 0 }}
          />
        </XStack>

        <XStack space="$1">
          <Button
            size="$2"
            circular
            backgroundColor="transparent"
            // Dùng token $color thay vì mã màu cứng
            icon={<UserPlus size={18} color="$color" />}
            hoverStyle={{ backgroundColor: '$color4' }}
          />
          <Button
            size="$2"
            circular
            backgroundColor="transparent"
            icon={<Users size={18} color="$color" />}
            hoverStyle={{ backgroundColor: '$color4' }}
          />
        </XStack>
      </XStack>
    </YStack>
  )
}
