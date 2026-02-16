import { createContext, useContext } from 'react'

type ThemeType = 'zaloLight' | 'zaloDark'

export const ThemeContext = createContext<{
  theme: ThemeType
  setTheme: React.Dispatch<React.SetStateAction<ThemeType>>
} | null>(null)

export const useAppTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useAppTheme must be used inside ThemeProvider')
  return context
}
