'use client'
// Import cái khung 3 cột bạn viết ở dưới packages
import ChatLayout from 'app/features/chat/ChatLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChatLayout>
      {/* children ở đây chính là nội dung của các file page.tsx bên trong thư mục chat */}
      {children}
    </ChatLayout>
  )
}
