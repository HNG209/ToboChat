import {
  ApiResponse,
  PageResponse,
  RoomResponse,
  GroupAcceptRequestResponse,
  RoomMemberResponse,
  LeaveCheckResponse,
} from 'app/types/Response'
import { baseApi } from './baseApi'
import { RoomStatus } from '@my/ui'
import { MemberUpdateRequest, RoomCreateRequest, RoomUpdateRequest } from 'app/types/Request'

export const roomApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJoinedRooms: builder.query<PageResponse<RoomResponse>, { status: RoomStatus }>({
      // Lấy danh sách phòng của người dùng hiện tại
      query: (params) => ({
        url: `/rooms?status=${params.status}`,
        method: 'GET',
        params: {
          status: params.status,
        },
      }),
      providesTags: ['Rooms'],
    }),

    // Thông tin của tôi trong nhóm
    getMyInfo: builder.query<RoomMemberResponse, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/rooms/${roomId}/me`,
        method: 'GET',
      }),
    }),

    // Lấy danh sách lời mời tham gia nhóm
    getGroupInvites: builder.query<PageResponse<GroupAcceptRequestResponse>, void>({
      query: () => ({
        url: '/group-invites',
        method: 'GET',
      }),
      providesTags: ['Rooms'],
    }),

    // Phản hồi lời mời tham gia nhóm
    respondGroupInvite: builder.mutation<any, { groupId: string; accepted: boolean }>({
      query: ({ groupId, accepted }) => ({
        url: `/group-invites/${groupId}`,
        method: 'PUT',
        params: { accepted },
      }),

      invalidatesTags: ['Rooms'],
    }),

    // Tạo nhóm
    createGroup: builder.mutation<RoomResponse, RoomCreateRequest>({
      query: (data) => ({
        url: '/rooms',
        method: 'POST',
        data,
      }),
    }),

    // Cập nhật setting của nhóm
    updateRoomSettings: builder.mutation<void, { roomId: string; request: RoomUpdateRequest }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}`,
        method: 'PATCH',
        data: {
          ...data.request,
        },
      }),
      // invalidatesTags: (result, error, arg) => [{ type: 'RoomMetadata', id: arg.roomId }],
    }),

    // Danh sách thành viên nhóm
    getRoomMembers: builder.query<PageResponse<RoomMemberResponse>, { roomId: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}/members`,
        method: 'GET',
      }),
    }),

    // Cập nhật vai trò thành viên
    updateMember: builder.mutation<
      void,
      { roomId: string; memberId: string; request: MemberUpdateRequest }
    >({
      query: (data) => ({
        url: `/rooms/${data.roomId}/members/${data.memberId}`,
        method: 'POST',
        data: data.request,
      }),
    }),

    // Kiểm tra có thể rời nhóm
    checkLeave: builder.mutation<LeaveCheckResponse, { roomId: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}/leave-check`,
        method: 'POST',
      }),
    }),

    // Rời nhóm
    leaveGroup: builder.mutation<void, { roomId: string; newAdminId?: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}/members/me`,
        method: 'DELETE',
        params: {
          newAdminId: data.newAdminId || null,
        },
      }),
    }),

    // Xoá thành viên khỏi nhóm
    removeMember: builder.mutation<void, { roomId: string; memberId: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}/members/${data.memberId}`,
        method: 'DELETE',
      }),
    }),

    // Giải tán nhóm
    disbandGroup: builder.mutation<void, { roomId: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}`,
        method: 'DELETE',
      }),
    }),

    // Thêm thành viên khi đã có nhóm
    addMembers: builder.mutation<void, { roomId: string; targetUserIds: string[] }>({
      query: ({ roomId, targetUserIds }) => ({
        url: `/rooms/${roomId}/members`,
        method: 'POST',
        data: { targetUserIds },
      }),
    }),

    // Thông tin phòng, bao gồm các settings của phòng
    getRoomMetadata: builder.query<RoomResponse, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/rooms/${roomId}`,
        method: 'GET',
      }),
      // providesTags: (result, error, arg) => [{ type: 'RoomMetadata', id: arg.roomId }],
    }),

    markAsRead: builder.mutation<ApiResponse<void>, string>({
      query: (roomId) => ({
        url: `/rooms/${roomId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Rooms'],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetJoinedRoomsQuery,
  useGetMyInfoQuery,
  useCreateGroupMutation,
  useDisbandGroupMutation,
  useGetRoomMembersQuery,
  useUpdateMemberMutation,
  useRemoveMemberMutation,
  useCheckLeaveMutation,
  useLeaveGroupMutation,
  useUpdateRoomSettingsMutation,
  useRespondGroupInviteMutation,
  useGetGroupInvitesQuery,
  useGetRoomMetadataQuery,
  useMarkAsReadMutation,
  useAddMembersMutation,
} = roomApi
