import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { LocalizationProvider } from '@/src/providers/LocalizationProvider';
import { 
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/src/lib/supabase';
import { Session } from '@supabase/supabase-js';

import { useColorScheme as useSystemColorScheme } from '@/components/useColorScheme';
import { useNotifications } from '@/src/hooks/useNotifications';
import '@/src/i18n';
import { I18nManager, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

// Force allow RTL
I18nManager.allowRTL(true);

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

SplashScreen.preventAutoHideAsync();

const ThemeContext = createContext<{
  colorScheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}>({ colorScheme: 'light', setTheme: () => {} });

export const useAppTheme = () => useContext(ThemeContext);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  const systemColorScheme = useSystemColorScheme();
  const [appTheme, setAppTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((theme) => {
      if (theme) {
        setAppTheme(theme as any);
      }
      setInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (loaded && initialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, initialized]);

  const setTheme = async (theme: 'light' | 'dark' | 'system') => {
    setAppTheme(theme);
    await AsyncStorage.setItem('app_theme', theme);
  };

  if (!loaded || !initialized) {
    return null;
  }

  const activeColorScheme = appTheme === 'system' ? systemColorScheme : (appTheme as 'light' | 'dark');

  return (
    <ThemeContext.Provider value={{ colorScheme: activeColorScheme, setTheme }}>
      <LocalizationProvider>
        <RootLayoutNav colorScheme={activeColorScheme} />
      </LocalizationProvider>
    </ThemeContext.Provider>
  );
}

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // Initialize notifications
  useNotifications(session);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{
          headerStyle: { backgroundColor: colorScheme === 'dark' ? '#0D0D0F' : '#FFF' },
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
          headerTintColor: colorScheme === 'dark' ? '#F0F0F5' : '#111111',
          headerShadowVisible: false,
        }}>
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="create-client" options={{ title: t('clients.addClient'), presentation: 'formSheet' }} />
          <Stack.Screen name="create-event" options={{ title: t('dashboard.addEvent'), presentation: 'formSheet' }} />
          <Stack.Screen name="create-routine" options={{ title: t('routines.title'), presentation: 'formSheet' }} />
          <Stack.Screen name="run-routine/[id]" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: t('settings.title'), presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
