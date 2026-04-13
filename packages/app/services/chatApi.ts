import { MessageResponse, PageResponse } from 'app/types/Response'
import { baseApi } from './baseApi'
import { SendMessageRequest } from 'app/types/Request'

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendMessage: builder.mutation<void, SendMessageRequest>({
      query: (sendMessageRequest) => ({
        url: `/chat/rooms/${sendMessageRequest.roomId}/messages`,
        method: 'POST',
        data: {
          content: sendMessageRequest.content,
          messageType: sendMessageRequest.messageType,
          replyTo: sendMessageRequest.replyTo,
          attachments: sendMessageRequest.attachments,
        },
      }),
    }),

    getMessages: builder.query<
      PageResponse<MessageResponse>,
      { roomId: string; cursor?: string; limit?: number; direction?: 'before' | 'after' | 'both' }
    >({
      query: (params) => {
        return {
          url: `/chat/rooms/${params.roomId}/messages`,
          method: 'GET',
          params: {
            cursor: params.cursor ?? undefined,
            limit: params.limit || 20,
            direction: params.direction || 'before',
          },
        }
      },

      // gom cache theo roomId
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs.roomId}`
      },

      // Cho phép gọi lại API khi cursor thay đổi
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.cursor !== previousArg?.cursor ||
          currentArg?.direction !== previousArg?.direction
        )
      },

      // Optional: merge tự động
      merge: (currentCache, newData, { arg }) => {
        if (!currentCache.items) {
          currentCache.items = []
        }

        const existingIds = new Set(currentCache.items.map((i) => i.id))
        const newItems = newData.items.filter((i) => !existingIds.has(i.id))

        // Nếu cache rỗng (lần đầu load hoặc vừa reply), gán cả 2 cursor và items
        if (currentCache.items.length === 0) {
          console.log('Cache empty, setting new data')
          currentCache.items = newData.items
          currentCache.nextCursor = newData.nextCursor
          currentCache.prevCursor = newData.prevCursor
          return
        }

        if (arg.direction === 'after') {
          console.log('Merging new items at the beginning')
          // Tin mới → lên đầu, chỉ cập nhật prevCursor
          currentCache.items.unshift(...newItems)
          currentCache.prevCursor = newData.prevCursor
        } else {
          console.log('Merging new items at the end')
          // Tin cũ → xuống cuối, chỉ cập nhật nextCursor
          currentCache.items.push(...newItems)
          currentCache.nextCursor = newData.nextCursor
        }
      },

      providesTags: (result, error, arg) => [{ type: 'Messages', id: arg.roomId }],
    }),
    getPresignedUrl: builder.query<any, { roomId: string; fileName: string; contentType: string }>({
      query: (params) => ({
        url: `/chat/upload/${params.roomId}`,
        method: 'GET',
        params: {
          fileName: params.fileName,
          contentType: params.contentType,
        },
      }),
      // Bóc lớp vỏ 'result' ngay tại đây
      transformResponse: (response: any) => {
        console.log('Raw Response từ Backend:', response) // Log để bạn tự soi trong Console
        return response
      },
    }),
    // ham xoa tin nhan
    revokeMessage: builder.mutation<void, { roomId: string; messageId: string }>({
      query: ({ roomId, messageId }) => ({
        url: `/chat/rooms/${roomId}/messages/revoke`,
        method: 'POST',
        data: {
          messageId,
        },
      }),
    }),
    // forward tin nhan
    forwardMessages: builder.mutation<
      void,
      { fromRoomId: string; toRoomIds: string[]; messageIds: string[] }
    >({
      query: (data) => ({
        url: `/chat/rooms/forwardMessage`,
        method: 'POST',
        data,
      }),
    }),
  }),
})

export const {
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useLazyGetPresignedUrlQuery,
  useRevokeMessageMutation,
  useForwardMessagesMutation,
} = chatApi
