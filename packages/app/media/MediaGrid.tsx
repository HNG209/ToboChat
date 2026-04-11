import { Image, Pressable } from 'react-native' // Import thêm Pressable để bắt sự kiện chạm
import { YStack, XStack, Text, ZStack } from 'tamagui'
import { Play } from '@tamagui/lucide-icons'

export const MediaGrid = ({
  media,
  onPressMedia,
}: {
  media: any[]
  onPressMedia: (index: number) => void
}) => {
  if (!media || media.length === 0) return null

  const displayLimit = 4
  const displayMedia = media.slice(0, displayLimit)
  const remainingCount = media.length - displayLimit

  // 1. Trường hợp 1 file duy nhất
  if (media.length === 1) {
    const item = media[0]
    const isVideo = item.contentType?.startsWith('video/')
    return (
      <YStack
        width={300}
        height={200}
        backgroundColor="$color5"
        onPress={() => onPressMedia(0)} // Gắn sự kiện bấm cho ảnh duy nhất
        cursor="pointer"
      >
        {isVideo ? (
          /* Video lẻ thì nên để controls để xem trực tiếp hoặc thumbnail */
          <video
            src={item.fileUrl}
            style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }}
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
            onPress={() => onPressMedia(idx)} // Gắn sự kiện bấm cho từng item trong grid
            cursor="pointer"
            hoverStyle={{ opacity: 0.9 }} // Hiệu ứng nhẹ khi hover trên Web
          >
            <ZStack fullscreen>
              {isVideo ? (
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

              {isLastItem && (
                <YStack
                  fullscreen
                  backgroundColor="rgba(0,0,0,0.6)"
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
