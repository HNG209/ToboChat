import React from 'react'
import { Button, Text, XStack, YStack } from '@my/ui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

interface ContactHeaderProps {
  title: string
  subtitle: string
  actionElement?: React.ReactNode
  onBackPath?: string
}

export const ContactHeader = ({
  title,
  subtitle,
  actionElement,
  onBackPath = '/contact',
}: ContactHeaderProps) => {
  const router = useRouter()

  return (
    <YStack
      padding="$3"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$6"
      backgroundColor="$background"
      gap="$2"
    >
      <XStack alignItems="center" gap="$2">
        <Button
          icon={<ChevronLeft size={22} />}
          height={36}
          width={36}
          padding={0}
          chromeless
          onPress={() => router.push(onBackPath)}
        />

        <Text flex={1} fontSize="$4" fontWeight="700" numberOfLines={1}>
          {title}
        </Text>

        {actionElement ? (
          <XStack flexShrink={1} maxWidth="45%" alignItems="center">
            {actionElement}
          </XStack>
        ) : null}
      </XStack>

      <Text color="$color10" fontSize="$2" numberOfLines={1}>
        {subtitle}
      </Text>
    </YStack>
  )
}
