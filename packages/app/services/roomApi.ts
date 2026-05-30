import {
  ApiResponse,
  PageResponse,
  RoomResponse,
  GroupAcceptRequestResponse,
  RoomMemberResponse,
  LeaveCheckResponse,
  GroupPendingRequestResponse,
  FriendResponse,
  AttachmentItemResponse,
} from 'app/types/Response'
import { baseApi } from './baseApi'
import { RoomStatus } from '@my/ui'
import { MemberUpdateRequest, RoomCreateRequest, RoomUpdateRequest } from 'app/types/Request'
import { AttachmentType } from 'app/types/Enums'

export const roomApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJoinedRooms: builder.query<
      PageResponse<RoomResponse>,
      { status: RoomStatus; cursor?: string; limit?: number }
    >({
      // Lấy danh sách phòng của người dùng hiện tại
      query: (params) => ({
        url: `/rooms`,
        method: 'GET',
        params: {
          status: params.status,
          cursor: params.cursor,
          limit: params.limit,
        },
      }),

      serializeQueryArgs: ({ queryArgs, endpointName }) => {
        // Tạo cache key chỉ dựa trên endpointName và status.
        // Bỏ qua cursor, để tất cả các trang của cùng một status dùng chung 1 cache.
        return `${endpointName}-${queryArgs.status}`
      },

      // Ép gọi lại API khi cursor thay đổi
      forceRefetch({ currentArg, previousArg }) {
        // Bắt buộc fetch lại khi người dùng yêu cầu một cursor mới
        return currentArg?.cursor !== previousArg?.cursor && currentArg?.cursor !== undefined
      },

      merge: (currentCache, newData, { arg }) => {
        if (!arg.cursor) {
          return newData
        }

        if (!currentCache.items) {
          currentCache.items = []
        }

        const existingIds = new Set(currentCache.items.map((i) => i.id))
        const newItems = newData.items.filter((i) => !existingIds.has(i.id))
        currentCache.items.push(...newItems)
        currentCache.nextCursor = newData.nextCursor
      },
      providesTags: ['Rooms'],
    }),

    // Thông tin của tôi trong nhóm
    getMyInfo: builder.query<RoomMemberResponse, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/rooms/${roomId}/me`,
        method: 'GET',
      }),
    }),

    // Lấy danh sách lời mời tham gia nhóm
    getGroupInvites: builder.query<PageResponse<GroupAcceptRequestResponse>, void>({
      query: () => ({
        url: '/group-invites',
        method: 'GET',
      }),
      providesTags: ['Rooms'],
    }),

    // Phản hồi lời mời tham gia nhóm
    respondGroupInvite: builder.mutation<RoomResponse, { groupId: string; accepted: boolean }>({
      query: ({ groupId, accepted }) => ({
        url: `/group-invites/${groupId}`,
        method: 'PUT',
        params: { accepted },
      }),

      invalidatesTags: (result, error, arg) => [{ type: 'RoomMember', id: arg.groupId }, 'Rooms'],
    }),

    // Tạo nhóm
    createGroup: builder.mutation<RoomResponse, RoomCreateRequest>({
      query: (data) => ({
        url: '/rooms',
        method: 'POST',
        data,
      }),
    }),

    // Cập nhật setting của nhóm
    updateRoomSettings: builder.mutation<void, { roomId: string; request: RoomUpdateRequest }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}`,
        method: 'PATCH',
        data: {
          ...data.request,
        },
      }),
      // invalidatesTags: (result, error, arg) => [{ type: 'RoomMetadata', id: arg.roomId }],
    }),

    // Danh sách thành viên nhóm
    getRoomMembers: builder.query<PageResponse<RoomMemberResponse>, { roomId: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}/members`,
        method: 'GET',
      }),
      providesTags: (result, error, arg) => [
        { type: 'RoomMember', id: arg.roomId }, // Tag cụ thể cho phòng này
      ],
    }),

    // Cập nhật vai trò thành viên
    updateMember: builder.mutation<
      void,
      { roomId: string; memberId: string; request: MemberUpdateRequest }
    >({
      query: (data) => ({
        url: `/rooms/${data.roomId}/members/${data.memberId}`,
        method: 'PATCH',
        data: data.request,
      }),
    }),

    // Kiểm tra có thể rời nhóm
    checkLeave: builder.mutation<LeaveCheckResponse, { roomId: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}/leave-check`,
        method: 'POST',
      }),
    }),

    // Rời nhóm
    leaveGroup: builder.mutation<void, { roomId: string; newAdminId?: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}/members/me`,
        method: 'DELETE',
        params: {
          newAdminId: data.newAdminId || null,
        },
      }),
    }),

    // Xoá thành viên khỏi nhóm
    removeMember: builder.mutation<void, { roomId: string; memberId: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}/members/${data.memberId}`,
        method: 'DELETE',
      }),
    }),

    // Giải tán nhóm
    disbandGroup: builder.mutation<void, { roomId: string }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}`,
        method: 'DELETE',
      }),
    }),

    // Thêm thành viên khi đã có nhóm
    addMembers: builder.mutation<FriendResponse[], { roomId: string; targetUserIds: string[] }>({
      query: ({ roomId, targetUserIds }) => ({
        url: `/rooms/${roomId}/members`,
        method: 'POST',
        data: { targetUserIds },
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'RoomMember', id: arg.roomId }],
    }),

    // Thông tin phòng, bao gồm các settings của phòng
    getRoomMetadata: builder.query<RoomResponse, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/rooms/${roomId}`,
        method: 'GET',
      }),
      providesTags: (result, error, arg) => [{ type: 'RoomMetadata', id: arg.roomId }],
    }),

    getPendingRequest: builder.query<PageResponse<GroupPendingRequestResponse>, { roomId: string }>(
      {
        query: ({ roomId }) => ({
          url: `/rooms/${roomId}/pending-requests`,
          method: 'GET',
        }),
        // providesTags: (result, error, arg) => [{ type: 'RoomMetadata', id: arg.roomId }],
      }
    ),

    approveMember: builder.mutation<void, { roomId: string; userId: string; accept: boolean }>({
      query: (data) => ({
        url: `/rooms/${data.roomId}/pending-requests/${data.userId}`,
        method: 'PATCH',
        params: {
          accept: data.accept,
        },
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'RoomMember', id: arg.roomId }],
    }),

    // Lấy presigned URL để upload ảnh nhóm
    getGroupImageUploadUrl: builder.mutation<
      { presignedUrl: string; fileUrl: string } | { url: string; fileUrl?: string },
      { roomId: string; contentType: string }
    >({
      query: ({ roomId, contentType }) => ({
        url: `/rooms/${roomId}/avatar/upload-url`,
        method: 'GET',
        params: { contentType },
      }),
    }),
    updateRoomName: builder.mutation<void, { roomId: string; roomName: string }>({
      query: ({ roomId, roomName }) => ({
        url: `/rooms/${roomId}/name`,
        method: 'PATCH',
        data: { roomName },
      }),

      invalidatesTags: (result, error, arg) => [
        { type: 'RoomMetadata', id: arg.roomId },
        { type: 'Rooms' }, // update list chat sidebar luôn
      ],
    }),
    updateRoomAvatar: builder.mutation<void, { roomId: string; avatarUrl: string }>({
      query: ({ roomId, avatarUrl }) => ({
        url: `/rooms/${roomId}/avatar`,
        method: 'PATCH',
        data: { avatarUrl },
      }),

      invalidatesTags: (result, error, arg) => [
        { type: 'RoomMetadata', id: arg.roomId },
        { type: 'Rooms' },
      ],
    }),
    getRoomAttachments: builder.query<
      PageResponse<AttachmentItemResponse>,
      { roomId: string; type: AttachmentType; limit?: number; cursor?: string }
    >({
      query: ({ roomId, type, limit = 20, cursor }) => ({
        url: `/chat/rooms/${roomId}/attachments`,
        method: 'GET',
        params: { type, limit, cursor: cursor || undefined },
      }),

      serializeQueryArgs: ({ queryArgs, endpointName }) => {
        // Tách biệt hoàn toàn phân vùng lưu trữ cho MEDIA và FILE
        return `${endpointName}-${queryArgs.roomId}-${queryArgs.type}`
      },

      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor && currentArg?.cursor !== undefined
      },

      // CHỈNH SỬA TẠI ĐÂY:
      merge: (currentCache, newData, { arg }) => {
        // Lấy item đầu tiên trong cache hiện tại để kiểm tra xem nó thuộc loại nào (MEDIA hay FILE)
        const currentCacheType = currentCache.items?.[0]?.detail?.contentType;
        const newDataType = newData.items?.[0]?.detail?.contentType;

        // Nếu KHÔNG có cursor (tải trang đầu), hoặc mảng cũ trống, 
        // hoặc loại dữ liệu trong cache hiện tại khác hoàn toàn loại dữ liệu mới gửi về (ví dụ chuyển từ hình sang file)
        if (!arg.cursor || !currentCache.items || currentCache.items.length === 0) {
          return newData // Thay thế hoàn toàn, xóa sạch vết tích tab cũ
        }

        // Chỉ tiến hành gộp mảng khi và chỉ khi đang thực hiện "Xem thêm" trên CÙNG MỘT TAB
        const existingIds = new Set(currentCache.items.map((i) => i.attachmentId))
        const newItems = newData.items.filter((i) => !existingIds.has(i.attachmentId))

        currentCache.items.push(...newItems)
        currentCache.nextCursor = newData.nextCursor
      },
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetJoinedRoomsQuery,
  useGetMyInfoQuery,
  useCreateGroupMutation,
  useDisbandGroupMutation,
  useGetRoomMembersQuery,
  useUpdateMemberMutation,
  useRemoveMemberMutation,
  useCheckLeaveMutation,
  useLeaveGroupMutation,
  useUpdateRoomSettingsMutation,
  useRespondGroupInviteMutation,
  useGetGroupInvitesQuery,
  useGetRoomMetadataQuery,
  useAddMembersMutation,
  useGetPendingRequestQuery,
  useApproveMemberMutation,
  useGetGroupImageUploadUrlMutation,
  useUpdateRoomAvatarMutation,
  useUpdateRoomNameMutation,
  useGetRoomAttachmentsQuery,
} = roomApi
