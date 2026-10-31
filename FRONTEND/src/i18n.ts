import { createI18n } from 'vue-i18n'
import vi from './locales/vi'
import en from './locales/en'

// Lấy ngôn ngữ đã lưu hoặc mặc định là 'vi'
const savedLang = (localStorage.getItem('app_lang') as 'vi' | 'en') || 'vi'

export const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'vi',
  messages: {
    vi,
    en,
  },
})
