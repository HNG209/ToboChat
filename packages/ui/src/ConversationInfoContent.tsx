import React from 'react'
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
  Theme
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
  ArrowLeft
} from "@tamagui/lucide-icons"
import { Platform } from 'react-native'
import { RoomResponse } from "app/types/Response"

type ConversationInfoProps = {
  roomData: RoomResponse | undefined
  onClose: () => void
  onLeaveGroup?: () => void
  onAddMember?: () => void
  onManageGroup?: () => void
}

export const ConversationInfoContent = ({
  roomData,
  onClose,
  onLeaveGroup,
  onAddMember,
  onManageGroup
}: ConversationInfoProps) => {
  const isWeb = Platform.OS === 'web'
  const isGroup = 'GROUP'
  const memberCount = roomData?.memberCount || 0

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
        pt={0}
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={0.5}
        borderColor="$borderColor"
        backgroundColor="$background"
      >
        <XStack alignItems="center" space="$2">
          {!isWeb && (
            <Button
              icon={ArrowLeft}
              chromeless
              circular
              onPress={onClose}
              backgroundColor="transparent"
            />
          )}
          <Text fontWeight="700" fontSize="$5" color="$color" alignSelf='center'>
            {isGroup ? 'Thông tin nhóm' : 'Thông tin hội thoại'}
          </Text>
        </XStack>


      </XStack>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ pb: "$8" }}>
        {/* --- PROFILE SECTION --- */}
        <YStack alignItems="center" py="$6" px="$4" space="$3">
          <Avatar circular size="$9" borderWidth={1} borderColor="$borderColor">
            <Avatar.Image
              src={roomData?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(roomData?.roomName || 'Room')}&background=random`}
            />
            <Avatar.Fallback backgroundColor="$blue8" />
          </Avatar>

          <YStack alignItems="center" space="$1">
            <XStack alignItems="center" justifyContent="center" space="$2" px="$5">
              <Heading size="$7" textAlign="center" numberOfLines={2}>
                {roomData?.roomName}
              </Heading>
              {isGroup && (
                <Button size="$2" circular icon={Edit3} chromeless backgroundColor="$backgroundHover" />
              )}
            </XStack>
          </YStack>

          {/* --- QUICK ACTIONS --- */}
          <XStack space="$4" mt="$2" justifyContent="center">
            <QuickActionButton icon={Bell} label="Thông báo" />
            {isGroup && (
              <>
                <QuickActionButton icon={UserPlus} label="Thêm TV" color="$blue10" onPress={onAddMember} />
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
            <ListItem
              backgroundColor="transparent" // Màu nền lúc bình thường (hơi đậm hoặc tùy bạn chọn)
              hoverStyle={{
                backgroundColor: "$blue2", // Khi hover vào thì mất nền (hoặc đổi sang màu nhạt hơn)
                cursor: "pointer"
              }}
              pressTheme
              title="Thành viên nhóm"
              subTitle={`${memberCount} thành viên`}
              iconBefore={<Circle size={30} backgroundColor="$blue3"><UserPlus size={16} color="$blue10" /></Circle>}
              iconAfter={ChevronRight}
              borderRadius="$4"
              onPress={() => { }}
            />
          )}

          {/* KHO MEDIA */}
          <YStack p="$3" space="$3">
            <XStack justifyContent="space-between" alignItems="center" px="$1">
              <Text fontWeight="700" fontSize="$4">Ảnh & Video</Text>
            </XStack>

            <XStack gap="$2.5">
              {[1, 2, 3].map((i) => (
                <YStack
                  key={i}
                  flex={1}
                  aspectRatio={1}
                  borderRadius="$3"
                  backgroundColor="$backgroundStrong"
                  alignItems="center"
                  justifyContent="center"
                >
                  <ImageIcon size={20} opacity={0.2} color="$color" />
                </YStack>
              ))}
            </XStack>
          </YStack>

          <Separator opacity={0.5} marginVertical="$2" />

          {/* KHO FILE */}
          <YStack p="$3" space="$3">
            <Text fontWeight="700" fontSize="$4" px="$1">File đã gửi</Text>
            <XStack p="$3" backgroundColor="$backgroundStrong" borderRadius="$4" alignItems="center" space="$3">
              <Circle size={36} backgroundColor="$orange3">
                <FileText size={18} color="$orange10" />
              </Circle>
              <YStack flex={1}>
                <Text fontSize="$3" fontWeight="600">Tài liệu và tệp tin</Text>
                <Text fontSize="$2" color="$color10">Chưa có dữ liệu</Text>
              </YStack>
              <ChevronRight size={16} opacity={0.5} />
            </XStack>
          </YStack>

          {/* DANGER ZONE */}
          {isGroup && (
            <YStack p="$4" mt="$4">
              <Button
                size="$4"
                backgroundColor="$red3"
                hoverStyle={{ backgroundColor: '$red4' }}
                onPress={onLeaveGroup}
              >
                <Text color="$red10" fontWeight="700" fontSize="$3">Rời khỏi nhóm</Text>
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

const QuickActionButton = ({
  icon: Icon,
  label,
  color,
  onPress
}: {
  icon: any,
  label: string,
  color?: string,
  onPress?: () => void
}) => (
  <YStack
    alignItems="center"
    justifyContent="center"
    space="$1.5"
    width={75}
  >
    <Circle
      size={42}
      backgroundColor="$backgroundStrong" // Bắt buộc có màu nền để hiện trên Native
      hoverStyle={{ backgroundColor: '$backgroundHover', scale: 1.05 }}
      pressStyle={{ scale: 0.9 }}
      onPress={onPress}
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