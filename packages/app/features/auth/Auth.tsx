import React, { useState, useEffect } from 'react'
import { YStack, XStack, Card, H3, Image, Paragraph, View, Separator } from 'tamagui'
import { getCurrentUser } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'

import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export function Auth() {
  const [mode, setMode] = useState<'SIGNIN' | 'SIGNUP' | 'FORGOT'>('SIGNIN')
  const router = useRouter()

  useEffect(() => {
    getCurrentUser()
      .then(() => router.replace('/chat'))
      .catch(() => { })
  }, [])// Hàm render tiêu đề động
  const getTitle = () => {
    if (mode === 'SIGNIN') return 'Đăng nhập'
    if (mode === 'SIGNUP') return 'Tạo tài khoản'
    return 'Quên mật khẩu'
  }
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
          // FIX 2: Thay vì flex, ta dùng width phần trăm cố định hoặc px
          width="60%"
          bg="$blue10"
          justifyContent="center"
          alignItems="center"
          p="$10"
          $sm={{ display: 'none' }}
          position="relative"
        >
          {/* ... các phần trang trí giữ nguyên ... */}
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
            style={{ tintColor: 'white' }}
          />
          <H3 color="white" mt="$5" fontWeight="900" fontSize="$9" letterSpacing={1}>
            ToboChat
          </H3>
          <Separator borderBottomWidth={2} borderColor="white" width={40} my="$4" opacity={0.5} />
          <Paragraph color="white" opacity={0.8} textAlign="center" lineHeight={24} px="$6">
            Giải pháp giao tiếp đa nền tảng, tối ưu cho quy trình làm việc của lập trình viên.
          </Paragraph>
        </YStack>

        {/* PHẦN BÊN PHẢI: Form */}
        <YStack
          // FIX 3: Phần còn lại chiếm 60%
          width="40%"
          $sm={{ width: '100%' }} // Trên mobile chiếm hết 100%
          p="$7"
          justifyContent="center"
          bg="$color1"
        >
          {/* FIX 4: Cố định chiều cao vùng chứa Header để không bị lệch dòng */}
          <YStack mb="$6" height={100} justifyContent="center">
            <H3 alignItems='center' fontWeight="700" fontSize="$9" color="$color12" letterSpacing={-0.5}>
              {getTitle()}
            </H3>
            <Paragraph size="$4" color="$color10" mt="$2">

            </Paragraph>
          </YStack>

          {/* FIX 5: Cố định chiều cao vùng chứa Form */}
          <View minHeight={350} justifyContent="flex-start">
            {mode === 'SIGNIN' && (
              <SignInForm
                onSwitchSignUp={() => setMode('SIGNUP')}
                onForgotPassword={() => setMode('FORGOT')}
              />
            )}

            {mode === 'SIGNUP' && (
              <SignUpForm
                onSignUpSuccess={() => setMode('SIGNIN')}
                onSwitchSignIn={() => setMode('SIGNIN')}
              />
            )}

            {mode === 'FORGOT' && (
              <ForgotPasswordForm onBackToSignIn={() => setMode('SIGNIN')} />
            )}
          </View>
        </YStack>
      </Card>
    </YStack>
  )
}