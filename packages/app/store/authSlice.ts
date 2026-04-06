// packages/app/store/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { userApi } from 'app/services/userApi'
import { UserResponse } from 'app/types/Response'
import { User } from 'app/types/User'

export interface AuthState {
  user: UserResponse | null
  // True when Amplify has a current signed-in user (session exists)
  hasSession: boolean
}

const initialState: AuthState = {
  user: null,
  hasSession: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuth: () => initialState,
    setHasSession: (state, action: PayloadAction<boolean>) => {
      state.hasSession = action.payload
      if (!action.payload) {
        state.user = null
      }
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(userApi.endpoints.getProfile.matchFulfilled, (state, action) => {
      // action.payload chính là thông tin user từ backend trả về
      state.user = action.payload
    })
    builder.addMatcher(userApi.endpoints.getProfile.matchRejected, (state) => {
      state.user = null
    })
  },
})

export default authSlice.reducer

export const { resetAuth, setHasSession } = authSlice.actions
