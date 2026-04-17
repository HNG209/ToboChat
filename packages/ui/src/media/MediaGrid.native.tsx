import React from 'react'
import { Image, Pressable } from 'react-native'
import { YStack, XStack, Text, ZStack } from 'tamagui'
import { Play } from '@tamagui/lucide-icons'
import { Video, ResizeMode } from 'expo-av'

export const MediaGrid = ({
  media,
  onPressMedia,
  onLongPress,
  selectionMode,
  isSelected,
  onToggleSelect,
  messageId,
}: {
  media: any[]
  onPressMedia?: (index: number) => void
  onLongPress?: () => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  messageId?: string
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
    if (selectionMode && messageId) {
      onToggleSelect?.(messageId)
    } else if (!selectionMode && onPressMedia) {
      onPressMedia(index)
    }
  }

  const handleLongPress = () => {
    if (!selectionMode && onLongPress) {
      onLongPress()
    }
  }

  if (media.length === 1) {
    const item = media[0]
    const isVideo = item.contentType?.startsWith('video/')
    return (
      <Pressable
        onPress={() => handlePress(0)}
        onLongPress={handleLongPress}
        delayLongPress={250}
      >
        <YStack
          width={300}
          height={200}
          backgroundColor="$color5"
          borderRadius={8}
          overflow="hidden"
          opacity={selectionMode && isSelected ? 0.6 : 1}
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
      </Pressable>
    )
  }

  return (
    <XStack flexWrap="wrap" width={300} borderRadius={8} overflow="hidden">
      {displayMedia.map((item, idx) => {
        const isVideo = item.contentType?.startsWith('video/')
        const isLastItem = idx === displayLimit - 1 && remainingCount > 0

        return (
          <Pressable
            key={item.fileUrl || idx}
            onPress={() => handlePress(idx)}
            onLongPress={handleLongPress}
            delayLongPress={250}
            style={{ width: '50%', height: 150 }}
          >
            <YStack
              flex={1}
              borderWidth={0.5}
              borderColor="$background"
              position="relative"
              opacity={selectionMode && isSelected ? 0.6 : 1}
            >
              <ZStack fullscreen>
                {isVideo ? (
                  <YStack fullscreen backgroundColor="black" alignItems="center" justifyContent="center">
                    {renderVideoItem(item.fileUrl, true)}
                    <Play size={30} color="white" position="absolute" style={{ zIndex: 5 }} />
                  </YStack>
                ) : (
                  <Image
                    source={{ uri: item.fileUrl }}
                    style={{ width: '100%', height: '100%' }}
                  />
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
          </Pressable>
        )
      })}
    </XStack>
  )
}