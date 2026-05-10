import { useEffect, useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { Button, Dialog, Separator, Text, XStack, YStack, Circle, Spinner, Avatar } from '@my/ui'
import { Check, SendHorizontal, X } from '@tamagui/lucide-icons'
import { RoomType } from 'app/types/Enums'
import type { MessageResponse, RoomResponse } from 'app/types/Response'
import { StyledFlatList } from './StyledFlatList'
import { useGetJoinedRoomsQuery } from 'app/services/roomApi'
import { useSelector } from 'react-redux'
import { RootState } from 'app/store'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: MessageResponse[]
  currentRoomId: string
  isSubmitting?: boolean
  onConfirm: (roomIds: string[]) => Promise<void>
}

function getRoomKindLabel(roomType: RoomType) {
  return roomType === 'GROUP' ? 'Nhóm' : 'Trò chuyện riêng'
}

export function ForwardMessageDialog({
  open,
  onOpenChange,
  messages,
  currentRoomId,
  isSubmitting = false,
  onConfirm,
}: Props) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(() => new Set())
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const hasSession = useSelector((s: RootState) => s.auth.hasSession)

  // Lấy danh sách phòng từ RTK Query
  const { data, isLoading, isError } = useGetJoinedRoomsQuery(
    { status: 'ACTIVE', cursor },
    { skip: !hasSession }
  )

  // Loại bỏ phòng hiện tại và sắp xếp
  const availableRooms = useMemo(() => {
    return (data?.items ?? [])
      .filter((room) => room.id !== currentRoomId)
      .slice()
      .sort((left, right) => left.roomName.localeCompare(right.roomName))
  }, [data, currentRoomId])

  useEffect(() => {
    if (!open) {
      setSelectedRoomIds(new Set())
      return
    }
    setSelectedRoomIds(new Set())
  }, [open])

  const selectedCount = selectedRoomIds.size
  const previewMessages = messages.slice(0, 3)
  const hasMoreMessages = messages.length > previewMessages.length

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev)
      if (next.has(roomId)) next.delete(roomId)
      else next.add(roomId)
      return next
    })
  }

  const toggleAllRooms = () => {
    setSelectedRoomIds((prev) => {
      if (availableRooms.length === 0) return new Set()
      if (prev.size === availableRooms.length) return new Set()
      return new Set(availableRooms.map((room) => room.id))
    })
  }

  const handleConfirm = async () => {
    if (selectedRoomIds.size === 0 || messages.length === 0) return
    try {
      await onConfirm(Array.from(selectedRoomIds))
      onOpenChange(false)
    } catch (error) {
      console.error('Forward failed:', error)
    }
  }

  const handleFetchMore = () => {
    if (isFetchingMore || !data?.nextCursor) return
    setIsFetchingMore(true)
    setCursor(data.nextCursor)
    setTimeout(() => setIsFetchingMore(false), 1000)
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Close asChild>
          <Dialog.Overlay
            key="overlay"
            animation="100ms"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="#000"
          />
        </Dialog.Close>

        <Dialog.Content
          key="content"
          bordered
          elevate
          animation="100ms"
          enterStyle={{ opacity: 0, scale: 0.98 }}
          exitStyle={{ opacity: 0, scale: 0.98 }}
          padding="$4"
          width="92%"
          maxWidth={560}
          backgroundColor="$background"
        >
          <XStack alignItems="center" justifyContent="space-between" gap="$3">
            <YStack flex={1}>
              <Text fontSize="$6" fontWeight="700">
                Chuyển tiếp tin nhắn
              </Text>
            </YStack>

            <Dialog.Close asChild>
              <Button size="$2" circular chromeless icon={X} />
            </Dialog.Close>
          </XStack>

          <Separator marginVertical="$4" />

          <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
            <Text fontSize="$4" fontWeight="700">
              Chọn phòng
            </Text>

            <Button size="$2" chromeless onPress={toggleAllRooms}>
              {selectedRoomIds.size === availableRooms.length && availableRooms.length > 0
                ? 'Bỏ chọn tất cả'
                : 'Chọn tất cả'}
            </Button>
          </XStack>

          <YStack maxHeight={340}>
            <StyledFlatList<RoomResponse>
              data={availableRooms}
              keyExtractor={room => room.id}
              renderItem={({ item: room }) => {
                const selected = selectedRoomIds.has(room.id)
                const initials = room.roomName.trim().slice(0, 2).toUpperCase() || 'PH'
                return (
                  <Pressable key={room.id} onPress={() => toggleRoom(room.id)}>
                    <XStack
                      alignItems="center"
                      justifyContent="space-between"
                      padding="$3"
                      borderWidth={1}
                      borderRadius="$4"
                      borderColor={selected ? '$blue9' : '$borderColor'}
                      backgroundColor={selected ? '$blue2' : '$background'}
                      marginBottom="$2"
                    >
                      <XStack alignItems="center" space="$3" flex={1}>
                        <Avatar circular size="$4">
                          <Avatar.Image
                            src={room.avatarUrl
                              || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.roomName)}&background=random`}
                          />
                        </Avatar>
                        <YStack flex={1}>
                          <Text fontSize="$4" fontWeight="700" numberOfLines={1}>
                            {room.roomName}
                          </Text>
                          <Text fontSize="$2" color="$color10">
                            {getRoomKindLabel(room.roomType)}
                          </Text>
                        </YStack>
                      </XStack>
                      {selected ? (
                        <Circle
                          size={22}
                          backgroundColor="$blue10"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Check size={12} color="white" />
                        </Circle>
                      ) : (
                        <Circle
                          size={22}
                          borderWidth={1}
                          borderColor="$borderColor"
                          backgroundColor="$background"
                        />
                      )}
                    </XStack>
                  </Pressable>
                )
              }}
              ListEmptyComponent={
                isLoading ? (
                  <YStack
                    padding="$4"
                    borderWidth={1}
                    borderStyle="dashed"
                    borderColor="$borderColor"
                    borderRadius="$4"
                    alignItems="center"
                  >
                    <Text color="$color10">Đang tải danh sách phòng...</Text>
                  </YStack>
                ) : (
                  <YStack
                    padding="$4"
                    borderWidth={1}
                    borderStyle="dashed"
                    borderColor="$borderColor"
                    borderRadius="$4"
                    alignItems="center"
                  >
                    <Text color="$color10">Không có phòng nào để chuyển tiếp.</Text>
                  </YStack>
                )
              }
              onEndReached={handleFetchMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={isFetchingMore ? <Spinner size="small" color="$blue10" /> : null}
              style={{ maxHeight: 340 }}
            />
          </YStack>

          <XStack justifyContent="flex-end" space="$2" marginTop="$4">
            <Dialog.Close asChild>
              <Button size="$3" chromeless>
                Hủy
              </Button>
            </Dialog.Close>

            <Button
              size="$3"
              theme="blue"
              icon={<SendHorizontal size={16} />}
              disabled={selectedCount === 0 || messages.length === 0 || isSubmitting}
              opacity={selectedCount === 0 || messages.length === 0 || isSubmitting ? 0.6 : 1}
              onPress={handleConfirm}
            >
              Gửi
            </Button>
          </XStack>
          <YStack marginTop="$4" space="$2" alignItems="center">
            <XStack alignItems="center" space="$2">
              <SendHorizontal size={18} color="$blue10" />
              <Text fontSize="$4" fontWeight="700" color="$color10">
                {messages.length} tin nhắn sẽ được chuyển tiếp
              </Text>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
