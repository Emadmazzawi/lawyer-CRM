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
  const theme = Colors[colorScheme];

  const handleCreate = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a client name');
      return;
    }

    setLoading(true);
    const { data: userData } = await getCurrentUser();
    if (!userData?.user) {
      Alert.alert('Error', 'User not authenticated');
      setLoading(false);
      return;
    }

    console.log('Attempting to create client:', { name, status, email, phone });
    const { data: clientData, error } = await createClient({
      user_id: userData.user.id,
      name,
      status,
      contact_info: { email, phone },
    });

    console.log('Create client response:', { clientData, error });

    setLoading(false);
    if (error) {
      console.error('Client creation error:', error);
      Alert.alert('Creation Failed', error.message);
    } else {
      Alert.alert('Success', 'Client created successfully');
      router.back();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.label}>{t('forms.clientName')}</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft }]}
          placeholder={t('placeholders.clientName')}
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
      </View>

      <Text style={styles.label}>{t('forms.caseStatus')}</Text>
      <View style={styles.statusGrid}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.statusButton,
              status === opt && { backgroundColor: theme.maroon, borderColor: theme.maroon },
            ]}
            onPress={() => setStatus(opt)}
          >
            <Text style={[styles.statusText, status === opt && { color: '#FFF' }]}>
              {t(`statuses.${opt.replace(/\s+/g, '').replace(/^\w/, (c) => c.toLowerCase())}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('forms.contactInfo')}</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft }]}
        placeholder={t('forms.email')}
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft }]}
        placeholder={t('forms.phone')}
        placeholderTextColor="#999"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.maroon }]}
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
    backgroundColor: '#FFF',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FDFDFD',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
