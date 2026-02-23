import { useColorScheme } from 'react-native'
import { TamaguiProvider, type TamaguiProviderProps, config } from '@my/ui'
import { ToastViewport } from './ToastViewport'
import { AuthProvider } from './AuthProvider'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from 'app/store'

import { ThemeContext } from './ThemeContext'
import { useEffect, useState } from 'react'
import { Theme } from '@my/ui'
import { YStack } from '@my/ui'

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
        <Theme name={theme}>
          {/* YStack với $background sẽ lấy màu trắng (#fff) nếu là light, màu đen (#050505) nếu là dark */}
          <YStack flex={1} backgroundColor="$background">
            <ReduxProvider store={store}>
              <AuthProvider>{children}</AuthProvider>
            </ReduxProvider>
          </YStack>
        </Theme>
      </TamaguiProvider>
    </ThemeContext.Provider>
  )
  // const [theme, setTheme] = useState<'zaloLight' | 'zaloDark'>('zaloLight')
  // return (
  //   <ThemeContext.Provider value={{ theme, setTheme }}>
  //     <TamaguiProvider config={config} defaultTheme={theme}>
  //       {/* Ép toàn bộ con bên trong render theo theme state */}
  //       <Theme name={theme}>
  //         {/* YStack này đảm bảo nền của app luôn ăn theo theme */}
  //         <YStack flex={1} backgroundColor="$background">
  //           <ReduxProvider store={store}>
  //             <AuthProvider>{children}</AuthProvider>
  //           </ReduxProvider>
  //         </YStack>
  //       </Theme>
  //     </TamaguiProvider>
  //   </ThemeContext.Provider>
  // )
}
