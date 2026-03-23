import { Dialog, Text, XStack, YStack, ListItem, Button, Switch } from '@my/ui'
import React from 'react'
import {
  Contact2,
  Languages,
  LogOut,
  MessageSquare,
  Settings,
  Sun,
  User,
  X,
} from '@tamagui/lucide-icons'
export const FullSettingsDialog = ({
  showFullSettings,
  setShowFullSettings,
  activeTab,
  setActiveTab,
  isTwoFactorAuth,
  handleToggleMFA,
}) => {
  return (
    <Dialog modal open={showFullSettings} onOpenChange={setShowFullSettings}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          backgroundColor="#000"
          zIndex={100000} // Ép số thật lớn để chặn mọi cú click
        />

        <Dialog.Content
          key="content"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          bordered
          elevate
          animation="quick"
          width={800}
          height={600}
          padding={0}
          overflow="hidden"
          backgroundColor="$background"
          $sm={{
            width: '80%',
            height: '70%',
            borderRadius: 0,
          }}
        >
          <XStack height="100%">
            {/* ===== LEFT MENU ===== */}
            <YStack
              width={250}
              flexShrink={0}
              backgroundColor="$background"
              padding="$4"
              borderRightWidth={1}
              borderColor="$borderColor"
              $sm={{
                width: '100%',
                height: '100%',
                display: activeTab ? 'none' : 'flex',
              }}
            >
              <Text fontSize={18} fontWeight="bold" mb="$4">
                Cài đặt
              </Text>

              <ListItem
                title="Cài đặt chung"
                theme='white'
                hoverStyle={{ backgroundColor: '$color2', cursor: 'pointer' }}
                onPress={() => setActiveTab('general')}
              />

              <ListItem
                title="Tài khoản & bảo mật"
                theme='white'
                hoverStyle={{ backgroundColor: '$color2', cursor: 'pointer' }}
                onPress={() => setActiveTab('security')}
              />
            </YStack>
            <Dialog.Close asChild>
              <Button
                position="absolute"
                top="$3"
                right="$3"
                zIndex={1000} // Đảm bảo nằm trên các thành phần khác
                size="$3"
                circular
                icon={X} // Icon X từ lucide-icons bạn đã import
                backgroundColor="transparent"
                hoverStyle={{ backgroundColor: '$backgroundHover' }}
                pressStyle={{ opacity: 0.5 }}
                borderWidth={0}
              />
            </Dialog.Close>

            {/* ===== RIGHT CONTENT ===== */}
            <YStack
              flex={1}
              padding="$5"
              $sm={{
                display: activeTab ? 'flex' : 'none',
                width: '100%',
              }}
            >
              {/* MOBILE BACK BUTTON */}
              <XStack display="none" alignItems="center" mb="$4" $sm={{ display: 'flex' }}>
                <Button size="$2" onPress={() => setActiveTab(null)}>
                  ← Quay lại
                </Button>
              </XStack>

              {activeTab === 'general' && (
                <>
                  <Text fontSize={18} fontWeight="bold">
                    Cài đặt chung
                  </Text>
                </>
              )}

              {activeTab === 'security' && (
                <>
                  {/* Section: Bảo mật 2 lớp (Phần bạn yêu cầu) */}
                  <YStack space="$3">
                    <Text fontWeight="bold">Bảo mật 2 lớp</Text>

                    <XStack
                      backgroundColor="$backgroundHover"
                      padding="$4"
                      borderRadius="$4"
                      jc="space-between"
                      ai="flex-start" // Để text dài không bị lệch nút
                      space="$4"
                    >
                      <YStack flex={1} space="$1">
                        <Text lineHeight={20}>
                          Sau khi bật, bạn sẽ được yêu cầu nhập mã OTP hoặc xác thực từ thiết bị di
                          động sau khi đăng nhập trên thiết bị lạ.
                        </Text>
                      </YStack>

                      {/* Nút Switch xanh chuẩn Zalo */}
                      <Switch
                        size="$3"
                        checked={isTwoFactorAuth}
                        onCheckedChange={handleToggleMFA}
                        backgroundColor={isTwoFactorAuth ? '#0068ff' : '$backgroundPress'}
                      >
                        <Switch.Thumb animation="quick" />
                      </Switch>
                    </XStack>
                  </YStack>
                </>
              )}
            </YStack>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
