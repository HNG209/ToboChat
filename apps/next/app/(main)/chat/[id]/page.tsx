'use client'
import { ChatScreenWrapper } from 'app/features/chat/ChatScreenWrapper'
import { useDispatch } from 'react-redux'
import { useParams } from 'next/navigation'
import { clearActiveRoom, setActiveRoom } from 'app/store/chatSlice'
import { useEffect } from 'react'

export default function Page() {
  const { id } = useParams()
  const dispatch = useDispatch()

  useEffect(() => {
    if (id) {
      dispatch(setActiveRoom(id as string))
    }

    return () => {
      dispatch(clearActiveRoom())
    }
  }, [id])

  return <ChatScreenWrapper roomId={id as string} />
}
