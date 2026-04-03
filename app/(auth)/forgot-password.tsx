import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { resetPassword } from '@/src/api/auth';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', t('auth.emailPlaceholder'));
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', t('auth.resetLinkSent'));
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color={theme.maroon} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.maroon, shadowColor: theme.maroon }]}>
            <FontAwesome name="lock" size={36} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{t('auth.forgotPassword')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('auth.enterEmail')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <FontAwesome name="envelope-o" size={18} color={theme.maroon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={theme.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.maroon, shadowColor: theme.maroon }]} 
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.sendReset')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.back()}>
            <Text style={[styles.linkText, { color: theme.textSecondary }]}>{t('auth.backToLogin')}</Text>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: Spacing.xl,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    backgroundColor: 'transparent',
  },
  iconContainer: {
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
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
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
});
