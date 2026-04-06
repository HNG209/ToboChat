import { Calendar } from '@tamagui/lucide-icons'
import { useRef } from 'react'

import { Button, Input, XStack } from '@my/ui'
import { Alert } from 'react-native'

export function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}) {
  const inputRef = useRef<any>(null)

  return (
    <XStack alignItems="center" space="$2">
      <Input
        ref={inputRef}
        flex={1}
        value={value}
        placeholder={placeholder}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Button
        size="$3"
        circular
        icon={Calendar}
        onPress={() => {
          // Fallback an toàn: không phụ thuộc native module để tránh crash.
          // Người dùng có thể nhập YYYY-MM-DD trực tiếp.
          try {
            inputRef.current?.focus?.()
          } catch {
            // ignore
          }
          Alert.alert('Nhập ngày', 'Nhập theo định dạng YYYY-MM-DD (ví dụ: 2000-12-31).')
        }}
        aria-label="Nhập ngày"
      />
    </XStack>
  )
}
