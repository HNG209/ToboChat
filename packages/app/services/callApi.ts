import { baseApi } from './baseApi'

export type CallStatus = 'ACTIVE' | 'INACTIVE' | 'IN_CALL'

export const callApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCallStatus: builder.query<CallStatus, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/calls/status/${roomId}`,
        method: 'GET',
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useGetCallStatusQuery } = callApi
