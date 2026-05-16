import React from 'react'
import { Dialog, XStack, YStack, Text, Button, UnorderedList, ListItem, Separator } from 'tamagui'
import { X } from '@tamagui/lucide-icons'

interface ReactionDetailProps {
  summary: Record<string, number>
  open: boolean
  onOpenChange: (open: boolean) => void
}

const REACTION_MAP: Record<string, string> = {
  LIKE: '👍',
  HEART: '❤️',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡',
}

export function ReactionDetailModal({ summary, open, onOpenChange }: ReactionDetailProps) {
  const activeReactions = Object.entries(summary).filter(([_, count]) => count > 0)

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          width={200} // Cố định chiều rộng cho giống popup
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Dialog.Title asChild unstyled>
              <Text fontSize={18} color="$color" >
                Biểu cảm
              </Text>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="$2" circular backgroundColor={"white"} icon={X} />
            </Dialog.Close>
          </XStack>

          <YStack>
            {activeReactions.map(([type, count]) => (
              <XStack
                key={type}
                justifyContent="space-between"
                alignItems="center"
                p="$2"
                hoverStyle={{ backgroundColor: '$backgroundHover' }}
                borderRadius="$4"
              >
                <XStack space="$3" alignItems="center">
                  <Text fontSize={22}>{REACTION_MAP[type] || '👍'}</Text>
                </XStack>
                <Text fontWeight="bold" color="$blue10">{count}</Text>
              </XStack>
            ))}
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}