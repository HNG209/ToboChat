import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { Button, ListItem, Popover, Separator, Text, YStack, XStack } from '@my/ui'
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
  children: React.ReactNode
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
  children,
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
    return () => {
      if (hideHoverTimeoutRef.current) {
        clearTimeout(hideHoverTimeoutRef.current)
        hideHoverTimeoutRef.current = null
      }
    }
  }, [])

  const placement = useMemo(() => (isMe ? 'top-end' : 'top-start'), [isMe])

  if (!isWeb) return <>{children}</>

  const openMenu = () => {
    if (selectionMode) {
      onToggleSelected(message.id)
      return
    }
    setOpen(true)
  }

  const onContextMenu = (e: any) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    openMenu()
  }

  const onClick = (e: any) => {
    if (!selectionMode) return
    e?.stopPropagation?.()
    onToggleSelected(message.id)
  }

  const webEvents = isWeb
    ? ({
        onContextMenu,
        onClick: selectionMode ? onClick : undefined,
        onMouseEnter: () => {
          if (hideHoverTimeoutRef.current) {
            clearTimeout(hideHoverTimeoutRef.current)
            hideHoverTimeoutRef.current = null
          }
          setHovered(true)
        },
        onMouseLeave: () => {
          if (hideHoverTimeoutRef.current) clearTimeout(hideHoverTimeoutRef.current)
          // Give user time to move cursor to the trigger when it's offset.
          hideHoverTimeoutRef.current = setTimeout(() => {
            setHovered(false)
            hideHoverTimeoutRef.current = null
          }, 200)
        },
      } as any)
    : undefined

  const showTrigger = !selectionMode && (hovered || open)

  const itemStyle = {
    backgroundColor: '$backgroundHover',
    borderRadius: '$3',
    marginHorizontal: '$1',
    paddingVertical: '$2',
    hoverStyle: { backgroundColor: '$background' },
    pressStyle: { backgroundColor: '$background' },
  } as const

  return (
    <Popover size="$5" allowFlip placement={placement as any} open={open} onOpenChange={setOpen}>
      <YStack
        {...({
          position: 'relative',
          maxWidth: '75%',
          minWidth: 0,
          ...(webEvents ?? {}),
        } as any)}
      >
        <YStack>{children}</YStack>

        {!selectionMode && (
          <Popover.Trigger asChild>
            <Button
              aria-label="Mở menu"
              size="$2"
              circular
              chromeless
              icon={MoreHorizontal}
              onPress={() => setOpen(true)}
              {...({
                position: 'absolute',
                top: 6,
                zIndex: 10,
                opacity: showTrigger ? 1 : 0,
                pointerEvents: showTrigger ? 'auto' : 'none',
                ...(isMe ? { left: -30 } : { right: -30 }),
                backgroundColor: '$background',
                borderWidth: 1,
                borderColor: '$borderColor',
                hoverStyle: { backgroundColor: '$backgroundHover' },
              } as any)}
            />
          </Popover.Trigger>
        )}
      </YStack>

      <Popover.Content
        elevate
        backgroundColor="$backgroundHover"
        borderRadius="$4"
        padding="$2"
        borderWidth={1}
        borderColor="$borderColor"
      >
        {view === 'main' ? (
          <YStack width={200} paddingVertical="$2">
            <Popover.Close asChild>
              <ListItem
                icon={<Copy size={18} color="#3b82f6" />}
                title="Sao chép"
                onPress={() => onCopy(message)}
                {...itemStyle}
              />
            </Popover.Close>

            <Popover.Close asChild>
              <ListItem
                icon={<CornerUpLeft size={18} color="#10b981" />}
                title="Trả lời"
                onPress={() => onReply(message)}
                {...itemStyle}
              />
            </Popover.Close>

            <Popover.Close asChild>
              <ListItem
                icon={<Forward size={18} color="#6366f1" />}
                title="Chuyển tiếp"
                onPress={() => onForward(message)}
                {...itemStyle}
              />
            </Popover.Close>

            <Separator marginVertical="$2" />

            <Popover.Close asChild>
              <ListItem
                icon={<CheckSquare size={18} color="#f59e0b" />}
                title="Chọn nhiều tin"
                onPress={() => onEnterMultiSelect(message)}
                {...itemStyle}
              />
            </Popover.Close>

            {isMe ? (
              <ListItem
                icon={<Trash2 size={18} color="#ef4444" />}
                title="Xóa"
                onPress={() => setView('delete')}
                {...itemStyle}
              />
            ) : (
              <Popover.Close asChild>
                <ListItem
                  icon={<Trash2 size={18} color="#ef4444" />}
                  title="Xóa"
                  onPress={() => onDeleteForMe(message)}
                  {...itemStyle}
                />
              </Popover.Close>
            )}
          </YStack>
        ) : (
          <YStack width={220} paddingVertical="$2">
            <XStack
              alignItems="center"
              justifyContent="space-between"
              paddingHorizontal="$3"
              height={40}
            >
              <Button
                aria-label="Quay lại"
                size="$2"
                circular
                chromeless
                icon={ArrowLeft}
                onPress={() => setView('main')}
              />
              <Text fontWeight="700" fontSize={15}>
                Xóa tin nhắn
              </Text>
              <XStack width={28} />
            </XStack>

            <Separator marginVertical="$2" />

            <Popover.Close asChild>
              <ListItem
                icon={<Trash2 size={18} color="#ef4444" />}
                title="Xóa ở phía bạn"
                onPress={() => onDeleteForMe(message)}
                {...itemStyle}
              />
            </Popover.Close>

            <Popover.Close asChild>
              <ListItem
                icon={<Trash2 size={18} color="#ef4444" />}
                title="Thu hồi"
                onPress={() => onRecall?.(message)}
                {...itemStyle}
              />
            </Popover.Close>
          </YStack>
        )}
      </Popover.Content>
    </Popover>
  )
}
