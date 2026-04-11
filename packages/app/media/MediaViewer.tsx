import React from 'react'
import { Image, Platform, Linking } from 'react-native'
import { YStack, XStack, Text, Button } from 'tamagui'
import { X, ChevronLeft, ChevronRight, Download } from '@tamagui/lucide-icons'

// KHÔNG import { Video, ResizeMode } from 'expo-av' ở đây nữa để tránh lỗi Web

interface MediaViewerProps {
  visible: boolean
  mediaList: any[]
  activeIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export const MediaViewer = ({
  visible,
  mediaList,
  activeIndex,
  onClose,
  onNext,
  onPrev,
}: MediaViewerProps) => {
  if (!visible || !mediaList || mediaList.length === 0) return null

  const current = mediaList[activeIndex]
  const isVideo = current?.contentType?.startsWith('video/')

  const handleDownload = () => {
    if (Platform.OS === 'web') {
      window.open(current.fileUrl, '_blank')
    } else {
      Linking.openURL(current.fileUrl)
    }
  }

  // Component phụ để render Video an toàn trên Native
  const NativeVideo = (props: any) => {
    if (Platform.OS === 'web') return null
    try {
      // Chỉ require khi thực sự chạy trên Native
      const { Video, ResizeMode } = require('expo-av')
      return <Video resizeMode={ResizeMode.CONTAIN} useNativeControls shouldPlay {...props} />
    } catch (e) {
      console.error('expo-av not found', e)
      return null
    }
  }

  return (
    <YStack
      fullscreen
      position="absolute"
      zIndex={1000000}
      bg="rgba(0,0,0,0.95)"
      alignItems="center"
      justifyContent="center"
    >
      {/* Nút Đóng & Download */}
      <XStack
        position="absolute"
        top={Platform.OS === 'ios' ? 50 : 20}
        right={20}
        space="$4"
        zIndex={100}
      >
        <Button icon={<Download size={24} color="white" />} chromeless onPress={handleDownload} />
        <Button icon={<X size={24} color="white" />} chromeless onPress={onClose} />
      </XStack>

      {/* Mũi tên TRÁI */}
      {activeIndex > 0 && (
        <Button
          position="absolute"
          left={10}
          circular
          size="$4"
          bg="rgba(255,255,255,0.1)"
          icon={<ChevronLeft size={24} color="white" />}
          onPress={onPrev}
          zIndex={100}
        />
      )}

      {/* NỘI DUNG CHÍNH */}
      <YStack width="100%" height="75%" alignItems="center" justifyContent="center">
        {isVideo ? (
          Platform.OS === 'web' ? (
            <video
              src={current.fileUrl}
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          ) : (
            <NativeVideo
              source={{ uri: current.fileUrl }}
              style={{ width: '100%', height: '100%' }}
            />
          )
        ) : (
          <Image
            source={{ uri: current.fileUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        )}
      </YStack>

      {/* Mũi tên PHẢI */}
      {activeIndex < mediaList.length - 1 && (
        <Button
          position="absolute"
          right={10}
          circular
          size="$4"
          bg="rgba(255,255,255,0.1)"
          icon={<ChevronRight size={24} color="white" />}
          onPress={onNext}
          zIndex={100}
        />
      )}

      {/* Chỉ số */}
      <YStack position="absolute" bottom={Platform.OS === 'ios' ? 60 : 40} alignItems="center">
        <Text color="white" fontSize="$3" fontWeight="bold">
          {activeIndex + 1} / {mediaList.length}
        </Text>
        <Text color="white" fontSize="$1" opacity={0.7}>
          {current.fileName}
        </Text>
      </YStack>
    </YStack>
  )
}
