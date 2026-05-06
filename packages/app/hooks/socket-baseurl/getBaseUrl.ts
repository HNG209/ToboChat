export const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8085' // Next.js sẽ chỉ đọc file này
}
