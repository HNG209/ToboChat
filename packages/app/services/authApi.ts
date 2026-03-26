import { baseApi } from './baseApi'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    initMFA: builder.mutation<{ secret: string }, { userId: string; password: string }>({
      query: (body) => ({
        url: 'users/mfa/init',
        method: 'POST',
        data: body,
      }),
    }),

    confirmMFA: builder.mutation<void, { userId: string; otp: string }>({
      query: (body) => ({
        url: 'users/mfa/confirm',
        method: 'POST',
        data: body,
      }),
    }),

    disableMFA: builder.mutation<void, { userId: string; password: string }>({
      query: (body) => ({
        url: 'users/mfa',
        method: 'DELETE',
        data: body,
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useInitMFAMutation, useConfirmMFAMutation, useDisableMFAMutation } = authApi
