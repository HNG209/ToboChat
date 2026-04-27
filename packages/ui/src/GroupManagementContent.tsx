import { useState, useEffect } from 'react'
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
import { ArrowLeft, ChevronRight } from "@tamagui/lucide-icons"
import { RoomResponse } from "app/types/Response"
import { roomApi, useDisbandGroupMutation, useUpdateRoomSettingsMutation } from 'app/services/roomApi'
import { RoomUpdateRequest } from 'app/types/Request'
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'app/store'
import { useRouter } from 'solito/navigation'

type GroupManagementProps = {
  roomData: RoomResponse | undefined
  isAdmin: boolean
  onClose: () => void
}

const SettingRow = ({
  label,
  value,
  isAdmin,
  onToggle
}: {
  label: string,
  value: boolean,
  isAdmin: boolean,
  onToggle: (val: boolean) => void
}) => {
  // Giữ local state để UI phản hồi ngay lập tức (Optimistic Update)
  const [checked, setChecked] = useState(value)

  useEffect(() => {
    setChecked(value)
  }, [value])

  const handleCheckedChange = (newVal: boolean) => {
    setChecked(newVal)
    onToggle(newVal)
  }

  return (
    <XStack alignItems="center" justifyContent="space-between" p="$4" backgroundColor="$background">
      <Label flex={1} fontSize="$3" fontWeight="500">{label}</Label>
      <Switch
        size="$3"
        checked={checked}
        onCheckedChange={handleCheckedChange}
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
}: GroupManagementProps) => {
  const [updateRoomSettings] = useUpdateRoomSettingsMutation();
  const [disbandGroup] = useDisbandGroupMutation();
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()


  // 2. Viết hàm xử lý chung cho tất cả các Switch
  const handleToggleSetting = async (settingKey: keyof RoomUpdateRequest, newValue: boolean) => {
    if (!roomData?.id) return;
    const patchResult = dispatch(
      roomApi.util.updateQueryData(
        'getRoomMetadata',
        { roomId: roomData.id },
        (draft) => {
          (draft as any)[settingKey] = newValue;
        }
      )
    );
    try {
      await updateRoomSettings({ roomId: roomData.id, request: { [settingKey]: newValue } })
    } catch (error) {
      patchResult.undo();
      console.error(`Lỗi khi cập nhật ${settingKey}:`, error);
    }
  }

  const handleDisbandGroup = async () => {
    try {
      if (!roomData) return;
      await disbandGroup({ roomId: roomData.id }).unwrap();

      // xoa cache
      dispatch(
        roomApi.util.updateQueryData(
          'getJoinedRooms',
          { status: 'ACTIVE' },
          (draft) => {
            const index = draft.items?.findIndex((r) => r.id === roomData.id)
            if (index !== undefined && index !== -1) {
              draft.items.splice(index, 1)
            }
          }
        )
      );
      router.replace("/chat");
    } catch (error) {
      console.error('Lỗi khi giải tán nhóm');
    }
  }

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
        {
          !isAdmin &&
          <Text fontWeight="500" fontSize="$2">(Chỉ xem)</Text>
        }
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack>
          {/* 3. Truyền giá trị và hàm xử lý vào từng SettingRow */}
          <SettingRow
            label="Cho phép thêm thành viên vào nhóm"
            value={roomData?.allowAddMember ?? true}
            isAdmin={isAdmin}
            onToggle={(val) => handleToggleSetting('allowAddMember', val)}
          />
          <Separator opacity={0.5} />

          <SettingRow
            label="Cho phép thành viên gửi tin nhắn"
            value={roomData?.allowSendMessage ?? true}
            isAdmin={isAdmin}
            onToggle={(val) => handleToggleSetting('allowSendMessage', val)}
          />
          <Separator opacity={0.5} />

          <SettingRow
            label="Cho phép chỉnh sửa thông tin phòng"
            value={roomData?.allowUpdateMetadata ?? true}
            isAdmin={isAdmin}
            onToggle={(val) => handleToggleSetting('allowUpdateMetadata', val)}
          />
          <Separator opacity={0.5} />

          <SettingRow
            label="Phê duyệt khi vào phòng"
            value={roomData?.approveMember ?? false}
            isAdmin={isAdmin}
            onToggle={(val) => handleToggleSetting('approveMember', val)}
          />

          <Separator opacity={0.5} />

          {
            isAdmin &&
            <YStack mt="$4" p="$2">
              <Text fontSize="$3" color="$color10" px="$3" pb="$2">Quyền hạn khác</Text>
              <ListItem
                title="Quản lý phó nhóm"
                iconAfter={ChevronRight}
                pressTheme={isAdmin}
                disabled={!isAdmin}
                opacity={!isAdmin ? 0.5 : 1}
                borderRadius="$4"
                backgroundColor="transparent"
                hoverStyle={{
                  backgroundColor: "$blue2",
                  cursor: "pointer"
                }}
              />
            </YStack>
          }

          {isAdmin && (
            <YStack p="$4">
              <Button
                theme="red"
                backgroundColor="$red3"
                onPress={handleDisbandGroup}
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