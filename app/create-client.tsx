import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { createClient, ClientStatus } from '@/src/api/clients';
import { getCurrentUser } from '@/src/api/auth';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';

const STATUS_OPTIONS: ClientStatus[] = ['Consultation', 'Awaiting Docs', 'In Court', 'Closed'];

export default function CreateClientScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [name, setName] = useState('');

  React.useEffect(() => {
    navigation.setOptions({
      title: t('clients.addClient')
    });
  }, [t, navigation]);
  const [status, setStatus] = useState<ClientStatus>('Consultation');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleCreate = async () => {
    if (!name) {
      Alert.alert(t('common.error'), t('forms.clientNameRequired'));
      return;
    }

    setLoading(true);
    const { data: userData } = await getCurrentUser();
    if (!userData?.user) {
      Alert.alert(t('common.error'), t('forms.userNotAuth'));
      setLoading(false);
      return;
    }

    const { error } = await createClient({
      user_id: userData.user.id,
      name,
      status,
      contact_info: { email, phone },
    });

    setLoading(false);
    if (error) {
      Alert.alert(t('forms.creationFailed'), error.message);
    } else {
      Alert.alert(t('common.success'), t('forms.clientCreated'));
      router.back();
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.text }]}>{t('forms.clientName')}</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
          placeholder={t('placeholders.clientName')}
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
        />
      </View>

      <Text style={[styles.label, { color: theme.text }]}>{t('forms.caseStatus')}</Text>
      <View style={styles.statusGrid}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.statusButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              status === opt && { backgroundColor: theme.maroon, borderColor: theme.maroon },
            ]}
            onPress={() => setStatus(opt)}
          >
            <Text style={[styles.statusText, { color: theme.textSecondary }, status === opt && { color: '#FFF' }]}>
              {t(`statuses.${opt.replace(/\s+/g, '').replace(/^\w/, (c) => c.toLowerCase())}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.text, marginTop: Spacing.md }]}>{t('forms.contactInfo')}</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
        placeholder={t('forms.email')}
        placeholderTextColor={theme.textMuted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
        placeholder={t('forms.phone')}
        placeholderTextColor={theme.textMuted}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.maroon, shadowColor: theme.maroon }]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>{t('forms.save')}</Text>
        )}
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
  header: {
    marginBottom: Spacing.lg,
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontFamily: Fonts.medium,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 16,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.xl,
    backgroundColor: 'transparent',
  },
  statusButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  submitButton: {
    padding: 20,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    marginTop: Spacing.lg,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  submitText: {
    fontFamily: Fonts.bold,
    color: '#FFF',
    fontSize: 18,
  },
});
