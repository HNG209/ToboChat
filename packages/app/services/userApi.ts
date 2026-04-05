import { ApiResponse, PageResponse, UserResponse } from 'app/types/Response'
import { baseApi } from './baseApi'
import { FindUserByEmailRequest } from 'app/types/Request'

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

    updateProfile: builder.mutation<any, { name?: string; avatar?: File; dateOfBirth?: string }>({
      query: ({ name, avatar, dateOfBirth }) => {
        const formData = new FormData()

        if (name) {
          formData.append('name', name)
        }

        if (avatar) {
          formData.append('avatar', avatar)
        }

        if (dateOfBirth) {
          formData.append('dateOfBirth', dateOfBirth)
        }

        return {
          url: '/users/me',
          method: 'PUT',
          data: formData,
          headers: undefined,
        }
      },

      invalidatesTags: ['Profile'],
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
} = userApi
