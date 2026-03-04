import { Button, Image, Spacer, View, YStack } from '@my/ui'
import {
  Briefcase,
  Cloud,
  Contact2,
  FolderOpen,
  MessageSquare,
  ScanLine,
  Settings2,
} from '@tamagui/lucide-icons'

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
      </View>

      {/* Icon Tin nhan */}

      <Button
        marginTop={20}
        size="$5"
        backgroundColor="#005ae0" // Màu xanh đậm hơn khi được chọn
        icon={<MessageSquare size={24} color="white" />}
        borderRadius={0} // Zalo thường dùng dạng khối vuông cho item đang chọn
      />
      <Button size="$5" backgroundColor="transparent" icon={<Contact2 size={24} color="white" />} />
      <Spacer flex={1} />

      <YStack space="$2" alignItems="center" paddingBottom="$4">
        <Button backgroundColor="transparent" icon={<Cloud size={24} color="white" />} />
        <Button backgroundColor="transparent" icon={<FolderOpen size={24} color="white" />} />
        <Button backgroundColor="transparent" icon={<ScanLine size={24} color="white" />} />
        <Button backgroundColor="transparent" icon={<Briefcase size={24} color="white" />} />
        <Button backgroundColor="transparent" icon={<Settings2 size={24} color="white" />} />
      </YStack>
    </YStack>
  )
}
