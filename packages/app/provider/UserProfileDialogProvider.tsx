import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from 'app/store'
import { closeUserProfileDialog } from 'app/store/userProfileDialogSlice'
import { UserProfileDialog } from './UserProfileDialog'

type UserProfileDialogProviderProps = {
  scope?: RootState['userProfileDialog']['scope']
  usePortal?: boolean
}

export function UserProfileDialogProvider({
  scope = 'global',
  usePortal = true,
}: UserProfileDialogProviderProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { isOpen, currentUserId, currentUser, scope: activeScope } = useSelector(
    (state: RootState) => state.userProfileDialog
  )
  const myUserId = useSelector((state: RootState) => state.auth.user?.id)
  const shouldRender = isOpen && activeScope === scope

  if (!shouldRender) return null

  return (
    <UserProfileDialog
      open
      userId={currentUserId}
      user={currentUser}
      currentUserId={myUserId}
      usePortal={usePortal}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          dispatch(closeUserProfileDialog())
        }
      }}
    />
  )
}
