import React from 'react'
import { Image, Pressable, View } from 'react-native'
import { YStack, XStack, Text, ZStack } from 'tamagui'
import { Play } from '@tamagui/lucide-icons'
import { Video, ResizeMode } from 'expo-av'

export const MediaGrid = ({
  media,
  onPressMedia,
  selectionMode,
  isSelected,
  onToggleSelect,
  messageId,
  onLongPress,
}: {
  media: any[]
  onPressMedia?: (index: number) => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  messageId?: string
  onLongPress?: () => void
}) => {
  if (!media || media.length === 0) return null

  const displayLimit = 4
  const displayMedia = media.slice(0, displayLimit)
  const remainingCount = media.length - displayLimit

  const renderVideoItem = (url: string, isGrid: boolean) => (
    <Video
      source={{ uri: url }}
      resizeMode={ResizeMode.COVER}
      shouldPlay={false}
      isMuted={true}
      style={{ width: '100%', height: '100%', opacity: isGrid ? 0.8 : 1 }}
    />
  )

  const handlePress = (index: number) => {
    console.log("Hàm handlePress đang chạy...");
    if (selectionMode && messageId) {
      onToggleSelect?.(messageId)
    } else if (!selectionMode && onPressMedia) {
      onPressMedia(index)
    }
  }
  const renderItem = (item: any, idx: number, width: any, height: number, isGrid: boolean) => {
    const isVideo = item.contentType?.startsWith('video/')
    const isLastItem = isGrid && idx === displayLimit - 1 && remainingCount > 0

    return (
      <Pressable
        delayLongPress={200}
        onLongPress={() => {
          console.log("!!! KẾT QUẢ CUỐI CÙNG ĐÂY RỒI ĐẠT !!!");
          onLongPress?.();
        }}
        onPress={() => handlePress(idx)}
        // 2. KHÔNG DÙNG onStartShouldSetResponder ở đây
        style={({ pressed }) => ({
          flex: 1,
          opacity: (selectionMode && isSelected) || pressed ? 0.6 : 1,
          borderWidth: 0.5,
          borderColor: 'white', // Thay cho $background để test
        })}
      >
        <View style={{ flex: 1 }} pointerEvents="none">
          {/* 1. Dùng Pressable như một cái Khung chứa (Container) */}
          {/* 3. Dùng pointerEvents="none" để ép sự kiện không dừng lại ở ảnh/video */}
          <YStack flex={1} pointerEvents="none">
            {isVideo ? (
              <YStack flex={1} backgroundColor="black" alignItems="center" justifyContent="center">
                {renderVideoItem(item.fileUrl, isGrid)}
                <Play size={isGrid ? 30 : 40} color="white" position="absolute" />
              </YStack>
            ) : (
              <Image
                source={{ uri: item.fileUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            )}
          </YStack>

          {/* 4. Phần overlay số lượng ảnh dư (+3) cũng phải chặn pointerEvents */}
          {isLastItem && (
            <YStack
              position="absolute"
              top={0} left={0} right={0} bottom={0}
              backgroundColor="rgba(0,0,0,0.6)"
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
              <Text color="white" fontWeight="bold" fontSize="$6">
                +{remainingCount}
              </Text>
            </YStack>
          )}
        </View>
      </Pressable >

    )
  }

  // TRƯỜNG HỢP 1 ẢNH
  if (media.length === 1) {
    return (
      <YStack width={300} height={200} >
        {renderItem(media[0], 0, 300, 200, false)}
      </YStack>
    )
  }

  // TRƯỜNG HỢP NHIỀU ẢNH (GRID)
  return (
    <XStack flexWrap="wrap" width={300} >
      {displayMedia.map((item, idx) => renderItem(item, idx, '50%', 150, true))}
    </XStack>
  )

}