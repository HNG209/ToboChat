import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Pressable } from 'react-native'
import { Button, Dialog, ListItem, Popover, Separator, Text, YStack, XStack } from '@my/ui'
import {
  ArrowLeft,
  CheckSquare,
  Copy,
  CornerUpLeft,
  Forward,
  MoreHorizontal,
  Trash2,
} from '@tamagui/lucide-icons'
import type { MessageResponse } from 'app/types/Response'

type Props = {
  message: MessageResponse
  isMe: boolean
  selectionMode: boolean
  isSelected: boolean
  onToggleSelected: (messageId: string) => void
  onCopy: (message: MessageResponse) => void | Promise<void>
  onReply: (message: MessageResponse) => void
  onForward: (message: MessageResponse) => void
  onEnterMultiSelect: (message: MessageResponse) => void
  onDeleteForMe: (message: MessageResponse) => void
  onRecall?: (message: MessageResponse) => void
  disabled?: boolean
  children: React.ReactNode
  onTap?: () => void
  triggerRef?: React.MutableRefObject<(() => void) | null>
}

export function MessageActionMenu({
  message,
  isMe,
  selectionMode,
  isSelected: _isSelected,
  onToggleSelected,
  onCopy,
  onReply,
  onForward,
  onEnterMultiSelect,
  onDeleteForMe,
  onRecall,
  disabled,
  children,
  onTap,
  triggerRef
}: Props) {
  const isWeb = Platform.OS === 'web'
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'main' | 'delete'>(() => 'main')
  const [hovered, setHovered] = useState(false)
  const hideHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) setView('main')
  }, [open])
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = () => {
        if (!disabled) setOpen(true)
      }
    }
  }, [disabled, triggerRef])
  useEffect(() => {
    return () => {
      if (hideHoverTimeoutRef.current) clearTimeout(hideHoverTimeoutRef.current)
    }
  }, [])

  // --- LOGIC KHÓA MENU CHO TIN NHẮN THU HỒI ---
  if (disabled) {
    return (
      <YStack
        maxWidth={isMe ? '100%' : isWeb ? '75%' : '100%'}
        alignItems={isMe ? 'flex-end' : 'flex-start'}
      >
        {children}
      </YStack>
    )
  }

  const placement = isMe ? 'top-end' : 'top-start'

  const tileBaseStyle = {
    backgroundColor: 'white',
    borderWidth: 0,
    borderRadius: '$3',
    hoverStyle: {
      backgroundColor: '$blue2', // Màu nền xanh nhạt khi hover
      borderColor: '$blue8',      // Border xanh đậm hơn  
      elevation: 2,               // Đổ bóng nhẹ
    },
    // Hiệu ứng khi nhấn (Mobile & Web)
    pressStyle: {
      backgroundColor: '$blue3',
      scale: 0.96,               // Thu nhỏ nhẹ tạo cảm giác bấm nút
      borderColor: '$blue10'
    },
  } as const

  const tileWrapStyle = {
    width: '50%',
    padding: '$1',
  } as const

  // --- GIAO DIỆN MOBILE ---
  // --- GIAO DIỆN MOBILE ---
  if (!isWeb) {
    const Tile = ({ title, icon, onPress, disabledTile }: any) => (
      <YStack {...(tileWrapStyle as any)}>
        <Button
          disabled={disabledTile}
          onPress={() => {
            setOpen(false)
            onPress()
          }}
          {...tileBaseStyle}
          height={72}
          padding="$2"
        >
          <YStack alignItems="center" justifyContent="center" space="$1">
            {icon}
            <Text fontSize="$1" textAlign="center" numberOfLines={2}>{title}</Text>
          </YStack>
        </Button>
      </YStack>
    )

    return (
      <>
        {/* Tách Dialog ra khỏi Trigger để kiểm soát hoàn toàn */}
        <Dialog modal open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Overlay
              key="overlay"
              animation="quick"
              opacity={0.5}
              backgroundColor="#000"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            >
              <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
            </Dialog.Overlay>

            <Dialog.Content
              key="content"
              bordered
              elevate
              animation="quick"
              enterStyle={{ opacity: 0, scale: 0.9, y: 10 }}
              exitStyle={{ opacity: 0, scale: 0.9, y: 10 }}
              width="90%"
              maxWidth={360}
              padding="$2"
              backgroundColor="$background"
              onPress={(e) => e.stopPropagation()}
            >
              {view === 'main' ? (
                <YStack paddingVertical="$1">
                  <XStack flexWrap="wrap">
                    <Tile title="Sao chép" icon={<Copy size={18} color="#3b82f6" />} onPress={() => onCopy(message)} />
                    <Tile title="Trả lời" icon={<CornerUpLeft size={18} color="#10b981" />} onPress={() => onReply(message)} />
                    <Tile title="Chuyển tiếp" icon={<Forward size={18} color="#6366f1" />} onPress={() => onForward(message)} />
                    <Tile title="Chọn nhiều" icon={<CheckSquare size={18} color="#f59e0b" />} onPress={() => onEnterMultiSelect(message)} />
                    {isMe ? (
                      <YStack {...(tileWrapStyle as any)}>
                        <Button
                          onPress={() => setView('delete')}
                          {...tileBaseStyle}
                          height={72}
                          padding="$2"
                        >
                          <YStack alignItems="center" justifyContent="center" space="$1">
                            <Trash2 size={18} color="#ef4444" />
                            <Text fontSize="$1" textAlign="center">Xóa</Text>
                          </YStack>
                        </Button>
                      </YStack>
                    ) : (
                      <Tile title="Xóa phía tôi" icon={<Trash2 size={18} color="#ef4444" />} onPress={() => onDeleteForMe(message)} />
                    )}
                  </XStack>
                </YStack>
              ) : (
                <YStack paddingVertical="$2">
                  <XStack alignItems="center" space="$2" px="$2" mb="$2">
                    <Button size="$2" circular chromeless icon={ArrowLeft} onPress={() => setView('main')} />
                    <Text fontWeight="700">Xóa tin nhắn</Text>
                  </XStack>
                  <XStack flexWrap="wrap">
                    <Tile title="Xóa phía mình" icon={<Trash2 size={18} color="#ef4444" />} onPress={() => onDeleteForMe(message)} />
                    {onRecall && (
                      <Tile title="Thu hồi" icon={<Trash2 size={18} color="#ef4444" />} onPress={() => onRecall(message)} />
                    )}
                  </XStack>
                </YStack>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>

        {/* ✅ Pressable độc lập, KHÔNG phải Dialog.Trigger */}
        <YStack
          alignItems={isMe ? 'flex-end' : 'flex-start'}
          onPress={selectionMode ? () => onToggleSelected(message.id) : undefined}
        >
          {children}
        </YStack>
      </>
    )
  }

  // --- GIAO DIỆN WEB ---
  const webEvents = {
    onContextMenu: (e: any) => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      setOpen(true)
    },
    onMouseEnter: () => {
      if (hideHoverTimeoutRef.current) clearTimeout(hideHoverTimeoutRef.current)
      setHovered(true)
    },
    onMouseLeave: () => {
      hideHoverTimeoutRef.current = setTimeout(() => setHovered(false), 200)
    },
  }

  const showTrigger = !selectionMode && (hovered || open)

  return (
    <Popover size="$5" allowFlip placement={placement as any} open={open} onOpenChange={setOpen}>
      <YStack position="relative" maxWidth="75%" minWidth={0} {...webEvents}>
        <YStack>{children}</YStack>
        {!selectionMode && (
          <Popover.Trigger asChild>
            <Button
              size="$2"
              circular
              chromeless
              icon={MoreHorizontal}
              onPress={() => setOpen(true)}
              position="absolute"
              top={6}
              zIndex={10}
              opacity={showTrigger ? 1 : 0}
              pointerEvents={showTrigger ? 'auto' : 'none'}
              {...(isMe ? { left: -30 } : { right: -30 })}
              backgroundColor="white"
              borderWidth={1}
              borderColor="$borderColor"
            />
          </Popover.Trigger>
        )}
      </YStack>

      <Popover.Content
        elevate
        backgroundColor="white"
        borderRadius="$4"
        padding="$2"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <YStack width={200} paddingVertical="$1" space="$1">
          {view === 'main' ? (
            <>
              <Popover.Close asChild>
                <ListItem
                  title="Sao chép"
                  icon={<Copy size={18} color="#3b82f6" />}
                  onPress={() => onCopy(message)}
                  {...tileBaseStyle}
                />
              </Popover.Close>
              <Popover.Close asChild>
                <ListItem
                  title="Trả lời"
                  icon={<CornerUpLeft size={18} color="#10b981" />}
                  onPress={() => onReply(message)}
                  {...tileBaseStyle}
                />
              </Popover.Close>
              <Popover.Close asChild>
                <ListItem
                  title="Chuyển tiếp"
                  icon={<Forward size={18} color="#6366f1" />}
                  onPress={() => onForward(message)}
                  {...tileBaseStyle}
                />
              </Popover.Close>
              <Separator marginVertical="$1" />
              <Popover.Close asChild>
                <ListItem
                  title="Chọn nhiều tin"
                  icon={<CheckSquare size={18} color="#f59e0b" />}
                  onPress={() => onEnterMultiSelect(message)}
                  {...tileBaseStyle}
                />
              </Popover.Close>
              {isMe ? (
                <ListItem
                  title="Xóa"
                  icon={<Trash2 size={18} color="#ef4444" />}
                  onPress={() => setView('delete')}
                  {...tileBaseStyle}
                />
              ) : (
                <Popover.Close asChild>
                  <ListItem
                    title="Xóa phía tôi"
                    icon={<Trash2 size={18} color="#ef4444" />}
                    onPress={() => onDeleteForMe(message)}
                    {...tileBaseStyle}
                  />
                </Popover.Close>
              )}
            </>
          ) : (
            <YStack space="$1">
              <XStack alignItems="center" space="$2" px="$2">
                <Button
                  size="$2"
                  circular
                  chromeless
                  icon={ArrowLeft}
                  onPress={() => setView('main')}
                />
                <Text fontWeight="700">Xóa</Text>
              </XStack>
              <Separator marginVertical="$1" />
              <Popover.Close asChild>
                <ListItem
                  title="Xóa phía mình"
                  icon={<Trash2 size={16} color="#ef4444" />}
                  onPress={() => onDeleteForMe(message)}
                  {...tileBaseStyle}
                />
              </Popover.Close>
              <Popover.Close asChild>
                <ListItem
                  title="Thu hồi"
                  icon={<Trash2 size={16} color="#ef4444" />}
                  onPress={() => onRecall?.(message)}
                  {...tileBaseStyle}
                />
              </Popover.Close>
            </YStack>
          )}
        </YStack>
      </Popover.Content>
    </Popover>
  )
}