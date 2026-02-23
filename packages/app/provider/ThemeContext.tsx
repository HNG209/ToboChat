import { createContext, useContext } from 'react'

// 1. Đổi tên thành light và dark để khớp với bộ màu mặc định của Tamagui
type ThemeType = 'light' | 'dark'

export const ThemeContext = createContext<{
  theme: ThemeType
  setTheme: React.Dispatch<React.SetStateAction<ThemeType>>
} | null>(null)

export const useAppTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useAppTheme must be used inside ThemeProvider')
  return context
}
