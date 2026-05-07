'use client'

import data from '@emoji-mart/data'

import {
  Button,
  Portal,
  YStack,
  Spinner,
} from 'tamagui'

import { Smile } from '@tamagui/lucide-icons'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { Platform } from 'react-native'

type Props = {
  onEmojiSelect: (emoji: string) => void
}

export default function ChatEmojiPicker({
  onEmojiSelect,
}: Props) {
  const [open, setOpen] = useState(false)

  const [PickerComponent, setPickerComponent] =
    useState<any>(null)

  const [loading, setLoading] = useState(false)

  const buttonRef = useRef<any>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState({
    left: 0,
    top: 0,
  })

  // preload khi hover
  const preloadPicker = async () => {
    if (PickerComponent || loading) return

    setLoading(true)

    const mod = await import('@emoji-mart/react')

    setPickerComponent(() => mod.default)

    setLoading(false)
  }

  useEffect(() => {
    if (Platform.OS !== 'web') return

    function handleClickOutside(e: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  const handleToggle = async () => {
    await preloadPicker()

    if (buttonRef.current) {
      const rect =
        buttonRef.current.getBoundingClientRect()

      setPosition({
        left: rect.left,
        top: rect.top - 430,
      })
    }

    setOpen((v) => !v)
  }

  if (Platform.OS !== 'web') {
    return null
  }

  const Picker = PickerComponent

  return (
    <>
      <Button
        ref={buttonRef}
        size="$3"
        circular
        chromeless
        icon={<Smile size={24} color="$color10" />}
        onMouseEnter={preloadPicker}
        onPress={handleToggle}
      />

      <Portal>
        <YStack
          pointerEvents="box-none"
          position="fixed"
          left={position.left}
          top={position.top}
          zIndex={999999}
          display={open ? 'flex' : 'none'}
        >
          <div
            ref={pickerRef}
            style={{
              pointerEvents: 'auto',
            }}>
            {loading && (
              <YStack
                width={320}
                height={400}
                bg="$background"
                borderRadius="$4"
                justifyContent="center"
                alignItems="center"
              >
                <Spinner />
              </YStack>
            )}

            {Picker && (
              <Picker
                data={data}
                previewPosition="none"
                skinTonePosition="none"
                autoFocus={false}
                categories={[
                  'frequent',
                  'people',
                  'nature',
                  'foods',
                ]}
                onEmojiSelect={(emoji: any) => {
                  onEmojiSelect(emoji.native)
                }}
              />
            )}
          </div>
        </YStack>
      </Portal>
    </>
  )
}