import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './resources'

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('voluncore:language') || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (language) => {
  localStorage.setItem('voluncore:language', language)
})

export default i18n
