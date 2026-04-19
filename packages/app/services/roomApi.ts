import {
  ApiResponse,
  PageResponse,
  RoomResponse,
  GroupAcceptRequestResponse,
  RoomMemberResponse,
} from 'app/types/Response'
import { baseApi } from './baseApi'
import { RoomStatus } from '@my/ui'
import { RoomCreateRequest, RoomUpdateRequest } from 'app/types/Request'

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
    respondGroupInvite: builder.mutation<RoomResponse, { groupId: string; accept: boolean }>({
      query: ({ groupId, accept }) => ({
        url: `/group-invites/${groupId}?accept=${accept}`,
        method: 'PUT',
        params: {
          accept,
        },
      }),
      invalidatesTags: ['Rooms'],
    }),

    createGroup: builder.mutation<RoomResponse, RoomCreateRequest>({
      query: (data) => ({
        url: '/rooms',
        method: 'POST',
        data,
      }),
    }),

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

    addMembers: builder.mutation<void, { roomId: string; targetUserIds: string[] }>({
      query: ({ roomId, targetUserIds }) => ({
        url: `/rooms/${roomId}/members`,
        method: 'POST',
        data: { targetUserIds },
      }),
    }),

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
  useUpdateRoomSettingsMutation,
  useRespondGroupInviteMutation,
  useGetGroupInvitesQuery,
  useGetRoomMetadataQuery,
  useMarkAsReadMutation,
  useAddMembersMutation,
} = roomApi
