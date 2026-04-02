import { PageResponse, RoomResponse } from 'app/types/Response'
import { baseApi } from './baseApi'

const roomApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJoinedRooms: builder.query<PageResponse<RoomResponse>, void>({
      // Lấy danh sách phòng của người dùng hiện tại
      query: (params) => ({
        url: '/rooms',
        method: 'GET',
        params,
      }),
    }),

    getRoomMetadata: builder.query<RoomResponse, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/rooms/${roomId}`,
        method: 'GET',
      }),
    }),
  }),
})

export const { useGetJoinedRoomsQuery, useGetRoomMetadataQuery } = roomApi
