import React, { useState } from 'react'
import { Button, XStack, YStack } from 'tamagui'
import { ContactHeader } from '@my/ui'

import GroupRequestsReceived from './requests/GroupRequestsReceived.native'
import GroupRequestsSent from './requests/GroupRequestsSent.native'

export default function GroupRequestPage() {
  const [filter, setFilter] = useState<'RECEIVED' | 'SENT'>('RECEIVED')

  const [count, setCount] = useState(0)

  return (
    <YStack flex={1} padding="$3" gap="$4" backgroundColor="$background">
      <ContactHeader
        title="Lời mời vào nhóm"
        subtitle={`${count} lời mời`}
        onBackPath="/contacts"
        actionElement={
          <XStack flexShrink={1}>
            <XStack space="$2">
              <Button
                size="$2"
                borderRadius="$4"
                themeInverse={filter === 'RECEIVED'}
                variant={filter === 'RECEIVED' ? undefined : 'outlined'}
                onPress={() => setFilter('RECEIVED')}
              >
                Đã nhận
              </Button>
              <Button
                size="$2"
                borderRadius="$4"
                themeInverse={filter === 'SENT'}
                variant={filter === 'SENT' ? undefined : 'outlined'}
                onPress={() => setFilter('SENT')}
              >
                Đã gửi
              </Button>
            </XStack>
          </XStack>
        }
      />

      {filter === 'RECEIVED' ? (
        <GroupRequestsReceived onCountChange={setCount} />
      ) : (
        <GroupRequestsSent onCountChange={setCount} />
      )}
    </YStack>
  )
}
