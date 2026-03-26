import React, { useState, useEffect } from 'react'
import { Button, Image, Text, XStack } from '@my/ui'
import { Input } from '@my/ui'
import { YStack } from '@my/ui'
import { Search, UserPlus, Users } from '@tamagui/lucide-icons'
import { SearchUserCard } from '@my/ui'
import { useLazyFindUserByEmailQuery } from 'app/services/userApi'
import {
  useSendFriendRequestMutation,
  useCancelFriendRequestMutation,
} from 'app/services/contactApi'

export default function SearchHeader() {
  const [searchFocus, setSearchFocus] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())

  const [sendFriendRequest] = useSendFriendRequestMutation()
  const [cancelFriendRequest] = useCancelFriendRequestMutation()
  const [findUser, { data: searchData, isLoading: searchLoading }] = useLazyFindUserByEmailQuery()

  // Gọi API tìm kiếm khi keyword thay đổi
  useEffect(() => {
    if (!keyword.trim()) return
    const timeout = setTimeout(() => findUser({ email: keyword, limit: 10 }), 400)
    return () => clearTimeout(timeout)
  }, [keyword, findUser])

  const hasKeyword = keyword.trim() !== ''
  const hasResults = hasKeyword && !searchLoading && (searchData?.items?.length ?? 0) > 0
  const noResults = hasKeyword && !searchLoading && (searchData?.items?.length ?? 0) === 0

  return (
    <YStack
      padding="$3"
      space="$2"
      paddingTop="$4"
      backgroundColor="$background"
      position="relative"
    >
      <XStack alignItems="center" space="$2" flexWrap="wrap">
        <XStack
          flex={1}
          backgroundColor="$color3"
          borderRadius={6}
          alignItems="center"
          paddingHorizontal="$2"
          height={37}
        >
          <Search size={16} color="$color10" />
          <Input
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            placeholder="Tìm kiếm bạn bè qua email..."
            placeholderTextColor="$color10"
            fontSize={13}
            height="100%"
            color="$color"
            focusStyle={{ outlineWidth: 0 }}
            value={keyword}
            onChangeText={setKeyword}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
          />
        </XStack>
        <XStack space="$1">
          <Button
            size="$2"
            circular
            backgroundColor="transparent"
            icon={<UserPlus size={18} color="$color" />}
            hoverStyle={{ backgroundColor: '$color4' }}
          />
          <Button
            size="$2"
            circular
            backgroundColor="transparent"
            icon={<Users size={18} color="$color" />}
            hoverStyle={{ backgroundColor: '$color4' }}
          />
        </XStack>
      </XStack>

      {/* Overlay kết quả tìm kiếm */}
      {(searchFocus || hasKeyword) && (
        <YStack
          position="absolute"
          top="100%"
          left={0}
          right={0}
          backgroundColor="$background"
          borderColor="$borderColor"
          zIndex={999}
          padding="$4"
          elevation="$4"
          overflow="hidden"
          height="100vh"
        >
          <Text fontWeight="600" marginBottom="$3" fontSize="$4">
            Tìm bạn qua email:
          </Text>

          {!hasKeyword && searchFocus && (
            <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
              <Text color="$gray10" textAlign="center" fontSize="$4">
                Nhập email hoặc tên để bắt đầu tìm kiếm
              </Text>
            </YStack>
          )}

          {hasKeyword && searchLoading && (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <Text color="$gray10">Đang tìm kiếm...</Text>
            </YStack>
          )}

          {hasResults && (
            <YStack gap="$2">
              {searchData?.items?.map((user) => (
                <SearchUserCard
                  key={user.id}
                  user={user}
                  requestSent={sentRequests.has(user.id)}
                  onAddFriend={async (userId) => {
                    setSentRequests((prev) => new Set([...prev, userId]))
                    try {
                      await sendFriendRequest({ otherId: userId }).unwrap()
                    } catch (err) {
                      setSentRequests((prev) => {
                        const copy = new Set(prev)
                        copy.delete(userId)
                        return copy
                      })
                    }
                  }}
                  onCancelRequest={async (userId) => {
                    setSentRequests((prev) => {
                      const copy = new Set(prev)
                      copy.delete(userId)
                      return copy
                    })
                    try {
                      await cancelFriendRequest({ otherId: userId }).unwrap()
                    } catch (err) {
                      setSentRequests((prev) => new Set([...prev, userId]))
                    }
                  }}
                />
              ))}
            </YStack>
          )}

          {noResults && (
            <YStack
              alignItems="center"
              paddingTop="$0"
              paddingHorizontal="$4"
              paddingBottom="$6"
              gap="$0"
            >
              <Image
                source={{ uri: '/not-found.png' }}
                width={240}
                height={240}
                opacity={0.9}
                resizeMode="contain"
                alt="Không tìm thấy kết quả"
              />
              <YStack alignItems="center" space="$2">
                <Text fontSize="$7" fontWeight="700" color="$gray12">
                  Không tìm thấy kết quả
                </Text>
                <Text
                  fontSize="$4"
                  color="$gray10"
                  textAlign="center"
                  maxWidth={320}
                  lineHeight="$5"
                >
                  Vui lòng thử tìm kiếm với email khác hoặc kiểm tra lại chính tả. Hệ thống không
                  tìm thấy người dùng nào phù hợp với từ khóa của bạn.
                </Text>
              </YStack>
            </YStack>
          )}
        </YStack>
      )}
    </YStack>
  )
}
