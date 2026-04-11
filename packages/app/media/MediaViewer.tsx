import React from 'react'
import { Image } from 'react-native'
// Import các component của Tamagui tại đây:
import { YStack, XStack, Text, Button, ZStack } from 'tamagui'
import { X, ChevronLeft, ChevronRight, Download } from '@tamagui/lucide-icons'

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
      <XStack position="absolute" top={20} right={20} space="$4" zIndex={10}>
        <Button
          icon={<Download size={24} />}
          chromeless
          onPress={() => window.open(current.fileUrl)}
        />
        <Button icon={<X size={24} />} chromeless onPress={onClose} />
      </XStack>

      {/* Mũi tên TRÁI */}
      {activeIndex > 0 && (
        <Button
          position="absolute"
          left={20}
          circular
          size="$6"
          icon={<ChevronLeft size={32} />}
          onPress={onPrev}
        />
      )}

      {/* NỘI DUNG CHÍNH */}
      <YStack width="80%" height="80%" alignItems="center" justifyContent="center">
        {isVideo ? (
          <video
            src={current.fileUrl}
            controls
            autoPlay
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
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
          right={20}
          circular
          size="$6"
          icon={<ChevronRight size={32} />}
          onPress={onNext}
        />
      )}

      {/* Chỉ số (ví dụ: 1/5) */}
      <Text position="absolute" bottom={40} color="white">
        {activeIndex + 1} / {mediaList.length} - {current.fileName}
      </Text>
    </YStack>
  )
}
