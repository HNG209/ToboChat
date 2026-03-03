import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from './axiosBaseQuery'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getProfile: builder.query<
      any, // response type (tạm để any, lát mình tối ưu sau)
      string | void // argument type
    >({
      query: (id) =>
        id ? { url: `/users/${id}`, method: 'GET' } : { url: '/users/me', method: 'GET' },
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
  }),
})

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useInitMFAMutation,
  useConfirmMFAMutation,
} = api
