// packages/app/store/authSlice.ts
import { createSlice } from '@reduxjs/toolkit'
import { userApi } from 'app/services/userApi'
import { UserResponse } from 'app/types/Response'
import { User } from 'app/types/User'

export interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(userApi.endpoints.getProfile.matchFulfilled, (state, action) => {
      // action.payload chính là thông tin user từ backend trả về
      state.user = action.payload
      state.isAuthenticated = true
    })
    builder.addMatcher(userApi.endpoints.getProfile.matchRejected, (state) => {
      state.user = null
      state.isAuthenticated = false
    })
  },
})

export default authSlice.reducer
