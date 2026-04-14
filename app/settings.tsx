import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, I18nManager } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/src/i18n';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import * as Updates from 'expo-updates';
import { Appearance } from 'react-native';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';

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
  const [currentTheme, setCurrentTheme] = useState('system');

  const THEMES = [
    { label: t('settings.themes.system'), value: 'system', icon: 'desktop' },
    { label: t('settings.themes.light'), value: 'light', icon: 'sun-o' },
    { label: t('settings.themes.dark'), value: 'dark', icon: 'moon-o' },
  ];

  useEffect(() => {
    navigation.setOptions({
      title: t('settings.title')
    });
    loadThemePreference();
  }, [currentLang, t]);

  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('app_theme');
      if (storedTheme) {
        setCurrentTheme(storedTheme);
      }
    } catch (e) {
      console.error('Failed to load theme preference', e);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert(t('settings.logout_error'), error.message);
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
          t('settings.restart_required'),
          t('settings.restart_msg'),
          [{ text: t('common.ok'), onPress: () => Updates.reloadAsync() }]
        );
      }
    } catch (e) {
      console.error('Failed to change language', e);
    }
  };

  const changeTheme = async (themeValue: string) => {
    try {
      await AsyncStorage.setItem('app_theme', themeValue);
      setCurrentTheme(themeValue);
      if (themeValue === 'system') {
        Appearance.setColorScheme(null as any);
      } else {
        Appearance.setColorScheme(themeValue as 'light' | 'dark');
      }
    } catch (e) {
      console.error('Failed to change theme', e);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.language')}</Text>
        <View style={styles.languageGrid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.value}
              style={[
                styles.optionButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                currentLang === lang.value && { backgroundColor: theme.maroon, borderColor: theme.maroon },
              ]}
              onPress={() => changeLanguage(lang.value)}
            >
              <Text style={styles.optionIconText}>{lang.flag}</Text>
              <Text style={[styles.optionLabel, { color: theme.textSecondary }, currentLang === lang.value && { color: '#FFF' }]}>
                {t(`settings.languages.${lang.value}`)}
              </Text>
              {currentLang === lang.value && (
                <FontAwesome name="check-circle" size={16} color="#FFF" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.appearance')}</Text>
        <View style={styles.optionsGrid}>
          {THEMES.map((t_opt) => (
            <TouchableOpacity
              key={t_opt.value}
              style={[
                styles.optionButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                currentTheme === t_opt.value && { backgroundColor: theme.maroon, borderColor: theme.maroon },
              ]}
              onPress={() => changeTheme(t_opt.value)}
            >
              <FontAwesome name={t_opt.icon as any} size={18} color={currentTheme === t_opt.value ? '#FFF' : theme.textSecondary} style={{ marginEnd: 12, width: 20, textAlign: 'center' }} />
              <Text style={[styles.optionLabel, { color: theme.textSecondary }, currentTheme === t_opt.value && { color: '#FFF' }]}>
                {t_opt.label}
              </Text>
              {currentTheme === t_opt.value && (
                <FontAwesome name="check-circle" size={16} color="#FFF" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

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
  },
  content: {
    padding: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionsGrid: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  languageGrid: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionIconText: {
    fontSize: 20,
    marginEnd: 12,
  },
  optionLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    flex: 1,
  },
  checkIcon: {
    marginStart: 10,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  logoutText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginStart: 12,
  },
});
