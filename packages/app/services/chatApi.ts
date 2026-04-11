import { MessageResponse, PageResponse, RoomResponse } from 'app/types/Response'
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
          attachments: sendMessageRequest.attachments,
        },
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
  }),
})

export const {
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useLazyGetPresignedUrlQuery,
} = chatApi
