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
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/src/lib/supabase';
import { Session } from '@supabase/supabase-js';

import { useColorScheme } from '@/components/useColorScheme';
import { useNotifications } from '@/src/hooks/useNotifications';
import '@/src/i18n/config';
import { I18nManager, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Force allow RTL
I18nManager.allowRTL(true);

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((theme) => {
      if (theme && theme !== 'system') {
        Appearance.setColorScheme(theme as 'light' | 'dark');
      }
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
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
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider>
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
            <Stack.Screen name="create-client" options={{ title: 'New Client', presentation: 'formSheet' }} />
            <Stack.Screen name="create-event" options={{ title: 'New Entry', presentation: 'formSheet' }} />
            <Stack.Screen name="create-routine" options={{ title: 'New Routine', presentation: 'formSheet' }} />
            <Stack.Screen name="run-routine/[id]" options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'card', animation: 'slide_from_right' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}
