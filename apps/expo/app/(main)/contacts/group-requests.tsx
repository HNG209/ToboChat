import GroupRequest from 'app/features/contacts/GroupRequest'
import GroupRequestNative from 'app/features/contacts/GroupRequest.native'
import { Platform } from 'react-native'

export default function Page() {
  const Component = Platform.OS === 'web' ? GroupRequest : GroupRequestNative
  return <Component />
}
