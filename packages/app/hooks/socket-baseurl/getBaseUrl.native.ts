import Constants from 'expo-constants'

export const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri
  const ip = hostUri ? hostUri.split(':').shift() : '192.168.1.xxx'
  return `http://${ip}:8085`
}
