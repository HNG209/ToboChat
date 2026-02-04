import React, { useState } from 'react'
import { Alert } from 'react-native'
import { YStack, XStack, Input, Button, Text, H3, Spinner, Paragraph, Image, Card } from 'tamagui'
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth'
import { useRouter } from 'solito/navigation'

export function AuthScreen() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'LOGIN' | 'CONFIRM'>('LOGIN')
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { isSignedIn } = await signIn({ username: email, password })
      console.log(isSignedIn)
      if (isSignedIn) {
        router.push('/')
      }
    } catch (error: any) {
      console.log('Lỗi chi tiết:', JSON.stringify(error, null, 2)) // In ra toàn bộ cấu trúc lỗi

      if (error.underlyingError) {
        console.log('Lỗi gốc:', error.underlyingError)
      }
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email, name },
        },
      })
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setStep('CONFIRM')
        Alert.alert('Kiểm tra email', 'Mã xác nhận đã gửi tới email của bạn.')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmSignUp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { isSignUpComplete } = await confirmSignUp({ username: email, confirmationCode: code })
      if (isSignUpComplete) {
        Alert.alert('Thành công', 'Đăng ký thành công! Hãy đăng nhập.')
        setStep('LOGIN')
        setIsSignUp(false)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      p="$4"
      backgroundColor="$background"
    >
      <Card
        elevate
        size="$4"
        bordered
        width={350}
        p="$5"
        borderRadius="$6"
        backgroundColor="$color1"
        shadowColor="$shadowColor"
        shadowOpacity={0.08}
        shadowRadius={16}
        shadowOffset={{ width: 0, height: 8 }}
      >
        <YStack alignItems="center" space="$3" mb="$2">
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/295/295128.png' }}
            width={56}
            height={56}
            borderRadius={28}
            mb="$2"
          />
          <H3 textAlign="center" color="$color12">
            {isSignUp ? (step === 'CONFIRM' ? 'Xác nhận Email' : 'Tạo tài khoản') : 'Đăng nhập'}
          </H3>
          <Paragraph size="$3" color="$color8" textAlign="center">
            {isSignUp
              ? step === 'CONFIRM'
                ? 'Nhập mã xác nhận đã gửi tới email của bạn.'
                : 'Tạo tài khoản mới để bắt đầu trò chuyện.'
              : 'Đăng nhập để tiếp tục sử dụng ToboChat.'}
          </Paragraph>
        </YStack>

        {error && (
          <YStack bg="$red1" p="$2" borderRadius="$3" mb="$2">
            <Text color="$red10" fontWeight="bold" textAlign="center">
              {error}
            </Text>
          </YStack>
        )}

        {step === 'CONFIRM' ? (
          <YStack space="$3">
            <Input
              placeholder="Nhập mã xác nhận"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              size="$4"
              borderRadius="$4"
              autoFocus
            />
            <Button
              onPress={handleConfirmSignUp}
              disabled={isLoading}
              theme="active"
              size="$4"
              borderRadius="$4"
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <Text fontWeight="bold" color="$color12">
                  Xác nhận
                </Text>
              )}
            </Button>
          </YStack>
        ) : (
          <YStack space="$3">
            {isSignUp && (
              <Input
                placeholder="Họ và Tên"
                value={name}
                onChangeText={setName}
                size="$4"
                borderRadius="$4"
                autoFocus
              />
            )}
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              size="$4"
              borderRadius="$4"
            />
            <Input
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              size="$4"
              borderRadius="$4"
            />
            <Button
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={isLoading}
              theme="active"
              size="$4"
              borderRadius="$4"
            >
              {isLoading ? (
                <Spinner color="$color12" />
              ) : (
                <Text fontWeight="bold" color="$color12">
                  {isSignUp ? 'Đăng ký' : 'Đăng nhập'}
                </Text>
              )}
            </Button>
            <XStack justifyContent="center" space="$2" mt="$2">
              <Paragraph size="$2" color="$color8">
                {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
              </Paragraph>
              <Text
                cursor="pointer"
                color="$blue10"
                fontWeight="bold"
                onPress={() => {
                  setIsSignUp(!isSignUp)
                  setStep('LOGIN')
                  setError(null)
                }}
              >
                {isSignUp ? 'Đăng nhập' : 'Tạo mới'}
              </Text>
            </XStack>
          </YStack>
        )}
      </Card>
    </YStack>
  )
}
