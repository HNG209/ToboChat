import { useState } from 'react'
import { Keyboard } from 'react-native'
import { Button } from 'tamagui'
import { Smile } from '@tamagui/lucide-icons'
import EmojiPicker, { EmojiType } from 'rn-emoji-keyboard'

type Props = {
  onEmojiSelect: (emoji: string) => void
}

export default function ChatEmojiPicker({ onEmojiSelect }: Props) {
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
        icon={<Smile size={24} color="$color10" />}
        onPress={handleToggle}
      />

      <EmojiPicker
        open={open}
        onClose={() => setOpen(false)}
        onEmojiSelected={(emoji: EmojiType) => {
          onEmojiSelect(emoji.emoji)
        }}
        enableRecentlyUsed
        categoryPosition="top"
      />
    </>
  )
}