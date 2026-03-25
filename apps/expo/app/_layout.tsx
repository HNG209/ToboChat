import 'react-native-get-random-values'
import { useEffect } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, Tabs } from 'expo-router'
import { Provider } from 'app/provider'
import { NativeToast } from '@my/ui/src/NativeToast'
import { Amplify } from 'aws-amplify'
import { amplifyConfig } from 'app/config/amplify-config'
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAppTheme } from 'app/provider/ThemeContext'

Amplify.configure(amplifyConfig)

cognitoUserPoolsTokenProvider.setKeyValueStorage({
  setItem: AsyncStorage.setItem,
  getItem: AsyncStorage.getItem,
  removeItem: AsyncStorage.removeItem,
  clear: AsyncStorage.clear,
})

export const unstable_settings = {
  // Ensure that reloading on `/user` keeps a back button present.
  initialRouteName: 'Home',
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [interLoaded, interError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  useEffect(() => {
    if (interLoaded || interError) {
      // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
      SplashScreen.hideAsync()
    }
  }, [interLoaded, interError])

  if (!interLoaded && !interError) {
    return null
  }

  return (
    <Provider>
      <RootLayoutNav />
    </Provider>
  )
}

function RootLayoutNav() {
  const { theme } = useAppTheme()
  const isDark = theme === 'dark'

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {/* Fix StatusBar theo theme của App */}
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Stack
        screenOptions={{
          contentStyle: {
            // Fix lỗi hở trắng trên Android
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
        }}
      >
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      </Stack>
      <NativeToast />
    </ThemeProvider>
  )
}
