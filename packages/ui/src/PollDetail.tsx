import React, { useState } from 'react'
import { YStack, XStack, Text, Circle, Button, ZStack, Avatar } from 'tamagui'
import { BarChart2, CheckCircle2, Edit3 } from '@tamagui/lucide-icons'
import { MessageResponse } from 'app/types/Response'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'app/store'
import { chatApi, useVotePollMutation } from 'app/services/chatApi'
import { useGetProfileQuery } from 'app/services/userApi'
import { CreatePollSheet } from './CreatePollSheet'

type PollMode = 'PREVIEW' | 'DETAIL'

interface PollDetailProps {
  msg: MessageResponse
  roomId: string
  mode?: PollMode
  currentUserId?: string
}

export const PollDetail = ({ msg, roomId, mode = 'PREVIEW', currentUserId }: PollDetailProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const [votePoll] = useVotePollMutation()

  const metadata = msg.metadata || {}
  const msgId = msg.id

  let pollData: any = null
  try {
    pollData = JSON.parse(metadata.pollData || '{}')
  } catch (error) {
    return <Text color="$red10">Dữ liệu bình chọn bị lỗi</Text>
  }

  const { question, options = [], multipleChoice } = pollData
  const totalVotes = options.reduce((sum: number, opt: any) => sum + (opt.votedUserIds?.length || 0), 0)

  const handleVote = async (optionId: string) => {
    if (!currentUserId) return

    const patchResult = dispatch(
      chatApi.util.updateQueryData('getMessages', { roomId }, (draft) => {
        const message = draft.items.find((m) => m.id === msgId)
        if (!message || !message.metadata?.pollData) return
        const draftPollData = JSON.parse(message.metadata.pollData)
        let isToggleOn = false

        draftPollData.options.forEach((opt: any) => {
          if (opt.id === optionId) {
            const userIndex = opt.votedUserIds.indexOf(currentUserId)
            if (userIndex !== -1) opt.votedUserIds.splice(userIndex, 1)
            else {
              opt.votedUserIds.push(currentUserId)
              isToggleOn = true
            }
          }
        })

        if (!draftPollData.multipleChoice && isToggleOn) {
          draftPollData.options.forEach((opt: any) => {
            if (opt.id !== optionId) {
              opt.votedUserIds = opt.votedUserIds.filter((id: string) => id !== currentUserId)
            }
          })
        }
        message.metadata.pollData = JSON.stringify(draftPollData)
      })
    )

    try {
      await votePoll({ roomId, pollId: msgId, optionId }).unwrap()
    } catch (error) {
      patchResult.undo()
    }
  }

  return (
    <YStack space="$3" width="100%">
      <XStack alignItems="center" justifyContent="space-between">
        {
          mode === 'PREVIEW' &&
          <XStack alignItems="center" space="$2">
            <Circle size={28} bg="$blue3">
              <BarChart2 size={16} color="$blue10" />
            </Circle>
            <Text fontSize="$2" color="$color11" fontWeight="600">
              Cuộc bình chọn
            </Text>
          </XStack>
        }

        {/* Nút Mở Form Chỉnh Sửa */}
        {
          mode === 'PREVIEW' && <Button
            size="$2"
            circular
            chromeless
            icon={<Edit3 size={16} color="$color10" />}
            onPress={() => setIsEditOpen(true)}
          />
        }
      </XStack>

      <Text fontWeight="bold" fontSize="$6" color="$color12">
        {question}
      </Text>

      <YStack space="$2">
        {options.map((opt: any) => {
          const votesCount = opt.votedUserIds?.length || 0
          const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0
          const isVotedByMe = opt.votedUserIds?.includes(currentUserId)

          // Lấy 2 người đại diện từ metadata (đã được BE xử lý syncRecentVoters)
          const recentVoters = opt.recentVoters || []
          const extraCount = votesCount - recentVoters.length

          return (
            <YStack key={opt.id} space="$1">
              <Button
                p={0}
                height={48}
                bg="transparent"
                borderWidth={1}
                borderColor={isVotedByMe ? '$blue8' : '$borderColor'}
                borderRadius="$3"
                overflow="hidden"
                onPress={() => handleVote(opt.id)}
              >
                <ZStack fullscreen>
                  {/* Progress Bar */}
                  <YStack
                    height="100%"
                    width={`${percentage}%`}
                    bg={isVotedByMe ? '$blue4' : '$color3'}
                    animation="quick"
                  />

                  <XStack fullscreen px="$3" alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" space="$2" flex={1}>
                      {isVotedByMe && <CheckCircle2 size={18} color="$blue10" />}
                      <Text
                        fontWeight={isVotedByMe ? 'bold' : 'normal'}
                        color={isVotedByMe ? '$blue11' : '$color11'}
                        numberOfLines={1}
                        flex={1}
                      >
                        {opt.text}
                      </Text>
                    </XStack>

                    {/* Hiển thị Avatar chồng nhau ở Preview Mode */}
                    <XStack alignItems="center">
                      <XStack marginRight={extraCount > 0 ? "$1" : 0}>
                        {recentVoters.map((voter: any, idx: number) => (
                          <Avatar
                            key={voter.id}
                            circular
                            size="$1.5"
                            ml={idx > 0 ? -12 : 0}
                            borderWidth={2}
                            borderColor="$background"
                            zIndex={10 - idx}
                          >
                            <Avatar.Image source={{ uri: voter.avatar }} />
                            <Avatar.Fallback bg="$blue5" />
                          </Avatar>
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
        <Text fontSize="$2" color="$color10">
          {totalVotes} lượt bình chọn
        </Text>
        {multipleChoice && (
          <Text fontSize="$2" color="$color10">
            Chọn nhiều
          </Text>
        )}
      </XStack>

      <CreatePollSheet
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        roomId={roomId}
        initialPoll={msg}
      />
    </YStack>
  )
}