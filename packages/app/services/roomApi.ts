import {
  ApiResponse,
  PageResponse,
  RoomResponse,
  GroupAcceptRequestResponse,
} from 'app/types/Response'
import { baseApi } from './baseApi'
import { RoomStatus } from '@my/ui'
import { RoomCreateRequest } from 'app/types/Request'

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

    getRoomMetadata: builder.query<RoomResponse, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/rooms/${roomId}`,
        method: 'GET',
      }),
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
  useCreateGroupMutation,
  useRespondGroupInviteMutation,
  useGetGroupInvitesQuery,
  useGetRoomMetadataQuery,
  useMarkAsReadMutation,
} = roomApi
