import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from './axiosBaseQuery'

export const api = createApi({
  reducerPath: 'api',
  // Không cần Mutex, không cần baseQueryWithReauth nữa
  // axiosClient đã lo hết việc refresh ngầm bên dưới
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => ({ url: '/auth/me', method: 'GET' }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', data: body }),
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
})

export const { useGetProfileQuery, useLoginMutation, useLogoutMutation } = api
