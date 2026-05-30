import React, { useState } from 'react'
import {
  YStack,
  XStack,
  Text,
  Tabs,
  SizableText,
  Spinner,
  Button,
  Image,
  Circle,
  Separator
} from 'tamagui'
import { FileText, Image as LucideImage, ChevronRight, ArrowLeft } from '@tamagui/lucide-icons'
import { useGetRoomAttachmentsQuery } from 'app/services/roomApi'
import { Linking, Platform } from 'react-native'
import { StyledFlatList } from '@my/ui/src/StyledFlatList'
import { AttachmentType } from 'app/types/Enums'
import { MediaViewer } from './media/MediaViewer'
type ConversationAttachmentsProps = {
  roomId: string
  onClose: () => void
}

export const ConversationAttachments = ({ roomId, onClose }: ConversationAttachmentsProps) => {
  const [activeTab, setActiveTab] = useState<AttachmentType>('MEDIA')
  const [viewerVisible, setViewerVisible] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [cursorMap, setCursorMap] = useState<Record<AttachmentType, string | undefined>>({
    MEDIA: undefined,
    FILE: undefined
  })

  const { data, isLoading, isFetching } = useGetRoomAttachmentsQuery({
    roomId,
    type: activeTab,
    limit: 15,
    cursor: cursorMap[activeTab]
  })

  const displayItems = React.useMemo(() => {
    if (isFetching && !cursorMap[activeTab]) {
      return []
    }
    return data?.items || []
  }, [data, isFetching, activeTab, cursorMap])

  const hasNextPage = !!data?.nextCursor

  const handleOpenFile = (url: string) => {
    if (!url) return
    if (Platform.OS === 'web') {
      window.open(url, '_blank')
    } else {
      Linking.openURL(url).catch((err) => console.error("Không thể mở liên kết:", err))
    }
  }

  const formatBytes = (bytes?: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  const handleLoadMore = () => {
    if (data?.nextCursor && !isFetching) {
      setCursorMap(prev => ({ ...prev, [activeTab]: data.nextCursor }))
    }
  }

  // --- HÀM RENDER ITEM CHO FLATLIST ---
  const renderAttachmentItem = ({
    item,
    index,
  }: {
    item: any
    index: number
  }) => {
    if (activeTab === 'MEDIA') {
      return (
        <Button
          key={item.attachmentId}
          flex={1}
          aspectRatio={1}
          p={0}
          width="100%" height="100%"
          mb={4}
          overflow="hidden"
          borderRadius="$2"
          onPress={() => {
            setViewerIndex(index)
            setViewerVisible(true)
          }}

        >
          <Image source={{ uri: item.detail.fileUrl }} width="100%" height="100%" resizeMode="cover" />
        </Button>
      )
    }

    // Giao diện render cho FILE
    return (
      <XStack
        key={item.attachmentId}
        p="$2"
        m="$1"
        borderRadius="$3"
        alignItems="center"
        space="$3"
        hoverStyle={{ backgroundColor: "$backgroundHover" }}
        onPress={() => handleOpenFile(item.detail.fileUrl)}
      >
        <Circle size={36} backgroundColor="$blue3">
          <FileText size={18} color="$blue10" />
        </Circle>
        <YStack flex={1} overflow="hidden">
          <Text fontSize="$3" fontWeight="600" numberOfLines={1} ellipse>
            {item.detail.fileName}
          </Text>
          <Text fontSize="$2" color="$color10">
            {formatBytes(item.detail.fileSize)}
          </Text>
        </YStack>
        <ChevronRight size={16} opacity={0.4} />
      </XStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background" width="100%">
      {/* --- HEADER TRANG ĐÍNH KÈM --- */}
      <XStack p="$3" alignItems="center" borderBottomWidth={0.5} borderColor="$borderColor">
        <Button icon={ArrowLeft} chromeless circular onPress={onClose} />
        <Text fontWeight="700" fontSize="$5" ml="$2" color="$color">
          Kho lưu trữ hội thoại
        </Text>
      </XStack>

      {/* --- PHẦN CHIA TABS --- */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as AttachmentType)}
        orientation="horizontal"
        size="$3"
        flexDirection="column"
        flex={1}
      >
        <Tabs.List loop={false} borderBottomWidth={0.5} borderColor="$borderColor" justifyContent="space-around">
          <Tabs.Tab flex={1} value="MEDIA" backgroundColor="transparent">
            <SizableText fontSize="$3" fontWeight={activeTab === 'MEDIA' ? "700" : "500"}>
              Ảnh & Video
            </SizableText>
          </Tabs.Tab>
          <Tabs.Tab flex={1} value="FILE" backgroundColor="transparent">
            <SizableText fontSize="$3" fontWeight={activeTab === 'FILE' ? "700" : "500"}>
              File tài liệu
            </SizableText>
          </Tabs.Tab>
        </Tabs.List>

        {isLoading || (isFetching && displayItems.length === 0) ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner size="small" color="$blue10" />
          </YStack>
        ) : displayItems.length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" space="$2">
            {activeTab === 'MEDIA' ? <LucideImage size={24} opacity={0.3} /> : <FileText size={24} opacity={0.3} />}
            <Text fontSize="$2" color="$color10">Chưa có tệp dữ liệu</Text>
          </YStack>
        ) : (
          <YStack flex={1} p="$2" width="100%">
            <StyledFlatList
              key={activeTab}
              data={displayItems}
              renderItem={renderAttachmentItem}
              keyExtractor={(item) => item.attachmentId}
              numColumns={activeTab === 'MEDIA' ? 3 : 1}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom: 20,
                gap: activeTab === 'MEDIA' ? 4 : 0
              }}
              onEndReached={() => {
                if (hasNextPage) {
                  handleLoadMore()
                }
              }}
              onEndReachedThreshold={0.5}
              columnWrapperStyle={
                activeTab === 'MEDIA'
                  ? { gap: 4, justifyContent: 'flex-start' }
                  : undefined
              }

              ListFooterComponent={
                isFetching && cursorMap[activeTab] ? (
                  <XStack justifyContent="center" py="$3" width="100%">
                    <Spinner size="small" color="$blue10" />
                  </XStack>
                ) : null
              }
            />
          </YStack>
        )}
      </Tabs>
      <MediaViewer
        visible={viewerVisible}
        mediaList={displayItems.map(item => ({
          fileUrl: item.detail.fileUrl,
          fileName: item.detail.fileName,
          contentType: item.detail.contentType,
        }))}
        activeIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
        onNext={() => {
          if (viewerIndex < displayItems.length - 1) {
            setViewerIndex(prev => prev + 1)
          }
        }}
        onPrev={() => {
          if (viewerIndex > 0) {
            setViewerIndex(prev => prev - 1)
          }
        }}
      />
    </YStack>
  )
}