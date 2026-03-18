import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from './axiosBaseQuery'
import {
  ApiResponse,
  FriendResponse,
  PageResponse,
  UserResponse,
  FriendRequestResponse,
} from '../types/Response'
import {
  GetMyFriendsRequest,
  FindUserByEmailRequest,
  GetMyFriendRequestsRequest,
  FriendRequestType,
  SendFriendRequestRequest,
  CancelFriendRequestRequest,
  RespondFriendRequestRequest,
} from '../types/Request'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['FriendList', 'FriendRequests', 'UserSearch', 'Profile'],
  endpoints: (builder) => ({
    getProfile: builder.query<
      any, // response type (tạm để any, lát mình tối ưu sau)
      string | void // argument type
    >({
      query: (id) =>
        id ? { url: `/users/${id}`, method: 'GET' } : { url: '/users/me', method: 'GET' },
      providesTags: ['Profile'],
    }),

    getMyFriendList: builder.query<PageResponse<FriendResponse>, GetMyFriendsRequest | void>({
      query: (params) => ({
        url: '/users/me/friends',
        method: 'GET',
        params,
      }),
      transformResponse: (response: ApiResponse<PageResponse<FriendResponse>>) => response.result,
      providesTags: ['FriendList'],
    }),

    findUserByEmail: builder.query<PageResponse<UserResponse>, FindUserByEmailRequest>({
      query: ({ email, cursor, limit = 10 }) => ({
        url: `/users/${email}`,
        method: 'GET',
        params: { cursor, limit },
      }),
      transformResponse: (response: ApiResponse<PageResponse<UserResponse>>) => response.result,
      providesTags: ['UserSearch'],
    }),

    // ===== LẤY DANH SÁCH LỜI MỜI (đã gửi / đang chờ nhận) =====
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
      transformResponse: (response: ApiResponse<PageResponse<FriendRequestResponse>>) =>
        response.result,
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

    // ===== HỦY LỜI MỜI =====
    cancelFriendRequest: builder.mutation<void, CancelFriendRequestRequest>({
      query: ({ otherId }) => ({
        url: `/friend-requests/${otherId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FriendRequests', 'UserSearch', 'FriendList'],
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
    // Ham bat mfa
    initMFA: builder.mutation<{ secret: string }, { userId: string; password: string }>({
      query: (body) => ({
        url: 'users/mfa/init',
        method: 'POST',
        data: body,
      }),
    }),

    // Xac nhan ma OTP
    confirmMFA: builder.mutation<void, { userId: string; otp: string }>({
      query: (body) => ({
        url: 'users/mfa/confirm',
        method: 'POST',
        data: body,
      }),
    }),
    // ham tat
    disableMFA: builder.mutation<void, { userId: string; password: string }>({
      query: (body) => ({
        url: 'users/mfa',
        method: 'DELETE',
        data: body,
      }),
    }),

    updateProfile: builder.mutation<any, { name?: string; avatar?: File }>({
      query: ({ name, avatar }) => {
        const formData = new FormData()

        if (name) {
          formData.append('name', name)
        }

        if (avatar) {
          formData.append('avatar', avatar)
        }

        return {
          url: '/users/me',
          method: 'PUT',
          data: formData,

          // 🔥 QUAN TRỌNG: KHÔNG set Content-Type
          // để axios tự xử lý multipart/form-data
          headers: undefined,
        }
      },

      invalidatesTags: ['Profile'],
    }),
  }),
})

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useGetMyFriendListQuery,
  useLazyGetMyFriendListQuery,
  useFindUserByEmailQuery,
  useLazyFindUserByEmailQuery,
  useGetMyFriendRequestsQuery,
  useLazyGetMyFriendRequestsQuery,
  useSendFriendRequestMutation,
  useCancelFriendRequestMutation,
  useRespondFriendRequestMutation,
  useInitMFAMutation,
  useConfirmMFAMutation,
  useDisableMFAMutation,
  useUpdateProfileMutation,
} = api
