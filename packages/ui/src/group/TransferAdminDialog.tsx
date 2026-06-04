import React, { useState } from 'react'
import {
  Dialog,
  Button,
  XStack,
  YStack,
  Text,
  Theme,
  Circle,
} from 'tamagui'
import { Check, X } from '@tamagui/lucide-icons'
import { StyledFlatList } from '../StyledFlatList'
import { ActivityIndicator, Platform } from 'react-native'
import {
  useGetMyInfoQuery,
  useGetRoomMembersQuery,
  useLeaveGroupMutation,
} from 'app/services/roomApi'
import { UserAvatar } from '../UserAvatar'

interface TransferAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: string
  onSuccess: () => void
}

export function TransferAdminDialog({
  open,
  onOpenChange,
  roomId,
  onSuccess,
}: TransferAdminDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const isWeb = Platform.OS === 'web'

  const { data: membersData, isLoading: membersLoading } = useGetRoomMembersQuery(
    { roomId },
    { skip: !open }
  )

  const { data: myInfo } = useGetMyInfoQuery(
    { roomId },
    { skip: !open }
  )

  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation()

  const handleTransferAndLeave = async () => {
    if (!selectedMemberId) {
      setErrorMsg('Vui lòng chọn 1 thành viên để nhường quyền trưởng nhóm.')
      return
    }

    setErrorMsg('')

    try {
      await leaveGroup({ roomId, newAdminId: selectedMemberId }).unwrap()
      handleClose()
      onSuccess()
    } catch (error) {
      console.error('Lỗi khi nhường quyền và rời nhóm:', error)
      setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  const handleClose = () => {
    if (isLeaving) return

    setSelectedMemberId(null)
    setErrorMsg('')
    onOpenChange(false)
  }

  const filteredMembers =
    membersData?.items?.filter((item: any) => {
      return item.member?.id !== myInfo?.id
    }) || []

  if (!open) return null

  const content = (
    <>
      <Dialog.Overlay
        key="overlay"
        animation="quick"
        opacity={0.5}
        backgroundColor="#000"
        zIndex={100000}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

      <Dialog.Content
        bordered
        elevate
        key="content"
        animation={['quick', { opacity: { overshootClamping: true } }]}
        enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
        exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
        x={0}
        y={0}
        scale={1}
        opacity={1}
        width="90%"
        maxWidth={400}
        borderRadius="$5"
        backgroundColor="$background"
        zIndex={100001}
      >
        <Button
          position="absolute"
          top="$3"
          right="$3"
          size="$2"
          circular
          icon={X}
          chromeless
          onPress={handleClose}
          zIndex={2}
        />

        <Dialog.Title fontSize="$8" fontWeight="bold" letterSpacing={0.15} mb="$2">
          Nhường quyền Trưởng nhóm
        </Dialog.Title>

        <Text color="$color10" fontSize="$3" mb="$4">
          Bạn là trưởng nhóm. Vui lòng chọn một thành viên khác để tiếp quản nhóm trước khi rời đi.
        </Text>

        <YStack space="$4">
          <YStack flexShrink={1} height={300}>
            <StyledFlatList
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$3"
              data={filteredMembers}
              keyExtractor={(item: any) => item.member.id}
              style={{ minHeight: 300 }}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                membersLoading ? (
                  <XStack justifyContent="center" alignItems="center" py="$4">
                    <ActivityIndicator size="small" color="#888" />
                  </XStack>
                ) : null
              }
              ListEmptyComponent={
                !membersLoading ? (
                  <YStack py="$6" alignItems="center">
                    <Text color="$color10" fontSize="$3">
                      Không có thành viên nào để nhường quyền
                    </Text>
                  </YStack>
                ) : null
              }
              contentContainerStyle={{ gap: 8, padding: 8 }}
              renderItem={({ item }: any) => {
                const member = item.member
                const isSelected = selectedMemberId === member.id

                return (
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    p="$3"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor={isSelected ? '$blue9' : '$borderColor'}
                    backgroundColor={isSelected ? '$blue3' : 'transparent'}
                    onPress={() => setSelectedMemberId(member.id)}
                    animation="quick"
                    pressStyle={{ scale: 0.98 }}
                  >
                    <XStack alignItems="center" space="$3" flex={1} minWidth={0}>
                      <UserAvatar id={member.id} name={member.name} avatarUrl={member.avatarUrl} size="$4" />

                      <Text
                        fontSize="$3"
                        fontWeight={isSelected ? '700' : '400'}
                        numberOfLines={1}
                        flexShrink={1}
                      >
                        {member.name}
                      </Text>
                    </XStack>

                    <Circle
                      size="$1.5"
                      borderWidth={isSelected ? 0 : 2}
                      borderColor="$gray8"
                      backgroundColor={isSelected ? '$blue9' : 'transparent'}
                    >
                      {isSelected && <Check size={14} color="white" />}
                    </Circle>
                  </XStack>
                )
              }}
            />
          </YStack>

          {errorMsg ? (
            <Text color="$red10" fontSize="$3" textAlign="center">
              {errorMsg}
            </Text>
          ) : null}

          <XStack justifyContent="flex-end" space="$2" mt="$2">
            <Button
              borderRadius="$10"
              onPress={handleClose}
              disabled={isLeaving}
            >
              Huỷ
            </Button>

            <Theme name="active">
              <Button
                onPress={handleTransferAndLeave}
                fontWeight="bold"
                backgroundColor="$red9"
                color="white"
                borderRadius="$10"
                hoverStyle={{ backgroundColor: '$red10' }}
                disabled={isLeaving || !selectedMemberId}
                opacity={isLeaving || !selectedMemberId ? 0.6 : 1}
              >
                {isLeaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  'Nhường quyền & Rời đi'
                )}
              </Button>
            </Theme>
          </XStack>
        </YStack>
      </Dialog.Content>
    </>
  )

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      {isWeb ? (
        <Dialog.Portal forceMount>{content}</Dialog.Portal>
      ) : (
        <YStack
          position="absolute"
          fullscreen
          zIndex={100000}
          alignItems="center"
          justifyContent="center"
        >
          {content}
        </YStack>
      )}
    </Dialog>
  )
}
