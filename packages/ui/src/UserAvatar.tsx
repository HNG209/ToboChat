import { Image, Text, XStack } from 'tamagui'

type UserAvatarProps = {
  avatarUrl?: string | null
  name?: string | null
  id?: string | null
  size?: AvatarSize
  borderWidth?: number
  borderColor?: string
  [key: string]: any
}

type AvatarSize = '$1.5' | '$3' | '$4' | '$5' | '$6' | '$7' | '$8' | '$10' | number

const SIZE_MAP: Record<Exclude<AvatarSize, number>, number> = {
  '$1.5': 18,
  '$3': 28,
  '$4': 40,
  '$5': 48,
  '$6': 56,
  '$7': 72,
  '$8': 96,
  '$10': 100,
}

const PALETTE = [
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#DCFCE7', fg: '#15803D' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#E0E7FF', fg: '#4338CA' },
  { bg: '#CCFBF1', fg: '#0F766E' },
  { bg: '#FEE2E2', fg: '#B91C1C' },
  { bg: '#F3E8FF', fg: '#7E22CE' },
]

export function UserAvatar({
  avatarUrl,
  name,
  id,
  size = '$4',
  borderWidth,
  borderColor,
  ...stackProps
}: UserAvatarProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size]
  const cleanUrl = avatarUrl?.trim()
  const seed = id?.trim() || name?.trim() || 'User'
  const colors = PALETTE[hashString(seed) % PALETTE.length] ?? PALETTE[0]!
  const initials = getInitials(name)

  return (
    <XStack
      width={pixelSize}
      height={pixelSize}
      borderRadius={999}
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
      backgroundColor={colors.bg as any}
      borderWidth={borderWidth}
      borderColor={borderColor as any}
      flexShrink={0}
      {...stackProps}
    >
      {cleanUrl ? (
        <Image source={{ uri: cleanUrl }} width="100%" height="100%" />
      ) : (
        <Text
          color={colors.fg as any}
          fontWeight="700"
          fontSize={getFontSize(pixelSize)}
          lineHeight={pixelSize}
        >
          {initials}
        </Text>
      )}
    </XStack>
  )
}

function getInitials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  if (parts.length === 0) return 'U'

  if (parts.length === 1) {
    return (parts[0] ?? 'U').slice(0, 2).toUpperCase()
  }

  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return `${first}${last}`.toUpperCase() || 'U'
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function getFontSize(size: number) {
  if (size >= 90) return 34
  if (size >= 56) return 20
  if (size >= 40) return 15
  if (size >= 28) return 11
  return 9
}
