import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from 'app/store/axiosBaseQuery'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['FriendList', 'FriendRequests', 'UserSearch', 'Profile', 'Rooms'],
  endpoints: () => ({}),
})
