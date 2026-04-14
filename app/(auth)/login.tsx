import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { signIn, signInAnonymously } from '@/src/api/auth';
import { useRouter, Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn({ email, password });
    
    if (error) {
      setLoading(false);
      if (error.message.includes('Invalid login credentials')) {
        Alert.alert(t('auth.loginFailed'), t('auth.userNotFound'));
      } else {
        Alert.alert(t('auth.loginFailed'), error.message);
      }
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const { error } = await signInAnonymously();
      if (error) {
        setGuestLoading(false);
        Alert.alert(t('auth.guestLoginFailed'), error.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setGuestLoading(false);
      Alert.alert(t('common.error'), err.message || 'An unexpected error occurred');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => router.push('/settings')}
      >
        <FontAwesome name="cog" size={28} color={theme.maroon} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.maroon, shadowColor: theme.maroon }]}>
            <FontAwesome name="balance-scale" size={44} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{t('auth.appName')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('auth.appSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>{t('auth.welcome')}</Text>
          
          <View style={styles.inputContainer}>
            <FontAwesome name="envelope-o" size={18} color={theme.maroon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
              placeholder={t('auth.email')}
              placeholderTextColor={theme.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome name="lock" size={20} color={theme.maroon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
              placeholder={t('auth.password')}
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.forgotAction} 
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={[styles.forgotText, { color: theme.maroon }]}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.maroon, shadowColor: theme.maroon }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.login')}</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.link}>
              <Text style={[styles.linkText, { color: theme.textSecondary }]}>{t('auth.noAccount')}</Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>{t('auth.or')}</Text>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity 
            style={[styles.guestButton, { borderColor: theme.border, backgroundColor: theme.surface }]} 
            onPress={handleGuestLogin}
            disabled={guestLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <Text style={[styles.guestButtonText, { color: theme.text }]}>{t('auth.loginGuest')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    right: 20,
    zIndex: 9999,
    padding: 15,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontFamily: Fonts.black,
    fontSize: 28,
    marginTop: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    marginTop: 4,
  },
  welcomeText: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  inputIcon: {
    position: 'absolute',
    left: 18,
    top: 18,
    zIndex: 1,
  },
  input: {
    fontFamily: Fonts.medium,
    padding: 16,
    paddingLeft: 50,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    fontSize: 16,
  },
  forgotAction: {
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
    backgroundColor: 'transparent',
  },
  forgotText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  button: {
    padding: 18,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    marginTop: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    fontFamily: Fonts.bold,
    color: '#FFF',
    fontSize: 16,
  },
  link: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  linkText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    backgroundColor: 'transparent',
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: Fonts.semiBold,
    marginHorizontal: Spacing.md,
    fontSize: 13,
  },
  guestButton: {
    padding: 16,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    borderWidth: 1,
  },
  guestButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
});
