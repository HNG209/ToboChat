import React, { useState } from 'react'
import { Button, XStack, YStack } from 'tamagui'
import { ContactHeader } from '@my/ui'
import { FriendRequestType } from 'app/types/Request'

import FriendRequestsReceived from './requests/FriendRequestsReceived.native'
import FriendRequestsSent from './requests/FriendRequestsSent.native'

export default function RequestPage() {
  const [requestFilter, setRequestFilter] = useState<FriendRequestType>(FriendRequestType.PENDING)

  const [count, setCount] = useState(0)

  return (
    <YStack flex={1} padding="$3" gap="$4" backgroundColor="$background">
      <ContactHeader
        title="Lời mời kết bạn"
        subtitle={`${count} lời mời`}
        onBackPath="/contacts"
        actionElement={
          <XStack flexShrink={1}>
            <XStack space="$2">
              <Button
                size="$2"
                borderRadius="$4"
                themeInverse={requestFilter === FriendRequestType.PENDING}
                variant={requestFilter === FriendRequestType.PENDING ? undefined : 'outlined'}
                onPress={() => setRequestFilter(FriendRequestType.PENDING)}
              >
                Đã nhận
              </Button>
              <Button
                size="$2"
                borderRadius="$4"
                themeInverse={requestFilter === FriendRequestType.SENT}
                variant={requestFilter === FriendRequestType.SENT ? undefined : 'outlined'}
                onPress={() => setRequestFilter(FriendRequestType.SENT)}
              >
                Đã gửi
              </Button>
            </XStack>
          </XStack>
        }
      />

      {requestFilter === FriendRequestType.PENDING ? (
        <FriendRequestsReceived onCountChange={setCount} />
      ) : (
        <FriendRequestsSent onCountChange={setCount} />
      )}
    </YStack>
  )
}
