// apps/next/app/ConfigureAmplify.tsx
'use client'

import { Amplify } from 'aws-amplify'
import config from 'app/config/amplifyconfiguration.json'

// Chạy cấu hình ngay khi component được load
Amplify.configure(config, { ssr: true })

export default function ConfigureAmplify() {
  return null
}
