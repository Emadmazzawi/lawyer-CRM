import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { signIn, signInAnonymously } from '@/src/api/auth';
import { useRouter, Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

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
        Alert.alert('Login Failed', t('auth.userNotFound'));
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleGuestLogin = async () => {
    console.log('Guest button pressed');
    setGuestLoading(true);
    try {
      const { error, data } = await signInAnonymously();
      console.log('SignInAnonymously result:', { error, data });
      if (error) {
        setGuestLoading(false);
        Alert.alert('Guest Login Failed', error.message);
      } else {
        console.log('Guest login successful, redirecting...');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('HandleGuestLogin fatal error:', err);
      setGuestLoading(false);
      Alert.alert('Error', err.message || 'An unexpected error occurred');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => router.push('/settings')}
        >
          <FontAwesome name="cog" size={24} color={theme.maroon} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome name="balance-scale" size={50} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Maroon CRM</Text>
          <Text style={[styles.subtitle, { color: theme.text + '99' }]}>Secure Legal Organizer</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>{t('auth.welcome')}</Text>
          
          <View style={styles.inputContainer}>
            <FontAwesome name="envelope-o" size={18} color={theme.maroon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
              placeholder={t('auth.email')}
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome name="lock" size={20} color={theme.maroon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
              placeholder={t('auth.password')}
              placeholderTextColor="#999"
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
            style={[styles.button, { backgroundColor: theme.maroon }]} 
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
              <Text style={[styles.linkText, { color: theme.maroon }]}>{t('auth.noAccount')}</Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.maroonSoft }]} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={[styles.line, { backgroundColor: theme.maroonSoft }]} />
          </View>

          <TouchableOpacity 
            style={[styles.guestButton, { borderColor: theme.maroon }]} 
            onPress={handleGuestLogin}
            disabled={guestLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color={theme.maroon} />
            ) : (
              <Text style={[styles.guestButtonText, { color: theme.maroon }]}>{t('auth.loginGuest')}</Text>
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
    padding: 24,
    justifyContent: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 1,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  input: {
    padding: 14,
    paddingLeft: 46,
    borderRadius: 16,
    borderWidth: 1.5,
    fontSize: 16,
  },
  forgotAction: {
    alignItems: 'flex-end',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    backgroundColor: 'transparent',
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 13,
    fontWeight: '700',
  },
  guestButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
