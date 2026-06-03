import {
  ApiResponse,
  FriendRequestResponse,
  FriendResponse,
  PageResponse,
} from 'app/types/Response'
import {
  CancelFriendRequestRequest,
  GetMyFriendRequestsRequest,
  GetMyFriendsRequest,
  RespondFriendRequestRequest,
  SendFriendRequestRequest,
  DeleteFriendRequest,
} from 'app/types/Request'
import { baseApi } from './baseApi'
import { FriendStatus } from 'app/types/Enums'

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyFriendList: builder.query<PageResponse<FriendResponse>, GetMyFriendsRequest | void>({
      query: (params) => ({
        url: `/users/me/friends`,
        method: 'GET',
        params,
      }),
      providesTags: ['FriendList'],

      serializeQueryArgs: ({ queryArgs, endpointName }) => {
        const roomId = (queryArgs as GetMyFriendsRequest | void)?.roomId ?? 'all'
        return `${endpointName}-${roomId}`
      },

      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor && currentArg?.cursor !== undefined
      },

      merge: (currentCache, newData, { arg }) => {
        if (!arg?.cursor) {
          return newData
        }

        if (!currentCache.items) {
          currentCache.items = []
        }

        const existingIds = new Set(currentCache.items.map((i) => i.id))
        const newItems = newData.items.filter((i) => !existingIds.has(i.id))
        currentCache.items.push(...newItems)
        currentCache.nextCursor = newData.nextCursor
      },
    }),

    getFriendStatus: builder.query<FriendStatus, { otherId: string }>({
      query: ({ otherId }) => ({
        url: `/users/${otherId}/friend-status`,
        method: 'GET',
      }),
    }),

    getMyFriendRequests: builder.query<
      PageResponse<FriendRequestResponse>,
      GetMyFriendRequestsRequest
    >({
      query: ({ type, cursor, limit = 10 }) => ({
        url: '/friend-requests',
        method: 'GET',
        params: { type, cursor, limit },
      }),
      providesTags: ['FriendRequests'],

      serializeQueryArgs: ({ queryArgs, endpointName }) => {
        const t = (queryArgs as GetMyFriendRequestsRequest | void)?.type ?? 'all'
        return `${endpointName}-${t}`
      },

      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor && currentArg?.cursor !== undefined
      },

      merge: (currentCache, newData, { arg }) => {
        if (!arg?.cursor) {
          return newData
        }

        if (!currentCache.items) {
          currentCache.items = []
        }

        const existingIds = new Set(currentCache.items.map((i) => i.id))
        const newItems = newData.items.filter((i) => !existingIds.has(i.id))
        currentCache.items.push(...newItems)
        currentCache.nextCursor = newData.nextCursor
      },
    }),

    // ===== GỬI LỜI MỜI KẾT BẠN =====
    sendFriendRequest: builder.mutation<void, SendFriendRequestRequest>({
      query: ({ otherId }) => ({
        url: `/friend-requests/${otherId}`,
        method: 'POST',
      }),
      invalidatesTags: ['FriendRequests', 'UserSearch'],
    }),

    // ===== XÓA KẾT BẠN =====
    deleteFriend: builder.mutation<void, DeleteFriendRequest>({
      query: ({ userId, otherId }) => ({
        url: `/contacts/${userId}/friends/${otherId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FriendList', 'UserSearch'],
    }),

    // ===== PHẢN HỒI LỜI MỜI (chấp nhận / từ chối) =====
    respondFriendRequest: builder.mutation<void, RespondFriendRequestRequest>({
      query: ({ otherId, accepted }) => ({
        url: `/friend-requests/${otherId}`,
        method: 'PUT',
        params: { accepted },
      }),
      invalidatesTags: ['FriendRequests', 'FriendList'],
    }),

    // ===== HỦY LỜI MỜI =====
    cancelFriendRequest: builder.mutation<void, CancelFriendRequestRequest>({
      query: ({ otherId }) => ({
        url: `/friend-requests/${otherId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FriendRequests', 'UserSearch', 'FriendList'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetMyFriendListQuery,
  useGetFriendStatusQuery,
  useLazyGetMyFriendListQuery,
  useGetMyFriendRequestsQuery,
  useLazyGetMyFriendRequestsQuery,
  useSendFriendRequestMutation,
  useRespondFriendRequestMutation,
  useCancelFriendRequestMutation,
  useDeleteFriendMutation,
} = contactApi
