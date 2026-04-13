import { useEffect, useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { Button, Dialog, Separator, Text, XStack, YStack, Circle } from '@my/ui'
import { Check, SendHorizontal, X } from '@tamagui/lucide-icons'
import { RoomType } from 'app/types/Enums'
import type { MessageResponse, RoomResponse } from 'app/types/Response'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: MessageResponse[]
  rooms: RoomResponse[]
  isLoadingRooms?: boolean
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
  rooms,
  isLoadingRooms = false,
  currentRoomId,
  isSubmitting = false,
  onConfirm,
}: Props) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(() => new Set())

  const availableRooms = useMemo(() => {
    return rooms
      .filter((room) => room.id !== currentRoomId)
      .slice()
      .sort((left, right) => left.roomName.localeCompare(right.roomName))
  }, [rooms, currentRoomId])

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
              <Text color="$color10" fontSize="$2">
                Chọn một hoặc nhiều phòng để gửi lại tin nhắn.
              </Text>
            </YStack>

            <Dialog.Close asChild>
              <Button size="$2" circular chromeless icon={X} />
            </Dialog.Close>
          </XStack>

          <YStack marginTop="$4" space="$2">
            <Text fontSize="$2" color="$color10">
              Sẽ chuyển {messages.length} tin nhắn
            </Text>

            {previewMessages.map((message, index) => (
              <YStack
                key={message.id}
                padding="$3"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                bg="$color2"
              >
                <Text fontSize="$2" color="$color10">
                  Tin nhắn {index + 1}
                </Text>
                <Text numberOfLines={2} fontSize="$3">
                  {message.content}
                </Text>
              </YStack>
            ))}

            {hasMoreMessages && (
              <Text fontSize="$2" color="$color10">
                Và {messages.length - previewMessages.length} tin nhắn khác
              </Text>
            )}
          </YStack>

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

          <YStack maxHeight={340} space="$2">
            {isLoadingRooms ? (
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
            ) : availableRooms.length === 0 ? (
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
            ) : (
              availableRooms.map((room) => {
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
                    >
                      <XStack alignItems="center" space="$3" flex={1}>
                        <Circle
                          size={44}
                          backgroundColor={selected ? '$blue10' : '$color5'}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text
                            fontSize="$2"
                            fontWeight="700"
                            color={selected ? 'white' : '$color11'}
                          >
                            {initials}
                          </Text>
                        </Circle>

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
              })
            )}
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
