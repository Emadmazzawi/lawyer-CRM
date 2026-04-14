import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../../locales/en.json';
import he from '../../locales/he.json';
import ar from '../../locales/ar.json';

const resources = {
  en: { translation: en },
  he: { translation: he },
  ar: { translation: ar },
};

const LANGUAGE_KEY = 'app_language';

const locales = getLocales();
const deviceLanguage = locales[0]?.languageCode ?? 'en';

// Supported languages
const supportedLanguages = ['en', 'he', 'ar'];
const initialLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Load saved language and apply RTL if we are in a browser/app environment
if (typeof window !== 'undefined') {
  AsyncStorage.getItem(LANGUAGE_KEY).then((savedLanguage) => {
    const langToUse = savedLanguage || initialLanguage;
    if (langToUse !== i18n.language) {
      i18n.changeLanguage(langToUse);
    }
    const isRTL = langToUse === 'ar' || langToUse === 'he';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      // Note: On physical devices, a restart might be required for changes to take effect
    }
  }).catch(err => {
    console.error('Error loading saved language:', err);
  });
}

export default i18n;
