import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { baseApi } from 'app/services/baseApi'
import authReducer from './authSlice'
import chatReducer from './chatSlice'

export const store = configureStore({
  reducer: {
    api: baseApi.reducer,
    // Quản lý Auth
    auth: authReducer,
    chat: chatReducer,
  },
  // Thêm middleware của RTK Query
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
})

setupListeners(store.dispatch)

// Export type để dùng cho TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
