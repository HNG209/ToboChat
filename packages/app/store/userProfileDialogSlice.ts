import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserResponse } from 'app/types/Response'

export interface UserProfileDialogState {
  isOpen: boolean
  currentUserId: string | null
  currentUser: UserResponse | null
  friendStatusByUserId: Record<string, UserResponse['friendStatus']>
  scope: 'global' | 'conversationInfo'
}

const initialState: UserProfileDialogState = {
  isOpen: false,
  currentUserId: null,
  currentUser: null,
  friendStatusByUserId: {},
  scope: 'global',
}

const userProfileDialogSlice = createSlice({
  name: 'userProfileDialog',
  initialState,
  reducers: {
    openUserProfileDialog: (state, action: PayloadAction<string | UserResponse>) => {
      openDialog(state, action.payload, 'global')
    },
    openConversationInfoUserProfileDialog: (
      state,
      action: PayloadAction<string | UserResponse>
    ) => {
      openDialog(state, action.payload, 'conversationInfo')
    },
    closeUserProfileDialog: (state) => {
      state.isOpen = false
      state.currentUserId = null
      state.currentUser = null
      state.scope = 'global'
    },
    setUserProfileFriendStatus: (
      state,
      action: PayloadAction<{ userId: string; friendStatus: UserResponse['friendStatus'] }>
    ) => {
      state.friendStatusByUserId[action.payload.userId] = action.payload.friendStatus
      if (state.currentUserId === action.payload.userId && state.currentUser) {
        state.currentUser.friendStatus = action.payload.friendStatus
      }
    },
  },
})

function openDialog(
  state: UserProfileDialogState,
  payload: string | UserResponse,
  scope: UserProfileDialogState['scope']
) {
      state.isOpen = true
      state.scope = scope
      if (typeof payload === 'string') {
        state.currentUserId = payload
        state.currentUser = null
      } else {
        const cachedFriendStatus = state.friendStatusByUserId[payload.id]
        state.currentUserId = payload.id
        state.currentUser = {
          ...payload,
          friendStatus: cachedFriendStatus ?? payload.friendStatus,
        }
      }
}

export const {
  openUserProfileDialog,
  openConversationInfoUserProfileDialog,
  closeUserProfileDialog,
  setUserProfileFriendStatus,
} = userProfileDialogSlice.actions
export default userProfileDialogSlice.reducer
