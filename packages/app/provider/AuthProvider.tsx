import { useGetProfileQuery } from 'app/store/api'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('AuthProvider rendered')
  useGetProfileQuery(undefined)

  return <>{children}</>
}
