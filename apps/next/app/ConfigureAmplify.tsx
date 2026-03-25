// apps/next/app/ConfigureAmplify.tsx
'use client'

import { Amplify } from 'aws-amplify'
import { amplifyConfig } from 'app/config/amplify-config'

// Chạy cấu hình ngay khi component được load
Amplify.configure(amplifyConfig, { ssr: true })

export default function ConfigureAmplify() {
  return null
}
