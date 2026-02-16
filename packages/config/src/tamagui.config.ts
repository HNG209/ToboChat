import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'
import { bodyFont, headingFont } from './fonts'
import { animations } from './animations'

export const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,

    zaloLight: {
      ...defaultConfig.themes.light,
      background: '#e9f3ff', // Nền xanh nhạt
      color: '#000000', // Chữ đen
      borderColor: '#d1e6ff',
      // Các bậc màu cho ListItem/Card
      color1: '#e9f3ff',
      color2: '#f0f7ff',
      color3: '#dbeaff',
      primary: '#bfd3ee',
    },

    zaloDark: {
      ...defaultConfig.themes.dark,
      background: '#0f172a', // Nền tối (Slate 950)
      color: '#ffffff', // Chữ trắng
      borderColor: '#1e293b',
      // Các bậc màu cho ListItem/Card trong chế độ tối
      color1: '#0f172a',
      color2: '#1e293b',
      color3: '#334155',
      primary: '#1d4ed8',
    },
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },

    smallScreen: { maxWidth: 768 },
  },
  animations,
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
})
