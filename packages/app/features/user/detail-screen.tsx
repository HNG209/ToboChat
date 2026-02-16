'use client'

import { Avatar, Button, Image, Popover, Text, XStack, YStack } from '@my/ui'
import { ArrowLeft, MoreVertical } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

import { useGetProfileQuery } from '../../store/api'
// Su dung cho dang xuat
import { LogOut } from '@tamagui/lucide-icons'
import { ListItem, Separator } from '@my/ui'

import { useState } from 'react'
import { signOut } from 'aws-amplify/auth'

export default function UserDetailScreen({ id }: { id?: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // id	          API gọi
  // undefined	  /users/me
  // "abc123"	    /users/abc123
  const { data } = useGetProfileQuery(id)

  const handleLogout = async () => {
    try {
      await signOut()
      setOpen(false)
      router.replace('/')
    } catch (err) {
      console.log('Logout error', err)
    }
  }

  return (
    <YStack flex={1}>
      {/* COVER */}
      <YStack position="relative">
        <Image source={{ uri: 'https://picsum.photos/800/400' }} height={220} width="100%" />

        {/* HEADER ICONS */}
        <XStack
          position="absolute"
          top={40}
          left={0}
          right={0}
          paddingHorizontal="$4"
          justifyContent="space-between"
          alignItems="center"
        >
          <Button chromeless onPress={() => router.back()}>
            <ArrowLeft color="white" />
          </Button>

          {/* SỬ DỤNG POPOVER TẠI ĐÂY */}
          <Popover size="$5" allowFlip placement="bottom-end">
            <Popover.Trigger asChild>
              <Button chromeless icon={MoreVertical} color="white" />
            </Popover.Trigger>

            <Popover.Content elevate>
              <YStack width={200}>
                {/* Option 1: Bọc ListItem trong Popover.Close */}
                <Popover.Close asChild>
                  <ListItem pressTheme icon={LogOut} title="Đăng xuất" onPress={handleLogout} />
                </Popover.Close>

                <Separator />

                {/* Option 2: Nút Hủy */}
                <Popover.Close asChild>
                  <ListItem pressTheme title="Hủy" />
                </Popover.Close>
              </YStack>
            </Popover.Content>
          </Popover>
        </XStack>

        {/* AVATAR */}
        <Avatar
          size="$10"
          circular
          position="absolute"
          bottom={-50}
          left="50%"
          transform={[{ translateX: -50 }]}
          borderWidth={4}
          borderColor="white"
        >
          <Avatar.Image src="https://i.pravatar.cc/300" />
        </Avatar>
      </YStack>

      {/* INFO CARD */}
      <YStack
        marginTop={60}
        padding="$4"
        space="$3"
        alignItems="center"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Text fontSize="$8" fontWeight="700">
          {data?.result?.name ?? 'No name'}
        </Text>

        <Text fontSize="$4" color="$color10" textAlign="center">
          Sinh viên năm 4 · Yêu công nghệ · React Native 📱
        </Text>

        {/* ACTIONS */}
        <XStack space="$3" marginTop="$3">
          <Button size="$4" theme="active">
            Ket Ban
          </Button>

          <Button size="$4" variant="outlined">
            Nhan tin
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}
