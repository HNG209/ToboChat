import Profile from 'app/features/user/profile-tab-screen'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <Profile />
    </SafeAreaView>
  )
}
