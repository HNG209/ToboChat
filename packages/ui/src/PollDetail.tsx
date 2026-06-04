import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { YStack, XStack, Text, Circle, Button, ZStack } from 'tamagui'
import { BarChart2, CheckCircle2, Edit3 } from '@tamagui/lucide-icons'
import { MessageResponse } from 'app/types/Response'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'app/store'
import { chatApi } from 'app/services/chatApi'
import { CreatePollSheet } from './CreatePollSheet'
import { useGetProfileQuery } from 'app/services/userApi'
import { UserAvatar } from './UserAvatar'

type PollMode = 'PREVIEW' | 'DETAIL'

export interface PollDetailRef {
  submit: () => Promise<void>
}

interface PollDetailProps {
  msg: MessageResponse
  roomId: string
  mode?: PollMode
  currentUserId?: string // Có thể bỏ qua vì dùng hook bên trong
  onSubmit?: (optionIds: string[]) => Promise<void> | void
}

export const PollDetail = forwardRef<PollDetailRef, PollDetailProps>(
  ({ msg, roomId, mode = 'PREVIEW', currentUserId, onSubmit }, ref) => {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const dispatch = useDispatch<AppDispatch>()
    const { data: currentUser } = useGetProfileQuery()

    const metadata = msg.metadata || {}
    const msgId = msg.id

    let pollData: any = null
    try {
      pollData = JSON.parse(metadata.pollData || '{}')
    } catch (error) {
      return <Text color="$red10">Dữ liệu bình chọn bị lỗi</Text>
    }

    const { question, options = [], multipleChoice, allowAddOption } = pollData
    const isCreator = msg?.user && msg?.user.id === currentUser?.id
    const canAddOption = allowAddOption || isCreator

    const initialSelectedIds = options
      .filter((o: any) => o.votedUserIds.includes(currentUser?.id))
      .map((o: any) => o.id)

    const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>(initialSelectedIds)

    useEffect(() => {
      setDraftSelectedIds(initialSelectedIds)
    }, [msgId, metadata.pollData])

    const handleOptionClick = (clickedOptionId: string) => {
      if (!currentUser?.id || mode === 'PREVIEW') return

      if (!multipleChoice) {
        setDraftSelectedIds(draftSelectedIds.includes(clickedOptionId) ? [] : [clickedOptionId])
      } else {
        if (draftSelectedIds.includes(clickedOptionId)) {
          setDraftSelectedIds(draftSelectedIds.filter(id => id !== clickedOptionId))
        } else {
          setDraftSelectedIds([...draftSelectedIds, clickedOptionId])
        }
      }
    }

    // MỞ HÀM SUBMIT CHO COMPONENT CHA GỌI (Khi bấm nút Xác Nhận)
    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (JSON.stringify(initialSelectedIds.sort()) === JSON.stringify(draftSelectedIds.sort())) {
          return;
        }

        const updateDraftData = (messageObj: any) => {
          if (!messageObj.metadata?.pollData) return
          const draftPollData = JSON.parse(messageObj.metadata.pollData)

          draftPollData.options.forEach((opt: any) => {
            const isNowSelected = draftSelectedIds.includes(opt.id)
            const userIndex = opt.votedUserIds.indexOf(currentUser?.id)

            if (isNowSelected && userIndex === -1) {
              opt.votedUserIds.push(currentUser?.id)
              opt.recentVoters = opt.recentVoters || []
              opt.recentVoters = opt.recentVoters.filter((v: any) => v.id !== currentUser?.id)
              opt.recentVoters.push({ id: currentUser?.id, avatar: currentUser?.avatarUrl })
              if (opt.recentVoters.length > 2) opt.recentVoters.shift()
            } else if (!isNowSelected && userIndex !== -1) {
              opt.votedUserIds.splice(userIndex, 1)
              opt.recentVoters = (opt.recentVoters || []).filter((v: any) => v.id !== currentUser?.id)
            }
          })
          messageObj.metadata.pollData = JSON.stringify(draftPollData)
        }

        // Cập nhật Optimistic vào Redux Cache
        const patchMain = dispatch(
          chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
            const message = draft.items.find((m) => m.id === msgId)
            if (message) updateDraftData(message)
          })
        )
        const patchDialog = dispatch(
          chatApi.util.updateQueryData('getMessage', { roomId, messageId: msgId }, (draft) => {
            if (draft) updateDraftData(draft)
          })
        )

        // Gọi Callback onSubmit để bắn API
        if (onSubmit) {
          try {
            await onSubmit(draftSelectedIds)
          } catch (error) {
            patchMain.undo()
            patchDialog.undo()
            alert('Có lỗi xảy ra, vui lòng thử lại!')
          }
        }
      }
    }))

    const renderedOptions = options.map((opt: any) => {
      const isOriginallyVoted = opt.votedUserIds.includes(currentUser?.id)
      const isNowVoted = draftSelectedIds.includes(opt.id)

      const newOpt = { ...opt, votedUserIds: [...opt.votedUserIds], recentVoters: [...(opt.recentVoters || [])] }

      if (!isOriginallyVoted && isNowVoted) {
        newOpt.votedUserIds.push(currentUser?.id)
        newOpt.recentVoters = newOpt.recentVoters.filter((v: any) => v.id !== currentUser?.id)
        newOpt.recentVoters.push({ id: currentUser?.id, avatar: currentUser?.avatarUrl })
        if (newOpt.recentVoters.length > 2) newOpt.recentVoters.shift()
      } else if (isOriginallyVoted && !isNowVoted) {
        newOpt.votedUserIds = newOpt.votedUserIds.filter((id: string) => id !== currentUser?.id)
        newOpt.recentVoters = newOpt.recentVoters.filter((v: any) => v.id !== currentUser?.id)
      }
      return newOpt
    })

    const renderedTotalVotes = renderedOptions.reduce((sum: number, opt: any) => sum + opt.votedUserIds.length, 0)

    return (
      <YStack space="$3" width="100%">
        <XStack alignItems="center" justifyContent="space-between">
          {mode === 'PREVIEW' && (
            <XStack alignItems="center" space="$2">
              <Circle size={28} bg="$blue3">
                <BarChart2 size={16} color="$blue10" />
              </Circle>
              <Text fontSize="$2" color="$color11" fontWeight="600">
                Cuộc bình chọn
              </Text>
            </XStack>
          )}

          {(mode === 'PREVIEW' && canAddOption) && (
            <Button size="$2" circular chromeless icon={<Edit3 size={16} color="$color10" />} onPress={() => setIsEditOpen(true)} />
          )}
        </XStack>

        <Text fontWeight="bold" fontSize="$6" color="$color12">{question}</Text>

        <YStack space="$2">
          {renderedOptions.map((opt: any) => {
            const votesCount = opt.votedUserIds.length
            const percentage = renderedTotalVotes > 0 ? Math.round((votesCount / renderedTotalVotes) * 100) : 0
            const isVotedByMe = opt.votedUserIds.includes(currentUser?.id)

            const recentVoters = opt.recentVoters || []
            const extraCount = votesCount - recentVoters.length

            return (
              <YStack key={opt.id} space="$1">
                <Button
                  p={0}
                  bg="transparent"
                  borderWidth={1}
                  borderColor={isVotedByMe ? '$blue8' : '$borderColor'}
                  borderRadius="$3"
                  overflow="hidden"
                  onPress={() => handleOptionClick(opt.id)}
                  pointerEvents={mode === 'PREVIEW' ? 'none' : 'auto'}
                >
                  <ZStack width="100%" minHeight={48}>
                    <YStack height="100%" width={`${percentage}%`} bg={isVotedByMe ? '$blue4' : '$color3'} animation="quick" />

                    <XStack width="100%"
                      minHeight={48}
                      py="$2" px="$3" alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" space="$2" flex={1}>
                        {isVotedByMe && <CheckCircle2 size={18} color="$blue10" />}
                        <Text fontWeight={isVotedByMe ? 'bold' : 'normal'} color={isVotedByMe ? '$blue11' : '$color11'} flex={1} flexShrink={1} flexWrap="wrap">
                          {opt.text}
                        </Text>
                      </XStack>

                      <XStack alignItems="center">
                        <XStack marginRight={extraCount > 0 ? "$1" : 0}>
                          {recentVoters.map((voter: any, idx: number) => (
                            <UserAvatar
                              key={voter.id}
                              id={voter.id}
                              avatarUrl={voter.avatar}
                              size="$1.5"
                              ml={idx > 0 ? -12 : 0}
                              borderWidth={2}
                              borderColor="$background"
                              zIndex={10 - idx}
                            />
                          ))}
                        </XStack>

                        {extraCount > 0 && (
                          <Circle size={24} bg="$color5" ml={-10} borderWidth={2} borderColor="$background">
                            <Text fontSize={10} fontWeight="bold">+{extraCount}</Text>
                          </Circle>
                        )}

                        <Text fontSize="$3" color="$color10" fontWeight="600" ml="$2">
                          {votesCount > 0 ? votesCount : ''}
                        </Text>
                      </XStack>
                    </XStack>
                  </ZStack>
                </Button>
              </YStack>
            )
          })}
        </YStack>

        <XStack justifyContent="space-between" alignItems="center" mt="$1">
          <Text fontSize="$2" color="$color10">{renderedTotalVotes} lượt bình chọn</Text>
          {multipleChoice && <Text fontSize="$2" color="$color10">Chọn nhiều</Text>}
        </XStack>

        <CreatePollSheet isOpen={isEditOpen} onOpenChange={setIsEditOpen} roomId={roomId} initialPoll={msg} />
      </YStack >
    )
  }
)
