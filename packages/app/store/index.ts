import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from './api' // Cái api RTK Query bạn tạo lúc nãy
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    // Quản lý Auth
    auth: authReducer,
    // Quản lý API caching
    [api.reducerPath]: api.reducer,
  },
  // Thêm middleware của RTK Query
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
})

setupListeners(store.dispatch)

// Export type để dùng cho TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
