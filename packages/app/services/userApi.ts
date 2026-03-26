import { ApiResponse, PageResponse, UserResponse } from 'app/types/Response'
import { baseApi } from './baseApi'
import { FindUserByEmailRequest } from 'app/types/Request'

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<
      any, // response type (tạm để any, lát mình tối ưu sau)
      string | void // argument type
    >({
      query: (id) =>
        id ? { url: `/users/${id}`, method: 'GET' } : { url: '/users/me', method: 'GET' },
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
  overrideExisting: false,
})

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useFindUserByEmailQuery,
  useLazyFindUserByEmailQuery,
  useUpdateProfileMutation,
} = userApi
