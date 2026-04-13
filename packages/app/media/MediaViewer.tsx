import React from 'react'
import {
  Image,
  Platform,
  Linking,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { YStack, XStack, Text, Button, Dialog, Portal, VisuallyHidden } from 'tamagui'
import { X, ChevronLeft, ChevronRight, Download } from '@tamagui/lucide-icons'

export const MediaViewer = ({ visible, mediaList, activeIndex, onClose, onNext, onPrev }: any) => {
  const { width: screenWidth } = useWindowDimensions()

  if (!visible || !mediaList || mediaList.length === 0) return null

  const current = mediaList[activeIndex]
  const isVideo = current?.contentType?.startsWith('video/')

  const MainViewerContent = (
    <YStack fullscreen bg="black" zIndex={1000000}>
      <StatusBar hidden={visible} />

      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1} position="relative">
          {/* --- HEADER: TÊN FILE (TRÁI) & NÚT BẤM (PHẢI) --- */}
          <XStack
            position="absolute"
            top={Platform.OS === 'web' ? 20 : 30}
            left={0}
            right={0}
            px="$4"
            justifyContent="space-between"
            alignItems="center"
            zIndex={1000001}
          >
            {/* Góc trên bên trái: Tên file */}
            <YStack bg="rgba(0,0,0,0.5)" px="$3" py="$1.5" borderRadius="$3" maxWidth="70%">
              <Text color="white" fontSize="$3" fontWeight="500" numberOfLines={1} ellipse>
                {current.fileName}
              </Text>
            </YStack>

            {/* Góc trên bên phải: Nút chức năng */}
            <XStack space="$2">
              <Button
                icon={<Download size={22} color="white" />}
                chromeless
                onPress={() => Linking.openURL(current.fileUrl)}
                hoverStyle={{ bg: 'rgba(255,255,255,0.1)' }}
              />
              <Button
                icon={<X size={22} color="white" />}
                chromeless
                onPress={onClose}
                hoverStyle={{ bg: 'rgba(255,255,255,0.1)' }}
              />
            </XStack>
          </XStack>

          {/* --- VÙNG HIỂN THỊ CHÍNH (GIỮA) --- */}
          <YStack flex={1} alignItems="center" justifyContent="center">
            {isVideo ? (
              Platform.OS === 'web' ? (
                <video
                  src={current.fileUrl}
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                /* Chèn logic renderNativeVideo của bạn ở đây */
                <YStack width={screenWidth} height="100%" bg="black" />
              )
            ) : (
              <Image
                source={{ uri: current.fileUrl }}
                style={{ width: screenWidth, height: '100%' }}
                resizeMode="contain"
              />
            )}
          </YStack>

          {/* --- ĐIỀU HƯỚNG (HAI BÊN) --- */}
          {activeIndex > 0 && (
            <Button
              position="absolute"
              left={15}
              top="50%"
              y="-50%"
              circular
              size="$5"
              bg="rgba(255,255,255,0.1)"
              icon={<ChevronLeft size={30} color="white" />}
              onPress={onPrev}
              zIndex={1000001}
            />
          )}
          {activeIndex < mediaList.length - 1 && (
            <Button
              position="absolute"
              right={15}
              top="50%"
              y="-50%"
              circular
              size="$5"
              bg="rgba(255,255,255,0.1)"
              icon={<ChevronRight size={30} color="white" />}
              onPress={onNext}
              zIndex={1000001}
            />
          )}

          {/* --- FOOTER: CHỈ SỐ FILE (GIỮA DƯỚI) --- */}
          <YStack
            position="absolute"
            bottom={20}
            left={0}
            right={0}
            alignItems="center"
            paddingBottom={Platform.OS === 'android' ? 30 : 10} // Khoảng cách an toàn phím hệ thống
          >
            <YStack bg="rgba(0,0,0,0.5)" px="$1" py="$1" borderRadius="$10">
              <Text color="white" fontSize="$4" fontWeight="bold">
                {activeIndex + 1}{' '}
                <Text fontSize="$2" opacity={0.6} color="white">
                  /
                </Text>{' '}
                {mediaList.length}
              </Text>
            </YStack>
          </YStack>
        </YStack>
      </SafeAreaView>
    </YStack>
  )

  // Web Wrapper (Dialog & Portal)
  if (Platform.OS === 'web') {
    return (
      <Dialog modal open={visible} onOpenChange={(val) => !val && onClose()}>
        <Portal>
          <Dialog.Content
            p={0}
            borderWidth={0}
            bg="black"
            width="100vw"
            height="100vh"
            maxWidth="100vw"
            maxHeight="100vh"
          >
            <VisuallyHidden>
              <Dialog.Title>Viewer</Dialog.Title>
            </VisuallyHidden>
            {MainViewerContent}
          </Dialog.Content>
        </Portal>
      </Dialog>
    )
  }

  return MainViewerContent
}
