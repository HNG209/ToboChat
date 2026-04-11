import { Image } from 'react-native'
import { YStack, XStack, Text, ZStack } from 'tamagui'
import { Play } from '@tamagui/lucide-icons'

interface MediaGridProps {
  media: any[]
}

export const MediaGrid = ({ media }: MediaGridProps) => {
  if (!media || media.length === 0) return null

  const displayLimit = 4 // Giới hạn hiển thị 4 ô
  const displayMedia = media.slice(0, displayLimit)
  const remainingCount = media.length - displayLimit

  // 1. Trường hợp 1 file duy nhất
  if (media.length === 1) {
    const item = media[0]
    const isVideo = item.contentType?.startsWith('video/')
    return (
      <YStack width={300} height={200} backgroundColor="$color5">
        {isVideo ? (
          <video
            src={item.fileUrl}
            controls
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
          />
        ) : (
          <Image
            source={{ uri: item.fileUrl }}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
            resizeMode="cover"
          />
        )}
      </YStack>
    )
  }

  // 2. Trường hợp nhiều file (Grid)
  return (
    <XStack flexWrap="wrap" width={300} borderRadius={8} overflow="hidden">
      {displayMedia.map((item, idx) => {
        const isVideo = item.contentType?.startsWith('video/')
        const isLastItem = idx === displayLimit - 1 && remainingCount > 0

        // Tính toán width: 2 ảnh thì mỗi cái 50%, >2 ảnh thì chia ô vuông
        const itemWidth = media.length === 2 ? '50%' : '50%'
        const itemHeight = 150

        return (
          <YStack
            key={idx}
            width={itemWidth}
            height={itemHeight}
            borderWidth={0.5}
            borderColor="$background"
            position="relative"
          >
            <ZStack fullscreen>
              {isVideo ? (
                /* Video trong grid nên là một frame tĩnh kèm nút Play */
                <YStack
                  fullscreen
                  backgroundColor="black"
                  alignItems="center"
                  justifyContent="center"
                >
                  <video
                    src={item.fileUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                  />
                  <Play size={30} color="white" />
                </YStack>
              ) : (
                <Image source={{ uri: item.fileUrl }} style={{ width: '100%', height: '100%' }} />
              )}

              {/* Lớp phủ mờ hiện số lượng ảnh còn lại (+X) */}
              {isLastItem && (
                <YStack
                  fullscreen
                  backgroundColor="rgba(0,0,0,0.5)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontWeight="bold" fontSize="$6">
                    +{remainingCount}
                  </Text>
                </YStack>
              )}
            </ZStack>
          </YStack>
        )
      })}
    </XStack>
  )
}
