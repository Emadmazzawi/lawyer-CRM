import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, I18nManager } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/src/i18n/config';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import * as Updates from 'expo-updates';

const LANGUAGES = [
  { label: 'English', value: 'en', flag: '🇬🇧' },
  { label: 'العربية', value: 'ar', flag: '🇸🇦' },
  { label: 'Hebrew', value: 'he', flag: '🇮🇱' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    navigation.setOptions({
      title: t('settings.title')
    });
  }, [currentLang, t]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Logout Error', error.message);
    } else {
      router.replace('/login');
    }
  };

  const changeLanguage = async (lng: string) => {
    try {
      await i18n.changeLanguage(lng);
      await AsyncStorage.setItem('app_language', lng);
      setCurrentLang(lng);

      const isRTL = lng === 'ar' || lng === 'he';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
        // On some platforms, a reload is required for RTL to take effect fully
        Alert.alert(
          'Restart Required',
          'The application needs to restart to apply the new layout direction.',
          [{ text: 'OK', onPress: () => Updates.reloadAsync() }]
        );
      }
    } catch (e) {
      console.error('Failed to change language', e);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.language')}</Text>
        <View style={styles.languageGrid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.value}
              style={[
                styles.languageButton,
                currentLang === lang.value && { backgroundColor: theme.maroon, borderColor: theme.maroon },
              ]}
              onPress={() => changeLanguage(lang.value)}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[styles.languageLabel, currentLang === lang.value && { color: '#FFF' }]}>
                {lang.label}
              </Text>
              {currentLang === lang.value && (
                <FontAwesome name="check-circle" size={16} color="#FFF" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity 
        style={[styles.logoutButton, { borderColor: theme.maroon }]}
        onPress={handleLogout}
      >
        <FontAwesome name="sign-out" size={20} color={theme.maroon} />
        <Text style={[styles.logoutText, { color: theme.maroon }]}>{t('settings.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  languageGrid: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
  },
  flag: {
    fontSize: 20,
    marginEnd: 12,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    flex: 1,
  },
  checkIcon: {
    marginStart: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    marginStart: 12,
  },
});
