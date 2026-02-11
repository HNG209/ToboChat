'use client'

import { ChatDetailScreenMain } from './ChatDetailScreenMain'
import { createParam } from 'solito'
import { useParams } from 'next/navigation'
import { Platform } from 'react-native' // Import thêm cái này

const { useParam } = createParam<{ id: string }>()

export default function Page() {
  // 1. Lấy params cho Web
  const nextParams = useParams()

  // 2. Lấy params cho Native
  // Chúng ta chỉ gọi useParam của Solito nếu KHÔNG PHẢI là Web
  let solitoId: string | undefined = undefined

  if (Platform.OS !== 'web') {
    const [id] = useParam('id')
    solitoId = id
  }

  // Kết hợp: Ưu tiên lấy từ Next.js Web, nếu không có (trên Mobile) thì lấy từ Solito
  const id = (nextParams?.id as string) || solitoId

  return <ChatDetailScreenMain id={id || ''} />
}
