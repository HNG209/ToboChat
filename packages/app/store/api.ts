import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from './axiosBaseQuery'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: (id?: string) =>
        id ? { url: `/users/${id}`, method: 'GET' } : { url: '/users/me', method: 'GET' },
    }),
  }),
})

export const { useGetProfileQuery, useLazyGetProfileQuery } = api
