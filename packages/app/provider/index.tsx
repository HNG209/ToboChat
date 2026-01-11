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
// import { AuthProvider } from './AuthProvider'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from 'app/store'

export function Provider({
  children,
  defaultTheme = 'light',
  ...rest
}: Omit<TamaguiProviderProps, 'config'> & { defaultTheme?: string }) {
  const colorScheme = useColorScheme()
  const theme = defaultTheme || (colorScheme === 'dark' ? 'dark' : 'light')

  return (
    <TamaguiProvider config={config} defaultTheme={theme} {...rest}>
      <ReduxProvider store={store}>
        {/* <AuthProvider> */}
        <ToastProvider
          swipeDirection="horizontal"
          duration={6000}
          native={[]}
          // native={isWeb ? [] : ['mobile']}
        >
          {children}
          <CustomToast />
          <ToastViewport />
        </ToastProvider>
        {/* </AuthProvider> */}
      </ReduxProvider>
    </TamaguiProvider>
  )
}
