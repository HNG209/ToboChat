import { useColorScheme } from 'react-native'
import {
  CustomToast,
  TamaguiProvider,
  type TamaguiProviderProps,
  ToastProvider,
  config,
} from '@my/ui'
import { ToastViewport } from './ToastViewport'
import { AuthProvider } from './AuthProvider'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from 'app/store'

import { ThemeContext } from './ThemeContext'
import { useEffect, useState } from 'react'
import { Theme } from '@my/ui'
import { YStack } from '@my/ui'

// Phan chuyen doi ngon ngu
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
export function Provider({ children }) {
  const systemScheme = useColorScheme()

  // 2. Sử dụng 'light' | 'dark' làm giá trị mặc định (đúng chuẩn Tamagui Starter)
  const [theme, setTheme] = useState<'light' | 'dark'>(systemScheme || 'light')

  // 3. (Tùy chọn) Tự động đổi theme khi người dùng đổi chế độ máy
  useEffect(() => {
    if (systemScheme) {
      setTheme(systemScheme)
    }
  }, [systemScheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {/* defaultTheme giúp Tamagui biết nên render kiểu gì ban đầu */}
      <TamaguiProvider config={config} defaultTheme={theme}>
        {/* Component Theme này sẽ áp các token màu $background, $color... theo theme hiện tại */}
        <I18nextProvider i18n={i18n}>
          <Theme name={theme}>
            {/* YStack với $background sẽ lấy màu trắng (#fff) nếu là light, màu đen (#050505) nếu là dark */}
            <YStack flex={1} backgroundColor="$background">
              <ReduxProvider store={store}>
                <AuthProvider>
                  <ToastProvider
                    swipeDirection="horizontal"
                    duration={6000}
                    native={[]}
                    // native={isWeb ? [] : ['mobile']}
                  >
                    {children}
                    <CustomToast />
                  </ToastProvider>
                </AuthProvider>
              </ReduxProvider>
            </YStack>
          </Theme>
        </I18nextProvider>
      </TamaguiProvider>
    </ThemeContext.Provider>
  )
}
