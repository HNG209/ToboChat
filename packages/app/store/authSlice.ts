// packages/app/store/authSlice.ts
import { createSlice } from '@reduxjs/toolkit'
import { api } from './api'
import { User } from 'app/types/User'

export interface AuthState {
  user: User | null
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
    builder.addMatcher(api.endpoints.getProfile.matchFulfilled, (state, action) => {
      // action.payload chính là thông tin user từ backend trả về
      state.user = action.payload
      state.isAuthenticated = true
    })
    builder.addMatcher(api.endpoints.getProfile.matchRejected, (state) => {
      state.user = null
      state.isAuthenticated = false
    })
  },
})

export default authSlice.reducer
