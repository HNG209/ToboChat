'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Auth } from 'app/features/auth/Auth'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <Auth />
  }

  return <>{children}</>
}