import { PageResponse, UserResponse } from 'app/types/Response'
import { baseApi } from './baseApi'
import { FindUserByEmailRequest } from 'app/types/Request'

type AvatarUploadUrlResponse =
  | {
      presignedUrl: string
      fileUrl: string
    }
  | {
      url: string
      fileUrl?: string
    }

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<UserResponse, void>({
      query: () => ({ url: '/users/me', method: 'GET' }),
      providesTags: ['Profile'],
    }),

    findUserByEmail: builder.query<PageResponse<UserResponse>, FindUserByEmailRequest>({
      query: ({ email, cursor, limit = 10 }) => ({
        url: `/users/${email}`,
        method: 'GET',
        params: { cursor, limit },
      }),
      providesTags: ['UserSearch'],
    }),

    updateProfile: builder.mutation<any, { name?: string; dateOfBirth?: string }>({
      query: ({ name, dateOfBirth }) => ({
        url: '/users/me',
        method: 'PUT',
        data: {
          ...(name ? { name } : null),
          ...(dateOfBirth ? { dateOfBirth } : null),
        },
      }),

      invalidatesTags: ['Profile'],
    }),

    getAvatarUploadUrl: builder.mutation<AvatarUploadUrlResponse, { contentType: string }>({
      query: ({ contentType }) => ({
        url: '/users/avatar/upload-url',
        method: 'GET',
        params: { contentType },
      }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useFindUserByEmailQuery,
  useLazyFindUserByEmailQuery,
  useUpdateProfileMutation,
  useGetAvatarUploadUrlMutation,
} = userApi
