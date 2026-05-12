import { baseApi } from './baseApi'

export const callApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCallStatus: builder.query<boolean, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/call/status/${roomId}`,
        method: 'GET',
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useGetCallStatusQuery } = callApi
