import { MessageResponse, PageResponse, RoomResponse } from 'app/types/Response'
import { baseApi } from './baseApi'
import { SendMessageRequest } from 'app/types/Request'

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendMessage: builder.mutation<void, SendMessageRequest>({
      query: (sendMessageRequest) => ({
        url: `/chat/rooms/${sendMessageRequest.roomId}/messages`,
        method: 'POST',
        data: { content: sendMessageRequest.content, messageType: sendMessageRequest.messageType },
      }),
    }),

    getMessages: builder.query<
      PageResponse<MessageResponse>,
      { roomId: string; cursor?: string; limit?: number }
    >({
      query: (params) => ({
        url: `/chat/rooms/${params.roomId}/messages`, // Trả lại URL sạch sẽ, không có dấu ?
        method: 'GET',
        params: {
          // Chỉ truyền những gì cần làm query string vào đây
          // Nếu cursor rỗng, truyền undefined để HTTP Client bỏ qua param đó
          cursor: params.cursor || undefined,
          limit: params.limit || 20,
        },
      }),
    }),
  }),
})

export const { useGetMessagesQuery, useLazyGetMessagesQuery, useSendMessageMutation } = chatApi
