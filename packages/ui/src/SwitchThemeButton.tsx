'use client'

import { useState, useRef } from 'react'
import { Button, XStack, Text, useTheme, Theme } from 'tamagui'
import { Sun, Moon, Monitor } from '@tamagui/lucide-icons'
import { Animated, Platform } from 'react-native'

const themes = ['light', 'dark'] as const

export const SwitchThemeButton = () => {
  const [themeIndex, setThemeIndex] = useState(0)
  const [showLabel, setShowLabel] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const theme = useTheme()

  let currentTheme = themes[themeIndex]
  let icon, label
  if (currentTheme === 'dark') {
    icon = <Sun size={20} />
    label = 'Sáng'
  } else {
    icon = <Moon size={20} />
    label = 'Tối'
  }

  const handleToggle = () => {
    const nextIndex = (themeIndex + 1) % themes.length
    setThemeIndex(nextIndex)
    setShowLabel(true)
    fadeAnim.setValue(1)
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
      delay: 600,
    }).start(() => setShowLabel(false))
  }

  const Content = (
    <XStack alignItems="center">
      {showLabel && (
        <Animated.View style={{ opacity: fadeAnim, marginRight: 10 }}>
          <Text fontWeight="bold" fontSize={14}>
            {label}
          </Text>
        </Animated.View>
      )}
      <Button onPress={handleToggle} circular size="$3" icon={icon} aria-label="Đổi giao diện" />
    </XStack>
  )

  if (Platform.OS !== 'web') {
    return <Theme name={themes[themeIndex]}>{Content}</Theme>
  }

  return Content
}
