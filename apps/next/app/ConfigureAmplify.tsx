// apps/next/app/ConfigureAmplify.tsx
'use client' // 👈 Dòng này bắt buộc để chạy trên trình duyệt

import { Amplify } from 'aws-amplify'
import config from 'app/config/amplifyconfiguration.json'

// Chạy cấu hình ngay khi component được load
Amplify.configure(config, { ssr: true })

export default function ConfigureAmplify() {
  return null // Component này không hiển thị gì cả, chỉ chạy logic
}
