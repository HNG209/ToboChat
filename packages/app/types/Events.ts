export interface RoomUpdateEvent {
  roomId: string
  payload: RoomUpdatePayload
}

export interface RoomUpdatePayload {
    newRoomName?: string;
    newRoomAvatar?: string;
    allowSendMessage?: boolean;
    allowAddMember?: boolean;
    allowUpdateMetadata?: boolean;
    approveMember?: boolean;
}
