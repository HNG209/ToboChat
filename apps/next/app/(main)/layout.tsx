'use client'
import ChatLayout from 'app/features/chat/ChatLayout'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatLayout>
      {children}
    </ChatLayout>
  )
}