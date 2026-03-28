import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { resetPassword } from '@/src/api/auth';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

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
          <View style={styles.iconContainer}>
            <FontAwesome name="lock" size={40} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{t('auth.forgotPassword')}</Text>
          <Text style={[styles.subtitle, { color: theme.text + '99' }]}>{t('auth.enterEmail')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <FontAwesome name="envelope-o" size={18} color={theme.maroon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.maroon }]} 
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
            <Text style={[styles.linkText, { color: theme.maroon }]}>{t('auth.backToLogin')}</Text>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  input: {
    padding: 16,
    paddingLeft: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
});
