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
} from 'app/types/Request'
import { baseApi } from './baseApi'

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyFriendList: builder.query<PageResponse<FriendResponse>, GetMyFriendsRequest | void>({
      query: (params) => ({
        url: '/users/me/friends',
        method: 'GET',
        params,
      }),
      providesTags: ['FriendList'],
    }),

    getMyFriendRequests: builder.query<
      PageResponse<FriendRequestResponse>,
      GetMyFriendRequestsRequest
    >({
      query: ({ type, cursor, limit = 10 }) => ({
        url: '/friend-requests',
        method: 'GET',
        params: {
          type: type,
          cursor,
          limit,
        },
      }),
      providesTags: ['FriendRequests'],
    }),

    // ===== GỬI LỜI MỜI KẾT BẠN =====
    sendFriendRequest: builder.mutation<void, SendFriendRequestRequest>({
      query: ({ otherId }) => ({
        url: `/friend-requests/${otherId}`,
        method: 'POST',
      }),
      invalidatesTags: ['FriendRequests', 'UserSearch'],
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
  useLazyGetMyFriendListQuery,
  useGetMyFriendRequestsQuery,
  useLazyGetMyFriendRequestsQuery,
  useSendFriendRequestMutation,
  useRespondFriendRequestMutation,
  useCancelFriendRequestMutation,
} = contactApi
