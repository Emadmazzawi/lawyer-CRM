import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { signUp } from '@/src/api/auth';
import { useRouter, Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { Platform, KeyboardAvoidingView, ScrollView } from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const handleRegister = async () => {
    if (!email || !password || !fullName) return;
    setLoading(true);
    const { data, error } = await signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    setLoading(false);
    
    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else {
      Alert.alert('Success', t('auth.resetLinkSent').replace('Reset', 'Activation')); // Or a generic success message
      router.replace('/(auth)/login');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => {
          console.log('Navigating to settings...');
          router.push('/settings');
        }}
      >
        <FontAwesome name="cog" size={28} color={theme.maroon} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.maroon, shadowColor: theme.maroon }]}>
            <FontAwesome name="user-plus" size={36} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{t('auth.createAccount')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join Maroon CRM today</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <FontAwesome name="user-o" size={18} color={theme.maroon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
              placeholder={t('forms.clientName')}
              placeholderTextColor={theme.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

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
            style={[styles.button, { backgroundColor: theme.maroon, shadowColor: theme.maroon }]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.register')}</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.link}>
              <Text style={[styles.linkText, { color: theme.textSecondary }]}>{t('auth.hasAccount')}</Text>
            </TouchableOpacity>
          </Link>
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
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
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
