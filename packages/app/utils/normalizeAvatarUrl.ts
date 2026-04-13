const KNOWN_EXTS = ['jpeg', 'jpg', 'png', 'webp', 'gif'] as const

export function normalizeAvatarUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (typeof url !== 'string') return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined

  // Keep non-http(s) URIs as-is (e.g. expo file://, content://)
  if (!/^https?:\/\//i.test(trimmed)) return trimmed

  // Split query/hash to avoid breaking signed URLs.
  const queryIndex = trimmed.indexOf('?')
  const hashIndex = trimmed.indexOf('#')
  const cutIndex =
    queryIndex === -1 ? hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex)

  const base = cutIndex === -1 ? trimmed : trimmed.slice(0, cutIndex)
  const suffix = cutIndex === -1 ? '' : trimmed.slice(cutIndex)

  const lastSlash = base.lastIndexOf('/')
  if (lastSlash === -1) return trimmed

  const dir = base.slice(0, lastSlash + 1)
  const file = base.slice(lastSlash + 1)
  if (!file) return trimmed

  // If it already has a dot-extension, leave it alone.
  if (file.includes('.')) return trimmed

  const lower = file.toLowerCase()
  const ext = KNOWN_EXTS.find((e) => lower.endsWith(e))
  if (!ext) return trimmed

  const stem = file.slice(0, file.length - ext.length)
  if (!stem) return trimmed

  return `${dir}${stem}.${ext}${suffix}`
}
