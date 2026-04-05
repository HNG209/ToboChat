'use client'
import { ChatScreenWrapper } from 'app/features/chat/ChatScreenWrapper'

import { useParams } from 'next/navigation'

export default function Page() {
  const { id } = useParams()

  return <ChatScreenWrapper roomId={id as string} />
}
