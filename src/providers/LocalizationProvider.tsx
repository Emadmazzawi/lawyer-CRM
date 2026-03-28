import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n/config';

const LANGUAGE_KEY = 'app_language';

type LocalizationContextType = {
  locale: string;
  setLocale: (languageCode: string) => Promise<void>;
  isRTL: boolean;
};

const LocalizationContext = createContext<LocalizationContextType>({
  locale: 'en',
  setLocale: async () => {},
  isRTL: false,
});

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<string>(i18n.language || 'en');
  const [isRTL, setIsRTL] = useState<boolean>(I18nManager.isRTL);

  useEffect(() => {
    const handleLanguageChange = () => {
      setLocaleState(i18n.language);
      setIsRTL(I18nManager.isRTL);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const setLocale = async (languageCode: string) => {
    if (languageCode === locale) return;

    const isNextRTL = languageCode === 'he' || languageCode === 'ar';
    
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    setLocaleState(languageCode);

    if (I18nManager.isRTL !== isNextRTL) {
      I18nManager.forceRTL(isNextRTL);
      await Updates.reloadAsync();
    }
  };

  return (
    <LocalizationContext.Provider value={{ locale, setLocale, isRTL }}>
      {children}
    </LocalizationContext.Provider>
  );
};
