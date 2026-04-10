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
        },
      }),
    }),

    getMessages: builder.query<
      PageResponse<MessageResponse>,
      { roomId: string; cursor?: string; limit?: number; direction?: 'before' | 'after' }
    >({
      query: (params) => ({
        url: `/chat/rooms/${params.roomId}/messages`,
        method: 'GET',
        params: {
          cursor: params.cursor || undefined,
          limit: params.limit || 20,
          direction: params.direction || 'before',
        },
      }),

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

        if (arg.direction === 'after') {
          // tin mới → lên đầu
          currentCache.items.unshift(...newItems)
          currentCache.prevCursor = newData.prevCursor
        } else {
          // tin cũ → xuống cuối
          currentCache.items.push(...newItems)
          currentCache.nextCursor = newData.nextCursor
        }
      },
    }),
  }),
})

export const { useGetMessagesQuery, useLazyGetMessagesQuery, useSendMessageMutation } = chatApi
