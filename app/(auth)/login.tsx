import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { signIn, signInAnonymously } from '@/src/api/auth';
import { useRouter, Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { data, error } = await signIn({ email, password });
    setLoading(true); // Keep loading until redirect
    
    if (error) {
      setLoading(false);
      Alert.alert('Login Failed', error.message);
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <FontAwesome name="balance-scale" size={60} color="#2f95dc" />
          <Text style={styles.title}>Maroon CRM</Text>
          <Text style={styles.subtitle}>Secure Legal Organizer</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.link}>
              <Text style={styles.linkText}>Don't have an account? Register</Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity 
            style={styles.guestButton} 
            onPress={handleGuestLogin}
            disabled={guestLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color="#2f95dc" />
            ) : (
              <Text style={styles.guestButtonText}>Continue as guest</Text>
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
    backgroundColor: '#FFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  input: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  button: {
    backgroundColor: '#2f95dc',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  linkText: {
    color: '#2f95dc',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
    backgroundColor: 'transparent',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  guestButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2f95dc',
  },
  guestButtonText: {
    color: '#2f95dc',
    fontSize: 16,
    fontWeight: '600',
  },
});
