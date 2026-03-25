'use client'
import ChatDetailScreenMain from 'app/features/chat/ChatDetailScreenMain'
import { useParams } from 'next/navigation'

export default function Page() {
  const { id } = useParams()
  // Truyền id vào component chi tiết để load tin nhắn

  return <ChatDetailScreenMain id={id as string} />
}
