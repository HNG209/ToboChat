import { Calendar } from '@tamagui/lucide-icons'
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { useCallback, useMemo, useRef, useState } from 'react'

import { Button, Input, XStack } from '@my/ui'
import { Platform } from 'react-native'

function parseYyyyMmDd(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return undefined

  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])

  const d = new Date(year, month - 1, day)
  if (Number.isNaN(d.getTime())) return undefined
  // Guard against overflow dates (e.g. 2025-02-31)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day)
    return undefined
  return d
}

function formatYyyyMmDd(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDdMmYyyy(date: Date): string {
  const day = `${date.getDate()}`.padStart(2, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
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
  const inputRef = useRef<any>(null)
  const [iosOpen, setIosOpen] = useState(false)

  const selectedDate = useMemo(() => parseYyyyMmDd(value) ?? new Date(), [value])
  const displayValue = useMemo(() => {
    const d = parseYyyyMmDd(value)
    return d ? formatDdMmYyyy(d) : value
  }, [value])

  const handleChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event?.type === 'dismissed') {
        setIosOpen(false)
        return
      }

      if (date && !Number.isNaN(date.getTime())) {
        onChange(formatYyyyMmDd(date))
      }
    },
    [onChange]
  )

  const openPicker = useCallback(() => {
    try {
      inputRef.current?.blur?.()
    } catch {
      // ignore
    }

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        onChange: handleChange,
      })
      return
    }

    setIosOpen((v) => !v)
  }, [handleChange, selectedDate])

  return (
    <XStack alignItems="center" space="$2">
      <Input
        ref={inputRef}
        flex={1}
        value={displayValue}
        placeholder={placeholder ?? 'DD/MM/YYYY'}
        editable={false}
        onPressIn={openPicker}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Button size="$3" circular icon={Calendar} onPress={openPicker} aria-label="Chọn ngày" />

      {Platform.OS === 'ios' && iosOpen ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={handleChange}
        />
      ) : null}
    </XStack>
  )
}
