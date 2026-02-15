import { Button, Image, ListItem, Popover, Spacer, View, YStack } from '@my/ui'
import { Contact2, LogOut, MessageSquare, Settings, User } from '@tamagui/lucide-icons'
import { signOut } from 'aws-amplify/auth'
import { useState } from 'react'
import { useRouter } from 'solito/navigation'

export const ZaloSidebar = () => {
  const { push } = useRouter()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const handleGoToUser = () => {
    push(`/user/me`)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      setOpen(false)
      router.replace('/') // dùng replace để không back lại được
    } catch (err) {
      console.log('Logout error', err)
    }
  }
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
        <Button
          title="Hồ sơ"
          backgroundColor="transparent"
          onPress={() => handleGoToUser()}
          icon={<User size={24} color="white" />}
        />
        <Button
          title="Cài đặt"
          backgroundColor="transparent"
          icon={<Settings size={24} color="white" />}
        />
        <Popover open={open} onOpenChange={setOpen} placement="right">
          <Popover.Trigger asChild>
            <Button
              title="Đăng xuất"
              backgroundColor="transparent"
              icon={<LogOut size={24} color="white" />}
            />
          </Popover.Trigger>

          <Popover.Content elevate>
            <YStack width={160}>
              <Popover.Close asChild>
                <ListItem pressTheme icon={LogOut} title="Đăng xuất" onPress={handleLogout} />
              </Popover.Close>
            </YStack>
          </Popover.Content>
        </Popover>
      </YStack>
    </YStack>
  )
}
