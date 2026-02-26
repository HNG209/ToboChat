import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import vi from './locales/vi.json'
import en from './locales/en.json'
console.log('EN JSON:', en)
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: 'vi', // Ngôn ngữ mặc định
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
