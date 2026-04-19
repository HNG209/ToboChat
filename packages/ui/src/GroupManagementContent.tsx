import React, { useState } from 'react'
import {
  Button,
  ListItem,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack,
  Switch,
  Label,
} from "tamagui"
import { ArrowLeft, Trash2, ChevronRight } from "@tamagui/lucide-icons"
import { Platform } from 'react-native'
import { RoomResponse } from "app/types/Response"

type GroupManagementProps = {
  roomData: RoomResponse | undefined
  isAdmin: boolean
  onClose: () => void
  onUpdateSetting: (key: string, value: boolean) => void
  onDissolveGroup: () => void
}
const SettingRow = ({ label, defaultValue, isAdmin }: { label: string, defaultValue: boolean, isAdmin: boolean }) => {
  const [checked, setChecked] = useState(defaultValue)

  return (
    <XStack alignItems="center" justifyContent="space-between" p="$4" backgroundColor="$background">
      <Label flex={1} fontSize="$3" fontWeight="$500">{label}</Label>
      <Switch
        size="$3"
        checked={checked}
        onCheckedChange={setChecked}
        disabled={!isAdmin}
        backgroundColor={checked ? "$blue10" : "$gray5"}
        borderColor={checked ? "$blue10" : "$gray7"}
        opacity={!isAdmin ? 0.5 : 1}
      >
        <Switch.Thumb animation="quick" backgroundColor="white" />
      </Switch>
    </XStack>
  )
}
export const GroupManagementContent = ({
  roomData,
  isAdmin,
  onClose,
  onUpdateSetting,
  onDissolveGroup,
}: GroupManagementProps) => {
  const isWeb = Platform.OS === 'web'

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* --- HEADER --- */}
      <XStack
        p="$3"
        alignItems="center"
        space="$2"
        borderBottomWidth={0.5}
        borderColor="$borderColor"
      >
        <Button
          icon={ArrowLeft}
          chromeless
          circular
          onPress={onClose}
          backgroundColor="transparent"
        />
        <Text fontWeight="700" fontSize="$5">Quản lý nhóm</Text>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack space="$1">
          <SettingRow
            label="Cho phép thêm thành viên vào nhóm"
            defaultValue={roomData?.allowAddMember ?? true}
            isAdmin={isAdmin}
          />
          <Separator opacity={0.5} />

          <SettingRow
            label="Cho phép thành viên gửi tin nhắn"
            defaultValue={roomData?.allowSendMessage ?? true}
            isAdmin={isAdmin}
          />
          <Separator opacity={0.5} />

          <SettingRow
            label="Cho phép chỉnh sửa thông tin phòng"
            defaultValue={roomData?.allowUpdateMetadata ?? true}
            isAdmin={isAdmin}
          />
          <Separator opacity={0.5} />

          <SettingRow
            label="Phê duyệt khi vào phòng"
            defaultValue={roomData?.approveMember ?? false}
            isAdmin={isAdmin}
          />

          <Separator opacity={0.5} />

          <YStack mt="$4" p="$2">
            <Text fontSize="$3" color="$color10" px="$3" pb="$2">Quyền hạn khác</Text>
            <ListItem
              title="Quản lý phó nhóm"
              iconAfter={ChevronRight}
              pressTheme={isAdmin}
              disabled={!isAdmin}
              opacity={!isAdmin ? 0.5 : 1}
              borderRadius="$4"
              backgroundColor="transparent" // Màu nền lúc bình thường (hơi đậm hoặc tùy bạn chọn)
              hoverStyle={{
                backgroundColor: "$blue2", // Khi hover vào thì mất nền (hoặc đổi sang màu nhạt hơn)
                cursor: "pointer"
              }}
            />
          </YStack>

          {isAdmin && (
            <YStack p="$4">
              <Button
                theme="red"
                backgroundColor="$red3"
                onPress={onDissolveGroup}
                pressStyle={{ scale: 0.97 }}
              >
                <Text color="$red10" fontWeight="700" fontSize="$4">Giải tán nhóm</Text>
              </Button>
              <Text textAlign="center" fontSize="$2" color="$red10" mt="$2" opacity={0.7}>
                Hành động này không thể hoàn tác. Tất cả tin nhắn và dữ liệu sẽ bị xóa.
              </Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}