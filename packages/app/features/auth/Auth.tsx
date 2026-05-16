import React, { useEffect } from 'react'
import { YStack, Card, H3, Image, Paragraph, View, Separator } from 'tamagui'
import { getCurrentUser } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'

import { SignInForm } from './SignInForm'

export function Auth() {
  const router = useRouter()

  useEffect(() => {
    void getCurrentUser()
      .then(() => router.replace('/chat'))
      .catch(() => undefined)
  }, [router])

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" bg="$background" p="$4">
      <Card
        elevate
        bordered
        width="100%"
        maxWidth={1000}
        flexDirection="row"
        overflow="hidden"
        borderRadius="$8"
        bg="$color1"
        shadowColor="$shadowColor"
        shadowOpacity={0.1}
        shadowRadius={20}
        // FIX 1: Cố định chiều cao tối thiểu cho toàn bộ Card
        minHeight={650}
      >
        {/* PHẦN BÊN TRÁI: Branding */}
        <YStack
          width="60%"
          bg="$blue10"
          justifyContent="center"
          alignItems="center"
          p="$10"
          $sm={{ display: 'none' }}
          position="relative"
        >
          <View
            position="absolute"
            width={300}
            height={300}
            bg="white"
            opacity={0.05}
            borderRadius={150}
            top={-100}
            left={-100}
          />

          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/295/295128.png' }}
            width={100}
            height={100}
          />
          <H3 color="white" mt="$5" fontWeight="900" fontSize="$9" letterSpacing={1}>
            ToboChat
          </H3>
          <Separator borderBottomWidth={2} borderColor="white" width={40} my="$4" opacity={0.5} />
          <Paragraph color="white" opacity={0.8} textAlign="center" lineHeight={24} px="$6">
            Giải pháp giao tiếp đa nền tảng, tối ưu cho quy trình làm việc của lập trình viên.
          </Paragraph>
        </YStack>

        <YStack
          width="40%"
          $sm={{ width: '100%' }}
          p="$7"
          justifyContent="center"
          bg="$color1"
        >


          <View minHeight={350} justifyContent="flex-start">
            <SignInForm />
          </View>
        </YStack>
      </Card>
    </YStack>
  )
}