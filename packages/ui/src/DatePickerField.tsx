import { Input, Stack, useTheme } from '@my/ui'
import { Platform } from 'react-native'

export function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}) {
  const theme = useTheme()

  // NOTE: Tamagui/RNW Input thường không hỗ trợ type="date" (vẫn là text input).
  // Để web chắc chắn có calendar picker, dùng thẳng HTML <input type="date">.
  if (Platform.OS === 'web') {
    return (
      <Stack
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$background"
        borderRadius="$4"
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            color: theme.color?.val,
            font: 'inherit',
          }}
        />
      </Stack>
    )
  }

  return (
    <Input
      value={value}
      onChangeText={onChange}
      // Fallback cho trường hợp browser không support date input
      placeholder={placeholder}
    />
  )
}
