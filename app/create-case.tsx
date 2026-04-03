import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createCase, CaseStatus } from '@/src/api/cases';
import { getClients, Client } from '@/src/api/clients';
import { getCurrentUser } from '@/src/api/auth';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';

export default function CreateCaseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { t } = useTranslation();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CaseStatus>('Open');
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || '');
  const [clients, setClients] = useState<Partial<Client>[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setClientsLoading(true);
    const { data } = await getClients(0, 100);
    if (data) {
        setClients(data);
        if (!selectedClientId && data.length > 0 && data[0].id) {
            setSelectedClientId(data[0].id);
        }
    }
    setClientsLoading(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a case title');
      return;
    }

    if (!selectedClientId) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    setLoading(true);

    const { data: userData } = await getCurrentUser();
    if (!userData?.user) {
      Alert.alert('Error', 'User not authenticated');
      setLoading(false);
      return;
    }

    const { error } = await createCase({
      user_id: userData.user.id,
      client_id: selectedClientId,
      title: title.trim(),
      description: description.trim() || null,
      status: status,
    });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      Alert.alert('Success', 'Case created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>New Matter / Case</Text>
            <Text style={styles.subtitle}>Open a new legal matter for a client.</Text>
        </View>

        <View style={styles.form}>
            {/* Client Selection */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>CLIENT</Text>
                {clientsLoading ? (
                    <ActivityIndicator style={{ alignSelf: 'flex-start' }} />
                ) : (
                    <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}>
                        <Picker
                            selectedValue={selectedClientId}
                            onValueChange={(itemValue: string) => setSelectedClientId(itemValue)}
                            style={{ color: theme.text }}
                            dropdownIconColor={theme.textMuted}
                        >
                            {clients.map(client => (
                                <Picker.Item key={client.id} label={client.name} value={client.id} />
                            ))}
                        </Picker>
                    </View>
                )}
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>CASE TITLE</Text>
                <TextInput
                    style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surfaceElevated, color: theme.text }]}
                    placeholder="e.g. Smith v. Jones"
                    placeholderTextColor={theme.textMuted}
                    value={title}
                    onChangeText={setTitle}
                />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPTION</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { borderColor: theme.border, backgroundColor: theme.surfaceElevated, color: theme.text }]}
                    placeholder="Brief details about the matter..."
                    placeholderTextColor={theme.textMuted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>

            {/* Status */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>STATUS</Text>
                <View style={styles.statusContainer}>
                    {(['Open', 'Pending', 'Closed'] as CaseStatus[]).map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={[
                                styles.statusChip,
                                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                                status === s && { backgroundColor: theme.maroon, borderColor: theme.maroon }
                            ]}
                            onPress={() => setStatus(s)}
                        >
                            <Text style={[
                                styles.statusChipText,
                                { color: theme.textSecondary },
                                status === s && { color: '#FFF' }
                            ]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

        </View>

        <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.maroon }]} 
            onPress={handleCreate}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <Text style={styles.submitButtonText}>Create Case</Text>
            )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  form: {
    backgroundColor: 'transparent',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
  },
  statusChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  submitButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
