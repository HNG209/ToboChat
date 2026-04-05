import { Calendar } from '@tamagui/lucide-icons'
import { useMemo, useState } from 'react'

import { Button, Input, XStack } from '@my/ui'
import { Alert } from 'react-native'

function getNativeDateTimePicker(): any | null {
  try {
    // Module này sẽ throw ngay lúc import nếu binary không có RNCDatePicker.
    const mod = require('@react-native-community/datetimepicker')
    return mod?.default ?? mod
  } catch {
    return null
  }
}

function formatYYYYMMDD(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseYYYYMMDD(value: string): Date | null {
  if (!value) return null
  // ISO -> YYYY-MM-DD
  const v = value.includes('T') ? value.slice(0, 10) : value
  const m = /^\d{4}-\d{2}-\d{2}$/.exec(v)
  if (!m) return null
  const [y, mm, dd] = v.split('-').map((x) => Number(x))
  const dt = new Date(y, mm - 1, dd)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)

  const NativeDateTimePicker = useMemo(() => getNativeDateTimePicker(), [])

  const dateValue = useMemo(() => {
    return parseYYYYMMDD(value) ?? new Date()
  }, [value])

  return (
    <>
      <XStack alignItems="center" space="$2">
        <Input
          flex={1}
          value={value}
          placeholder={placeholder}
          editable={false}
          pointerEvents="none"
        />
        <Button
          size="$3"
          circular
          icon={Calendar}
          onPress={() => {
            if (!NativeDateTimePicker) {
              Alert.alert(
                'Chưa hỗ trợ trên binary hiện tại',
                'Date picker cần Dev Client / build lại app (không chạy được trên Expo Go hoặc binary cũ).'
              )
              return
            }
            setOpen(true)
          }}
          aria-label="Chọn ngày"
        />
      </XStack>

      {open && NativeDateTimePicker ? (
        <NativeDateTimePicker
          mode="date"
          value={dateValue}
          onChange={(event, selectedDate) => {
            // Android: event.type === 'dismissed' | 'set'
            if ((event as any)?.type === 'dismissed') {
              setOpen(false)
              return
            }

            if (selectedDate) {
              onChange(formatYYYYMMDD(selectedDate))
            }
            setOpen(false)
          }}
        />
      ) : null}
    </>
  )
}
