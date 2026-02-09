'use client'

import { Avatar, Button, Image, Paragraph, Text, XStack, YStack } from '@my/ui'
import { ArrowLeft, ChevronLeft, MoreVertical } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

export default function UserDetailScreen({ id }: { id: string }) {
  const router = useRouter()
  if (id) {
    return null
  }
  return (
    <YStack flex={1} bg="$background">

      {/* COVER */}
      <YStack position="relative">
        <Image
          source={{ uri: 'https://picsum.photos/800/400' }}
          height={220}
          width="100%"
        />

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

          <Button chromeless>
            <MoreVertical color="white" />
          </Button>
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
          Nguyễn Văn A
        </Text>

        <Text
          fontSize="$4"
          color="$color10"
          textAlign="center"
        >
          Sinh viên năm 4 · Yêu công nghệ · React Native 📱
        </Text>

        {/* ACTIONS */}
        <XStack space="$3" marginTop="$3">
          <Button size="$4" theme="active">
            Nhắn tin
          </Button>

          <Button size="$4" variant="outlined">
            Theo dõi
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}


