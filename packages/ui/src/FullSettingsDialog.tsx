import { Dialog, Text, XStack, YStack, ListItem, Button, Switch } from '@my/ui'
import ChangePasswordForm from '@my/ui/src/ChangePassworđForm'
import { X } from '@tamagui/lucide-icons'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'

type SettingsTab = 'general' | 'security' | null

type FullSettingsDialogProps = {
  showFullSettings: boolean
  setShowFullSettings: Dispatch<SetStateAction<boolean>>
  activeTab: SettingsTab
  setActiveTab: Dispatch<SetStateAction<SettingsTab>>
  isTwoFactorAuth: boolean
  handleToggleMFA: (val: boolean) => void

  theme: 'light' | 'dark'
  onThemeChange: (nextTheme: 'light' | 'dark') => void

  language: string
  onToggleLanguage: () => void
}

export const FullSettingsDialog = ({
  showFullSettings,
  setShowFullSettings,
  activeTab,
  setActiveTab,
  isTwoFactorAuth,
  handleToggleMFA,
  theme,
  onThemeChange,
  language,
  onToggleLanguage,
}: FullSettingsDialogProps) => {
  const [showChangePassword, setShowChangePassword] = useState(false)

  const menuTextColor = theme === 'dark' ? 'white' : '$color'
  const activeMenuBackground = theme === 'dark' ? '$primary' : '$blue10'

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
                title={
                  <Text color={activeTab === 'general' ? 'white' : menuTextColor}>
                    Cài đặt chung
                  </Text>
                }
                backgroundColor={activeTab === 'general' ? activeMenuBackground : 'transparent'}
                borderRadius="$3"
                hoverStyle={{
                  backgroundColor: activeTab === 'general' ? activeMenuBackground : '$color2',
                  cursor: 'pointer',
                }}
                onPress={() => setActiveTab('general')}
              />

              <ListItem
                title={
                  <Text color={activeTab === 'security' ? 'white' : menuTextColor}>
                    Tài khoản & bảo mật
                  </Text>
                }
                backgroundColor={activeTab === 'security' ? activeMenuBackground : 'transparent'}
                borderRadius="$3"
                hoverStyle={{
                  backgroundColor: activeTab === 'security' ? activeMenuBackground : '$color2',
                  cursor: 'pointer',
                }}
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

                  <YStack space="$3" mt="$4">
                    <XStack
                      backgroundColor="$backgroundHover"
                      padding="$4"
                      borderRadius="$4"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      space="$4"
                    >
                      <YStack flex={1} space="$1">
                        <Text fontWeight="bold">Giao diện</Text>
                        <Text lineHeight={20} color="$color10">
                          {theme === 'light' ? 'Chế độ sáng' : 'Chế độ tối'}
                        </Text>
                      </YStack>
                      <Switch
                        size="$3"
                        checked={theme === 'dark'}
                        onCheckedChange={(checked) => onThemeChange(checked ? 'dark' : 'light')}
                        backgroundColor={theme === 'dark' ? '$primary' : '$backgroundPress'}
                      >
                        <Switch.Thumb animation="quick" />
                      </Switch>
                    </XStack>

                    <XStack
                      backgroundColor="$backgroundHover"
                      padding="$4"
                      borderRadius="$4"
                      justifyContent="space-between"
                      alignItems="center"
                      space="$4"
                    >
                      <YStack flex={1} space="$1">
                        <Text fontWeight="bold">Ngôn ngữ</Text>
                        <Text lineHeight={20} color="$color10">
                          {language?.includes('vi') ? 'Tiếng Việt' : 'English'}
                        </Text>
                      </YStack>

                      <Button size="$3" onPress={onToggleLanguage}>
                        {language?.includes('vi') ? 'English' : 'Tiếng Việt'}
                      </Button>
                    </XStack>
                  </YStack>
                </>
              )}

              {activeTab === 'security' &&
                (showChangePassword ? (
                  <ChangePasswordForm onBack={() => setShowChangePassword(false)} />
                ) : (
                  <>
                    <YStack space="$3">
                      <Text fontWeight="bold">Bảo mật 2 lớp</Text>
                      <XStack
                        backgroundColor="$backgroundHover"
                        padding="$4"
                        borderRadius="$4"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        space="$4"
                      >
                        <YStack flex={1} space="$1">
                          <Text lineHeight={20}>
                            Sau khi bật, bạn sẽ được yêu cầu nhập mã OTP hoặc xác thực từ thiết bị
                            di động sau khi đăng nhập trên thiết bị lạ.
                          </Text>
                        </YStack>
                        <Switch
                          size="$3"
                          checked={isTwoFactorAuth}
                          onCheckedChange={handleToggleMFA}
                          backgroundColor={isTwoFactorAuth ? '$primary' : '$backgroundPress'}
                        >
                          <Switch.Thumb animation="quick" />
                        </Switch>
                      </XStack>
                      <Button mt="$4" onPress={() => setShowChangePassword(true)}>
                        Đổi mật khẩu
                      </Button>
                    </YStack>
                  </>
                ))}
            </YStack>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
