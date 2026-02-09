import { useState } from 'react'
import { Keyboard, TouchableWithoutFeedback } from 'react-native'
import {
  YStack,
  XStack,
  Input,
  Button,
  Form,
  H3,
  Text,
  Spinner,
  Label,
  Theme,
  Separator,
  SizableText,
} from 'tamagui'
import { Eye, EyeOff, LogIn, Lock, User } from '@tamagui/lucide-icons'
import { useLoginMutation } from '../../store/api' // Import từ file api.ts đã sửa
import { useLink } from 'solito/navigation' // Hoặc router của bạn
import { useRouter } from "next/navigation";
export function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const router = useRouter();
  // Gọi Hook từ RTK Query
  const [login, { isLoading }] = useLoginMutation()

  // Link để chuyển trang (nếu cần)
  const signUpLink = useLink({ href: '/signup' })

  const handleLogin = async () => {
    Keyboard.dismiss()
    setErrorMsg('')

    if (!username || !password) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      await login({ username, password }).unwrap()
      router.replace("/chat"); 
      console.log('Đăng nhập thành công!')
    } catch (err: any) {
      // Xử lý lỗi từ Backend trả về
      const message = err?.data?.message || 'Đăng nhập thất bại'
      setErrorMsg(message)
    }
  }

  return (
    // Dismiss keyboard khi chạm ra ngoài (cho Mobile)
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Theme name="light">
        <YStack flex={1} justifyContent="center" alignItems="center" bg="$background" p="$4">
          {/* Container Form */}
          <YStack
            width="100%"
            maxWidth={400}
            bg="$color2"
            p="$5"
            borderRadius="$6" // Border Radius
            elevation="$4" // Shadow cho Android
            shadowColor="$shadowColor" // Shadow cho iOS/Web
            shadowRadius={20}
            shadowOffset={{ width: 0, height: 10 }}
            space="$4"
          >
            <YStack space="$2" mb="$2">
              <H3 textAlign="center" color="$color">
                Chào mừng trở lại!
              </H3>
              <Text textAlign="center" color="$color10" fontSize="$3">
                Đăng nhập vào hệ thống ToboChat
              </Text>
            </YStack>

            {/* FORM */}
            <Form onSubmit={handleLogin} space="$4">
              {/* Username Input */}
              <YStack space="$2">
                <Label size="$3">Tài khoản</Label>
                <XStack
                  alignItems="center"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  px="$3"
                >
                  <User size={18} color="$color10" />
                  <Input
                    flex={1}
                    unstyled
                    p="$3"
                    placeholder="Nhập tài khoản..."
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </XStack>
              </YStack>

              {/* Password Input */}
              <YStack space="$2">
                <Label size="$3">Mật khẩu</Label>
                <XStack
                  alignItems="center"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  px="$3"
                >
                  <Lock size={18} color="$color10" />
                  <Input
                    unstyled
                    flex={1}
                    p="$3"
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  {/* Nút ẩn/hiện mật khẩu */}
                  <Button
                    size="$2"
                    chromeless
                    icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                </XStack>
              </YStack>

              {/* Thông báo lỗi */}
              {!!errorMsg && (
                <Text color="$red10" fontSize="$3" textAlign="center">
                  {errorMsg}
                </Text>
              )}

              {/* Nút Đăng nhập */}
              <Form.Trigger asChild>
                <Button
                  themeInverse // Đổi màu nền tương phản (thường là đen/xanh đậm)
                  size="$5"
                  onPress={handleLogin}
                  disabled={isLoading}
                  icon={isLoading ? <Spinner color="$color" /> : <LogIn size={20} />}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </Button>
              </Form.Trigger>
            </Form>

            <Separator my="$2" />

            <XStack justifyContent="center" space="$2">
              <SizableText size="$3" color="$color10">
                Chưa có tài khoản?
              </SizableText>
              <SizableText
                size="$3"
                color="$blue10"
                fontWeight="800"
                textDecorationLine="underline"
                cursor="pointer"
                {...signUpLink}
              >
                Đăng ký ngay
              </SizableText>
            </XStack>
          </YStack>
        </YStack>
      </Theme>
    </TouchableWithoutFeedback>
  )
}
