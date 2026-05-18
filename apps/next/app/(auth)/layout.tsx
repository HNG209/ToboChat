'use client'

import type { ReactNode } from 'react'
import { Auth } from 'app/features/auth/Auth'

export default function AuthLayout({ children }: { children: ReactNode }) {

  return <Auth>{children}</Auth>

}