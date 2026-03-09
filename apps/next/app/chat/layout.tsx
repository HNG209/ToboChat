'use client'
import ChatLayout from 'app/features/chat/ChatLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChatLayout>
      {children}
    </ChatLayout>
  )
}
