import { useEffect, useState } from 'react';
import { Appearance, useColorScheme as useColorSchemeCore } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useColorScheme = (): 'light' | 'dark' => {
  const systemScheme = useColorSchemeCore();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((storedTheme) => {
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTheme(storedTheme);
      } else {
        setTheme('system');
      }
    });

    const subscription = Appearance.addChangeListener(() => {
      AsyncStorage.getItem('app_theme').then(storedTheme => {
        if (storedTheme === 'dark' || storedTheme === 'light') {
          setTheme(storedTheme);
        } else {
          setTheme('system');
        }
      });
    });

    return () => subscription.remove();
  }, []);

  if (theme === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return theme;
};
