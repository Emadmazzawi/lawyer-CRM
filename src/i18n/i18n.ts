import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';

import en from '../../locales/en.json';
import he from '../../locales/he.json';
import ar from '../../locales/ar.json';

const resources = {
  en: { translation: en },
  he: { translation: he },
  ar: { translation: ar },
};

const locales = getLocales();
const deviceLanguage = locales[0]?.languageCode ?? 'en';

// Supported languages
const supportedLanguages = ['en', 'he', 'ar'];
const initialLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';

const isRTL = initialLanguage === 'he' || initialLanguage === 'ar';

if (I18nManager.isRTL !== isRTL) {
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);
  // Note: On physical devices, a restart might be required for changes to take effect
}

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

export default i18n;
