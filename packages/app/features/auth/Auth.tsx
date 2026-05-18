import React, { useEffect, useState } from 'react'
import { YStack, Card, H3, Image, Paragraph, View, Separator, useMedia } from 'tamagui'
import { getCurrentUser } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'
import { ReactNode } from 'react'

export function Auth({ children }: { children?: ReactNode }) {
  const router = useRouter()
  const media = useMedia()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    void getCurrentUser()
      .then(() => {
        router.replace('/chat')
      })
      .catch(() => undefined)
      .finally(() => setCheckingSession(false))
  }, [router])

  if (checkingSession) return null

  // NẾU LÀ MOBILE: Trả về layout tràn màn hình đơn giản, sạch sẽ, không dùng Card bọc bị ép kích thước
  if (media.sm) {
    return (
      <YStack flex={1} bg="$color1" justifyContent="center" p="$5" width="100%">
        <YStack width="100%" maxWidth={400} alignSelf="center">
          {children}
        </YStack>
      </YStack>
    )
  }

  // NẾU LÀ DESKTOP: Giữ nguyên layout 2 cột xịn sò
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
        minHeight={650}
      >
        {/* CỘT TRÁI (LOGO) */}
        <YStack
          width="60%"
          bg="$blue10"
          justifyContent="center"
          alignItems="center"
          p="$10"
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

        {/* CỘT PHẢI (FORM) */}
        <YStack
          width="40%"
          p="$7"
          justifyContent="center"
          alignItems="center"
          bg="$color1"
        >
          <View width="100%">
            {children}
          </View>
        </YStack>
      </Card>
    </YStack>
  )
}