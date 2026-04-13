import React from 'react'
import { Image } from 'react-native'
import { YStack, XStack, Text, ZStack } from 'tamagui'
import { Play } from '@tamagui/lucide-icons'
import { Video, ResizeMode } from 'expo-av'

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

  const renderVideoItem = (url: string, isGrid: boolean) => (
    <Video
      source={{ uri: url }}
      resizeMode={ResizeMode.COVER}
      shouldPlay={false}
      isMuted={true}
      style={{ width: '100%', height: '100%', opacity: isGrid ? 0.8 : 1 }}
    />
  )

  if (media.length === 1) {
    const item = media[0]
    const isVideo = item.contentType?.startsWith('video/')
    return (
      <YStack
        width={300}
        height={200}
        backgroundColor="$color5"
        onPress={() => onPressMedia(0)}
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
          >
            <ZStack fullscreen>
              {isVideo ? (
                <YStack fullscreen backgroundColor="black" alignItems="center" justifyContent="center">
                  {renderVideoItem(item.fileUrl, true)}
                  <Play size={30} color="white" position="absolute" style={{ zIndex: 5 }} />
                </YStack>
              ) : (
                <Image source={{ uri: item.fileUrl }} style={{ width: '100%', height: '100%' }} />
              )}
              {isLastItem && (
                <YStack fullscreen backgroundColor="rgba(0,0,0,0.6)" alignItems="center" justifyContent="center" zIndex={10}>
                  <Text color="white" fontWeight="bold" fontSize="$6">+{remainingCount}</Text>
                </YStack>
              )}
            </ZStack>
          </YStack>
        )
      })}
    </XStack>
  )
}