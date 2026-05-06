import {
  YStack, XStack, Text, Button, Avatar, ScrollView,
  Separator, Popover, Circle, Adapt, Sheet
} from 'tamagui'
import { ArrowLeft, MoreVertical, ShieldCheck, UserMinus, Star } from '@tamagui/lucide-icons'
import {
  roomApi,
  useGetRoomMembersQuery,
  useUpdateMemberMutation,
  useRemoveMemberMutation,
  useGetMyInfoQuery
} from 'app/services/roomApi'
import { ActivityIndicator, Alert } from 'react-native'
import { useDispatch } from 'react-redux'
import { Platform } from 'expo-modules-core'
import { AppDispatch } from 'app/store'

interface MemberManagementContentProps {
  roomId: string
  onClose: () => void
}

export const MemberManagementContent = ({ roomId, onClose }: MemberManagementContentProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { data: membersData, isLoading } = useGetRoomMembersQuery({ roomId })
  const { data: myInfo } = useGetMyInfoQuery({ roomId });

  const [updateMember] = useUpdateMemberMutation()
  const [removeMember] = useRemoveMemberMutation()

  const handleUpdateRole = async (memberId: string, newRole: 'VICE_ADMIN' | 'MEMBER') => {
    try {
      await updateMember({ roomId, memberId, request: { memberRole: newRole } }).unwrap()
      dispatch(
        roomApi.util.updateQueryData('getRoomMembers', { roomId }, (draft) => {
          if (!draft?.items) return
          const memberItem = draft.items.find((item: any) => item.member.id === memberId)
          if (memberItem) {
            memberItem.role = newRole
          }
        })
      )
    } catch (e) {
      console.error("Lỗi cập nhật vai trò", e)
    }
  }

  // 2. Xử lý Xóa thành viên
  const handleRemove = (memberId: string, memberName: string) => {
    const title = "Xóa thành viên";
    const message = `Bạn có chắc muốn xoá ${memberName} ra khỏi nhóm?`;

    const executeRemove = async () => {
      try {
        dispatch(
          roomApi.util.updateQueryData('getRoomMembers', { roomId }, (draft) => {
            if (draft?.items) {
              draft.items = draft.items.filter((i: any) => i.member.id !== memberId);
            }
          })
        );
        
        dispatch(
          roomApi.util.updateQueryData('getJoinedRooms', { status: 'ACTIVE' }, (draft) => {
            const room = draft.items?.find((r) => r.id === roomId);
            if (room) {
              room.memberCount = Math.max(0, (room.memberCount || 0) - 1);
            }
          })
        );
        
        await removeMember({ roomId, memberId }).unwrap();
      } catch (e) {
        console.error("Lỗi xóa:", e);
      }
    };

    // --- LOGIC PHÂN TÁCH NỀN TẢNG ---
    if (Platform.OS === 'web') {
      // Trên Web dùng confirm của trình duyệt
      if (window.confirm(message)) {
        executeRemove();
      }
    } else {
      // Trên Mobile dùng Alert của React Native
      Alert.alert(title, message, [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: executeRemove }
      ]);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* HEADER */}
      <XStack p="$3" alignItems="center" space="$2" borderBottomWidth={0.5} borderColor="$borderColor">
        <Button icon={ArrowLeft} chromeless circular onPress={onClose} />
        <Text fontWeight="700" fontSize="$5" color="$color">Thành viên ({membersData?.items?.length || 0})</Text>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack p="$2">
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="$blue10" />
          ) : (


            membersData?.items?.map((item: any) => {
              const member = item.member
              const role = item.role
              const isMe = member.id === myInfo?.id
              const canManage = myInfo?.permissions?.canApproveMember && !isMe

              return (
                <XStack key={member.id} alignItems="center" p="$3" space="$3" borderRadius="$4" hoverStyle={{ backgroundColor: "$backgroundHover" }}>
                  <Avatar circular size="$4">
                    <Avatar.Image src={member.avatarUrl} />
                    <Avatar.Fallback backgroundColor="$blue5" />
                  </Avatar>

                  <YStack flex={1}>
                    <XStack alignItems="center" space="$2">
                      <Text fontWeight="600" color="$color">{member.name} {isMe && "(Bạn)"}</Text>
                      {role === 'ADMIN' && <Circle size={18} backgroundColor="$orange3"><Star size={10} color="$orange10" /></Circle>}
                      {role === 'VICE_ADMIN' && <Circle size={18} backgroundColor="$blue3"><ShieldCheck size={10} color="$blue10" /></Circle>}
                    </XStack>
                    <Text fontSize="$2" color="$color10">
                      {role === 'ADMIN' ? 'Trưởng nhóm' : role === 'VICE_ADMIN' ? 'Phó nhóm' : 'Thành viên'}
                    </Text>
                  </YStack>

                  {canManage && (
                    <MemberActionMenu
                      currentRole={role}
                      onUpdateRole={(newRole: any) => handleUpdateRole(member.id, newRole)}
                      onRemove={() => handleRemove(member.id, member.name)}
                    />
                  )}
                </XStack>
              )
            })
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

// MENU 3 CHẤM TỐI ƯU WEB/MOBILE
const MemberActionMenu = ({ currentRole, onUpdateRole, onRemove }: any) => {
  return (
    <Popover size="$5" allowFlip placement="bottom-end">
      <Popover.Trigger asChild>
        <Button icon={MoreVertical} chromeless circular size="$3" />
      </Popover.Trigger>

      <Adapt when="sm" platform="touch">
        <Sheet modal dismissOnSnapToBottom animation="quick" snapPoints={[30]}>
          <Sheet.Frame padding="$2" space="$2">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" animation="quick" />
        </Sheet>
      </Adapt>

      <Popover.Content borderWidth={1} borderColor="$borderColor" elevate animation="quick" zIndex={200000} padding="$1">
        <YStack space="$0.5" minWidth={160}>
          {currentRole !== 'VICE_ADMIN' ? (
            <Button size="$3" chromeless icon={ShieldCheck} justifyContent="flex-start" onPress={() => onUpdateRole('VICE_ADMIN')}>
              Bổ nhiệm Phó nhóm
            </Button>
          ) : (
            <Button size="$3" chromeless icon={UserMinus} justifyContent="flex-start" onPress={() => onUpdateRole('MEMBER')}>
              Gỡ vai trò Phó nhóm
            </Button>
          )}
          <Separator opacity={0.5} marginVertical="$1" />
          <Button size="$3" chromeless icon={UserMinus} color="$red10" justifyContent="flex-start" onPress={onRemove}>
            Xóa khỏi nhóm
          </Button>
        </YStack>
      </Popover.Content>
    </Popover>
  )
}