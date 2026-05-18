import { useState } from 'react'
import { Keyboard } from 'react-native'
import { Button, YStack } from 'tamagui'
import { Smile } from '@tamagui/lucide-icons'
import EmojiSelector from 'react-native-emoji-selector'

type Props = {
  onEmojiSelect: (emoji: string) => void
}

export default function ChatEmojiPicker({
  onEmojiSelect,
}: Props) {
  const [open, setOpen] = useState(false)

  const handleToggle = () => {
    Keyboard.dismiss() 
    setOpen((v) => !v)
  }

  return (
    <>
      <Button
        size="$3"
        circular
        chromeless
        icon={<Smile size={24} />}
        onPress={handleToggle}
      />

      {open && (
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          height={300}
          bg="$background"
          borderTopLeftRadius="$4"
          borderTopRightRadius="$4"
        >
          <EmojiSelector
            onEmojiSelected={(emoji) => {
              onEmojiSelect(emoji)
            }}
            showSearchBar={false}
            showTabs={true}
            columns={8}
          />
        </YStack>
      )}
    </>
  )
}