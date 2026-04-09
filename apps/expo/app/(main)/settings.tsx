import SettingsScreen from 'app/features/settings/settings-screen'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <SettingsScreen />
    </SafeAreaView>
  )
}
