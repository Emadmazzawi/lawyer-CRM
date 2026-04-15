import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, View, StyledInput, PrimaryButton } from '@/components/Themed';
import { useRouter, useNavigation } from 'expo-router';
import { createClient, ClientStatus } from '@/src/api/clients';
import { getCurrentUser } from '@/src/api/auth';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Spacing, BorderRadius, Fonts } from '@/constants/Theme';

const STATUS_OPTIONS: ClientStatus[] = ['Consultation', 'Awaiting Docs', 'In Court', 'Closed'];

export default function CreateClientScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [name, setName] = useState('');
  const [status, setStatus] = useState<ClientStatus>('Consultation');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    navigation.setOptions({
      title: t('clients.addClient')
    });
  }, [t, navigation]);

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
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StyledInput
        label={t('forms.clientName')}
        placeholder={t('placeholders.clientName')}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('forms.caseStatus')}</Text>
        <View style={styles.statusGrid}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.statusButton,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
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
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('forms.contactInfo')}</Text>
        <StyledInput
          placeholder={t('forms.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <StyledInput
          placeholder={t('forms.phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <PrimaryButton
        title={t('forms.save')}
        onPress={handleCreate}
        loading={loading}
        style={{ marginTop: Spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  section: {
    marginTop: Spacing.md,
    backgroundColor: 'transparent',
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.lg,
    backgroundColor: 'transparent',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
});
