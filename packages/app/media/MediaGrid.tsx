import { Image, Platform } from 'react-native'
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

  // Hàm render Video an toàn cho cả 2 nền tảng
  const renderVideoItem = (url: string, isGrid: boolean) => {
    if (Platform.OS === 'web') {
      return (
        <video
          src={url}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: isGrid ? 0 : 8,
            opacity: isGrid ? 0.8 : 1,
          }}
        />
      )
    }

    // Đối với Native (iOS/Android): Dùng require động để tránh lỗi Next.js
    try {
      const { Video, ResizeMode } = require('expo-av')
      return (
        <Video
          source={{ uri: url }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted={true}
          style={{ width: '100%', height: '100%', opacity: isGrid ? 0.8 : 1 }}
        />
      )
    } catch (error) {
      console.error('expo-av not found on native', error)
      return <YStack fullscreen bg="black" />
    }
  }

  // 1. Trường hợp 1 file duy nhất
  if (media.length === 1) {
    const item = media[0]
    const isVideo = item.contentType?.startsWith('video/')
    return (
      <YStack
        width={300}
        height={200}
        backgroundColor="$color5"
        onPress={() => onPressMedia(0)}
        cursor="pointer"
        borderRadius={8}
        overflow="hidden"
      >
        <ZStack fullscreen>
          {isVideo ? (
            <>
              {renderVideoItem(item.fileUrl, false)}
              <YStack fullscreen alignItems="center" justifyContent="center">
                <Play size={40} color="white" />
              </YStack>
            </>
          ) : (
            <Image
              source={{ uri: item.fileUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          )}
        </ZStack>
      </YStack>
    )
  }

  // 2. Trường hợp nhiều file (Grid)
  return (
    <XStack flexWrap="wrap" width={300} borderRadius={8} overflow="hidden">
      {displayMedia.map((item, idx) => {
        const isVideo = item.contentType?.startsWith('video/')
        const isLastItem = idx === displayLimit - 1 && remainingCount > 0

        return (
          <YStack
            key={item.fileUrl || idx}
            width="50%"
            height={150}
            borderWidth={0.5}
            borderColor="$background"
            position="relative"
            onPress={() => onPressMedia(idx)}
            cursor="pointer"
            hoverStyle={{ opacity: 0.9 }}
          >
            <ZStack fullscreen>
              {isVideo ? (
                <YStack
                  fullscreen
                  backgroundColor="black"
                  alignItems="center"
                  justifyContent="center"
                >
                  {renderVideoItem(item.fileUrl, true)}
                  <Play size={30} color="white" position="absolute" style={{ zIndex: 5 }} />
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
                  zIndex={10}
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
