import { ApiResponse, PageResponse, RoomResponse } from 'app/types/Response'
import { baseApi } from './baseApi'
import { RoomStatus } from '@my/ui'

export const roomApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJoinedRooms: builder.query<PageResponse<RoomResponse>, {status: RoomStatus}>({
      // Lấy danh sách phòng của người dùng hiện tại
      query: (params) => ({
        url: `/rooms?status=${params.status}`,
        method: 'GET',
        params: {
          status: params.status,
        },
      }),
      providesTags: ['Rooms']
    }),

    getRoomMetadata: builder.query<RoomResponse, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/rooms/${roomId}`,
        method: 'GET',
      }),
    }),

    markAsRead: builder.mutation<ApiResponse<void>, string> ({
      query: (roomId) => ({
        url: `/rooms/${roomId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Rooms']
    })
  }),
  overrideExisting: true,
})

export const { useGetJoinedRoomsQuery, useGetRoomMetadataQuery, useMarkAsReadMutation } = roomApi
