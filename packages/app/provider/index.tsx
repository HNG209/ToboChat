import { useColorScheme } from 'react-native'
import {
  CustomToast,
  TamaguiProvider,
  type TamaguiProviderProps,
  ToastProvider,
  config,
  isWeb,
} from '@my/ui'
import { ToastViewport } from './ToastViewport'
import { AuthProvider } from './AuthProvider'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from 'app/store'

import { ThemeContext } from './ThemeContext'
import { useState } from 'react'
import { Theme } from '@my/ui'
import { YStack } from '@my/ui'

export function Provider({ children }) {
  const [theme, setTheme] = useState<'zaloLight' | 'zaloDark'>('zaloLight')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <TamaguiProvider config={config} defaultTheme={theme}>
        {/* Ép toàn bộ con bên trong render theo theme state */}
        <Theme name={theme}>
          {/* YStack này đảm bảo nền của app luôn ăn theo theme */}
          <YStack flex={1} backgroundColor="$background">
            <ReduxProvider store={store}>
              <AuthProvider>{children}</AuthProvider>
            </ReduxProvider>
          </YStack>
        </Theme>
      </TamaguiProvider>
    </ThemeContext.Provider>
  )
}
