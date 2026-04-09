import Request from 'app/features/contacts/Request'
import RequestNative from 'app/features/contacts/Request.native'
import { Platform } from 'react-native'

export default function Page() {
  const Component = Platform.OS === 'web' ? Request : RequestNative
  return <Component />
}
