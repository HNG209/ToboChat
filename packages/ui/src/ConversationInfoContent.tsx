import React, { useState } from 'react'
import {
  Avatar,
  Button,
  Circle,
  ListItem,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack,
  Heading,
  Theme,
  Input
} from "tamagui"
import {
  Edit3,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  LogOut,
  X,
  Bell,
  Search,
  ArrowLeft,
  Camera
} from "@tamagui/lucide-icons"
import { Alert, Platform } from 'react-native'
import { RoomMemberResponse, RoomResponse } from "app/types/Response"
import { roomApi, useCheckLeaveMutation, useGetMyInfoQuery, useGetRoomAttachmentsQuery, useLeaveGroupMutation } from 'app/services/roomApi'
import { TransferAdminDialog } from './group/TransferAdminDialog'
import { useRouter } from 'solito/navigation'
import { AppDispatch } from 'app/store'
import { useDispatch } from 'react-redux';
import { View } from 'tamagui'
import { Image } from 'tamagui'
import { useUpdateRoomNameMutation } from 'app/services/roomApi'
import { EditAvatar } from './EditAvatar'
import { UserAvatar } from './UserAvatar'
type ConversationInfoProps = {
  roomData: RoomResponse | undefined
  roomId: string
  onClose: () => void
  onLeaveGroup?: () => void
  onAddMember?: () => void
  onManageGroup?: () => void
  onViewMembers: () => void
  onApproveMembers: () => void,
  avatarCacheKey?: number
  onViewAttachments: () => void
  avatarUrlOverride?: string
  avatarSeed?: string
  onSaveAvatar: (data: { avatar?: File }) => void
}

export const ConversationInfoContent = ({
  roomData,
  roomId,
  onClose,
  onLeaveGroup,
  onAddMember,
  onManageGroup,
  onViewMembers,
  onApproveMembers,
  avatarCacheKey,
  avatarUrlOverride,
  avatarSeed,
  onViewAttachments,
  onSaveAvatar,
}: ConversationInfoProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter();
  const [checkLeave, { isLoading: isChecking }] = useCheckLeaveMutation()
  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation()
  const [openEditAvatar, setOpenEditAvatar] = useState(false)
  const [updateRoomName] = useUpdateRoomNameMutation()
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(roomData?.roomName || '')

  const { data: myInfo } = useGetMyInfoQuery({ roomId });

  const withCacheBuster = (url?: string) => {
    if (!url || !avatarCacheKey) return url
    return `${url}${url.includes('?') ? '&' : '?'}v=${avatarCacheKey}`
  }

  const effectiveAvatarUrl = avatarUrlOverride ?? roomData?.avatarUrl
  const [openTransferAdmin, setOpenTransferAdmin] = useState(false) // State cho Modal chuyển quyền
  const isWeb = Platform.OS === 'web'
  const isGroup = roomData?.roomType === "GROUP"
  const { data: mediaData } = useGetRoomAttachmentsQuery({
    roomId,
    type: "MEDIA",
    limit: 3,
  })

  const { data: fileData } = useGetRoomAttachmentsQuery({
    roomId,
    type: "FILE",
    limit: 3,
  })

  const previewMedia = mediaData?.items ?? []
  const previewFiles = fileData?.items ?? []
  const handleLeaveGroupPress = async () => {
    try {
      // 1. Check quyền rời nhóm
      const res = await checkLeave({ roomId }).unwrap();

      if (res.canLeave) {
        // 2. Nếu là MEMBER -> Cho phép rời luôn, hiển thị confirm an toàn
        const confirmMessage = 'Bạn có chắc chắn muốn rời khỏi nhóm này không?';

        if (isWeb) {
          if (window.confirm(confirmMessage)) {
            await executeLeaveGroup();
          }
        } else {
          Alert.alert('Rời nhóm', confirmMessage, [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Rời đi', style: 'destructive', onPress: executeLeaveGroup }
          ]);
        }
      } else if (res.reason === "TRANSFER_REQUIRED") {
        // 3. Nếu là ADMIN -> Mở modal chọn người kế nhiệm
        setOpenTransferAdmin(true);
      }
    } catch (error) {
      console.error("Lỗi khi check quyền rời nhóm:", error);
      // Xử lý thông báo lỗi UI ở đây
    }
  }

  const handleSaveName = async () => {
    try {
      if (!nameInput.trim()) return

      await updateRoomName({
        roomId,
        roomName: nameInput.trim(),
      }).unwrap()

      // update cache RTK
      dispatch(
        roomApi.util.updateQueryData('getRoomMetadata', { roomId }, (draft) => {
          if (draft) {
            draft.roomName = nameInput.trim()
          }
        })
      )

      setIsEditingName(false)
    } catch (err) {
      console.error(err)
    }
  }

  const executeLeaveGroup = async () => {
    try {
      await leaveGroup({ roomId }).unwrap();
      onClose(); // Đóng sidebar/panel thông tin sau khi rời thành công
      dispatch(
        roomApi.util.updateQueryData(
          'getJoinedRooms',
          { status: 'ACTIVE' },
          (draft) => {
            const index = draft.items?.findIndex((r) => r.id === roomId)
            if (index !== undefined && index !== -1) {
              draft.items.splice(index, 1)
            }
          }
        )
      );

      router.replace("/chat")
    } catch (error) {
      console.error("Lỗi khi rời nhóm:", error);
    }
  }

  // Sửa containerProps để đảm bảo luôn chiếm diện tích trên Native
  const containerStyle = !isWeb ? {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '$background',
  } : {
    flex: 1,
    minWidth: 320,
    maxWidth: 400,
    borderLeftWidth: 1,
    borderColor: '$borderColor',
    backgroundColor: '$background',
  }

  return (
    <YStack flex={1} backgroundColor="$background" width="100%">
      {/* --- HEADER --- */}
      <XStack
        p="$3"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={0.5}
        borderColor="$borderColor"
        backgroundColor="$background"
      >
        <XStack
          alignItems="center"
          justifyContent="center" // Căn giữa nội dung bên trong
          paddingVertical="$1"
          minHeight={45} // Đảm bảo chiều cao header ổn định
          width="100%"
          position="relative"
        >
          {/* NÚT BACK (Mobile) - Căn trái tuyệt đối */}
          {!isWeb && (
            <Button
              icon={ArrowLeft}
              chromeless
              circular
              onPress={onClose}
              position="absolute"
              left="$2"
              backgroundColor="transparent"
            />
          )}

          {/* TIÊU ĐỀ - Luôn ở giữa */}
          <Text fontWeight="700" fontSize="$5" color="$color" textAlign="center">
            {isGroup ? 'Thông tin nhóm' : 'Thông tin hội thoại'}
          </Text>

          {/* NÚT X (Web) - Căn phải tuyệt đối */}
          {isWeb && (
            <Button
              icon={X}
              chromeless
              circular
              onPress={onClose}
              position="absolute"
              right="$2"
              backgroundColor="transparent"
            />
          )}
        </XStack>
      </XStack>


      <TransferAdminDialog
        roomId={roomId}
        open={openTransferAdmin}
        onOpenChange={setOpenTransferAdmin}
        onSuccess={() => {
          setOpenTransferAdmin(false);
          dispatch(
            roomApi.util.updateQueryData(
              'getJoinedRooms',
              { status: 'ACTIVE' },
              (draft) => {
                const index = draft.items?.findIndex((r) => r.id === roomData?.id)
                if (index !== undefined && index !== -1) {
                  draft.items.splice(index, 1)
                }
              }
            )
          );
          router.replace("/chat")
          onClose(); // Đóng trang info sau khi đã nhường quyền và rời nhóm
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- PROFILE SECTION --- */}
        <YStack alignItems="center" py="$6" px="$4" space="$3">
          <View position="relative">
            <UserAvatar
              id={avatarSeed ?? roomData?.id}
              name={roomData?.roomName || 'Room'}
              avatarUrl={effectiveAvatarUrl}
              size="$8"
              borderWidth={1}
              borderColor="$borderColor"
            />

            <Button
              position="absolute"
              bottom={0}
              right={0}
              size="$2"
              circular
              icon={Camera}
              backgroundColor="$background"
              borderWidth={1}
              borderColor="$borderColor"
              aria-label="Chỉnh sửa avatar"
              disabled={!myInfo?.permissions?.canUpdateMetadata}
              opacity={!myInfo?.permissions?.canUpdateMetadata ? 0.4 : 1}
              pointerEvents={!myInfo?.permissions?.canUpdateMetadata ? 'none' : 'auto'}
              onPress={() => {
                setOpenEditAvatar(true)
              }}
            />
          </View>
          <YStack alignItems="center" space="$1">
            <XStack alignItems="center" justifyContent="center" space="$2" px="$5">
              {isEditingName ? (
                <XStack
                  alignItems="center"
                  space="$2"
                  borderRadius="$10"
                  px="$3"
                  py="$2"
                >
                  <Input
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                    width={180}
                    borderWidth={0}
                    backgroundColor="transparent"
                    fontWeight="600"
                  />

                  <Button
                    size="$2"
                    circular
                    backgroundColor="$green3"
                    onPress={handleSaveName}
                  >
                    <Text color="$green10">✓</Text>
                  </Button>

                  <Button
                    size="$2"
                    circular
                    backgroundColor="$red3"
                    onPress={() => setIsEditingName(false)}
                  >
                    <Text color="$red10">✕</Text>
                  </Button>
                </XStack>
              ) : (
                <XStack
                  alignItems="center"
                  justifyContent="center"
                  space="$2"
                  width="100%"
                  maxWidth={280}
                  minWidth={0}
                >
                  <Heading
                    size="$7"
                    textAlign="center"
                    numberOfLines={1}
                    flexShrink={1}
                    maxWidth="100%"
                  >
                    {roomData?.roomName}
                  </Heading>

                  {isGroup && (
                    <Button
                      size="$2"
                      circular
                      icon={Edit3}
                      hoverStyle={{ scale: 1.05 }}
                      pressStyle={{ scale: 0.95 }}
                      disabled={!myInfo?.permissions?.canUpdateMetadata}
                      opacity={!myInfo?.permissions?.canUpdateMetadata ? 0.4 : 1}
                      pointerEvents={!myInfo?.permissions?.canUpdateMetadata ? 'none' : 'auto'}
                      onPress={() => {
                        setNameInput(roomData?.roomName || '')
                        setIsEditingName(true)
                      }}
                    />
                  )}
                </XStack>
              )}
            </XStack>
          </YStack>

          {/* --- QUICK ACTIONS --- */}
          <XStack space="$4" mt="$2" justifyContent="center">
            <QuickActionButton icon={Bell} label="Thông báo" />
            {isGroup && (
              <>
                <QuickActionButton icon={UserPlus} label="Thêm thành viên" isDisabled={!myInfo?.permissions?.canAddMember} color="$blue10" onPress={onAddMember} />
                <QuickActionButton icon={ShieldCheck} label="Quản lý" color="$green10" onPress={onManageGroup} />
              </>
            )}
            {!isGroup && <QuickActionButton icon={Search} label="Tìm tin nhắn" />}
          </XStack>
        </YStack>

        <Separator opacity={0.5} />

        {/* --- LIST ITEMS --- */}
        <YStack p="$2">
          {isGroup && (
            <>
              <ListItem
                backgroundColor="transparent"
                hoverStyle={{
                  backgroundColor: "$blue2",
                  cursor: "pointer"
                }}
                pressTheme
                title="Thành viên nhóm"
                iconAfter={ChevronRight}
                borderRadius="$4"
                onPress={onViewMembers}
              />
              <ListItem
                backgroundColor="transparent"
                hoverStyle={{
                  backgroundColor: "$blue2",
                  cursor: "pointer"
                }}
                pressTheme
                title="Duyệt thành viên"
                iconAfter={ChevronRight}
                borderRadius="$4"
                onPress={onApproveMembers}
              />
            </>
          )}

          {/* --- KHO MEDIA RÚT GỌN --- */}
          <YStack p="$3" space="$3">
            <XStack justifyContent="space-between" alignItems="center" px="$1">
              <Text fontWeight="700" fontSize="$4">Ảnh & Video</Text>
              <Button
                size="$2"
                chromeless
                p={0}
                onPress={onViewAttachments}
              >
                <Text color="$blue10" fontSize="$2" fontWeight="600">Xem tất cả</Text>
              </Button>
            </XStack>

            {/* Giao diện khung xám mẫu nguyên bản */}
            <XStack gap="$2.5" onPress={onViewAttachments} style={{ cursor: 'pointer' }}>
              {[0, 1, 2].map((index) => {
                const item = previewMedia[index]

                return (
                  <YStack
                    key={item?.attachmentId || index}
                    flex={1}
                    aspectRatio={1}
                    borderRadius="$3"
                    overflow="hidden"
                    backgroundColor="$backgroundHover"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {item ? (
                      <Image
                        source={{ uri: item.detail.fileUrl }}
                        width="100%"
                        height="100%"
                      />
                    ) : (
                      <ImageIcon size={20} opacity={0.2} color="$color" />
                    )}
                  </YStack>
                )
              })}
            </XStack>
          </YStack>

          <Separator opacity={0.5} marginVertical="$2" />

          {/* --- KHO FILE RÚT GỌN --- */}
          <YStack p="$3" space="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="700" fontSize="$4">
                File đã gửi
              </Text>

              <Button
                size="$2"
                chromeless
                p={0}
                onPress={onViewAttachments}
              >
                <Text color="$blue10" fontSize="$2" fontWeight="600">
                  Xem tất cả
                </Text>
              </Button>
            </XStack>

            {previewFiles.length > 0 ? (
              <YStack space="$2">
                {previewFiles.slice(0, 3).map((file) => (
                  <XStack
                    key={file.attachmentId}
                    p="$1"
                    borderRadius="$4"
                    alignItems="center"
                    space="$3"
                    backgroundColor="$backgroundHover"
                    hoverStyle={{
                      backgroundColor: '$backgroundPress',
                      cursor: 'pointer',
                    }}
                    onPress={onViewAttachments}
                  >
                    <Circle size={40} backgroundColor="$blue3">
                      <FileText size={18} color="$blue10" />
                    </Circle>

                    <YStack flex={1} minWidth={0}>
                      <Text
                        fontWeight="400"
                        numberOfLines={1}
                      >
                        {file.detail.fileName}
                      </Text>


                    </YStack>

                    <ChevronRight
                      size={16}
                      opacity={0.4}
                    />
                  </XStack>
                ))}
              </YStack>
            ) : (
              <XStack
                p="$3"
                borderRadius="$4"
                alignItems="center"
                space="$3"
                backgroundColor="$backgroundHover"
              >
                <Circle size={40} backgroundColor="$orange3">
                  <FileText size={18} color="$orange10" />
                </Circle>

                <YStack flex={1}>
                  <Text fontWeight="600">
                    Tài liệu và tệp tin
                  </Text>

                  <Text fontSize="$2" color="$color10">
                    Chưa có file nào được chia sẻ
                  </Text>
                </YStack>
              </XStack>
            )}
          </YStack>
          {/* DANGER ZONE */}
          {isGroup && (
            <YStack p="$4">
              <Button
                size="$4"
                backgroundColor="$red3"
                hoverStyle={{ backgroundColor: '$red4' }}
                onPress={handleLeaveGroupPress}
                disabled={isChecking || isLeaving}
                opacity={isChecking || isLeaving ? 0.5 : 1}
              >
                <Text color="$red10" fontWeight="700" fontSize="$3">
                  {isChecking || isLeaving ? 'Đang xử lý...' : 'Rời nhóm'}
                </Text>
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>
      <EditAvatar
        open={openEditAvatar}
        onOpenChange={setOpenEditAvatar}
        currentAvatar={withCacheBuster(effectiveAvatarUrl)}
        currentName={roomData?.roomName}
        onSave={onSaveAvatar}
      />
    </YStack>

  )
}

const QuickActionButton = ({
  icon: Icon,
  label,
  color,
  onPress,
  isDisabled,
}: {
  icon: any,
  label: string,
  color?: string,
  onPress?: () => void,
  isDisabled?: boolean,
}) => {

  return (
    <YStack
      alignItems="center"
      justifyContent="center"
      space="$1.5"
      width={75}
      opacity={isDisabled ? 0.4 : 1}
      pointerEvents={isDisabled ? 'none' : 'auto'}
    >
      <Circle
        size={42}
        hoverStyle={isDisabled ? {} : { backgroundColor: '$backgroundHover', scale: 1.05 }}
        pressStyle={isDisabled ? {} : { scale: 0.9 }}
        onPress={isDisabled ? undefined : onPress}
        alignItems="center"
        justifyContent="center"
      >
        <Icon size={20} color={color || '$color'} />
      </Circle>

      <Text
        fontSize={11}
        textAlign="center"
        color="$color11"
        numberOfLines={2}
        lineHeight={13}
        width="100%"
      >
        {label}
      </Text>
    </YStack>
  )
}
