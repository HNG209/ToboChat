import React, { useState } from 'react'
import { Button, YStack, Text, XStack } from 'tamagui'
import { useFileUpload } from '../../hooks/useFileUpload' // Tự động nhận diện .native hoặc .ts
import { Platform } from 'react-native'

export const UploadProfile = () => {
  const { pick } = useFileUpload()
  const [selected, setSelected] = useState<any>(null)

  const handlePick = async () => {
    const file = await pick()
    if (file) setSelected(file)
  }

  const handleUpload = async () => {
    if (!selected) return

    const formData = new FormData()

    if (Platform.OS === 'web') {
      // Trên Web, dùng object File gốc
      formData.append('file', selected.file)
    } else {
      // Trên Native, giả lập object File
      formData.append('file', {
        uri: selected.uri,
        name: selected.name,
        type: selected.type,
      } as any)
    }

    console.log('FormData ready to be sent:', formData)

    // Gửi đến Backend (Spring Boot / Node.js)
    // fetch('YOUR_API', { method: 'POST', body: formData })
  }

  return (
    <YStack space="$4" p="$4" alignItems="center">
      <Button onPress={handlePick}>Chọn tài liệu</Button>
      {selected && <Text>File: {selected.name}</Text>}
      <Button theme="active" onPress={handleUpload} disabled={!selected}>
        Upload lên Server
      </Button>
    </YStack>
  )
}
