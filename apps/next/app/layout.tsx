import type { Metadata } from 'next'
import { NextTamaguiProvider } from 'app/provider/NextTamaguiProvider'
import ConfigureAmplify from './ConfigureAmplify'
import ChatLayout from 'app/features/chat/ChatLayout'

export const metadata: Metadata = {
  title: 'ToboChat',
  description: 'Tamagui, Solito, Expo & Next.js',
  icons: '/favicon.ico',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // You can use `suppressHydrationWarning` to avoid the warning about mismatched content during hydration in dev mode
    <html lang="en" suppressHydrationWarning>
      <body>
        <ConfigureAmplify />
        <NextTamaguiProvider>
          <ChatLayout>
          {children}
          </ChatLayout>
        </NextTamaguiProvider>
      </body>
    </html>
  )
}
