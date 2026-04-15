import { StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View, StyledInput, PrimaryButton } from '@/components/Themed';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createCase, CaseStatus } from '@/src/api/cases';
import { getClients, Client } from '@/src/api/clients';
import { getCurrentUser } from '@/src/api/auth';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { Spacing, BorderRadius, Fonts } from '@/constants/Theme';

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
      Alert.alert(t('common.error'), t('forms.caseTitleRequired', 'Please enter a case title'));
      return;
    }

    if (!selectedClientId) {
      Alert.alert(t('common.error'), t('forms.clientRequired', 'Please select a client'));
      return;
    }

    setLoading(true);

    const { data: userData } = await getCurrentUser();
    if (!userData?.user) {
      Alert.alert(t('common.error'), t('forms.userNotAuth'));
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

    setLoading(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
    } else {
      Alert.alert(t('common.success'), t('forms.caseCreated', 'Case created successfully'), [
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>New Matter / Case</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Open a new legal matter for a client.</Text>
        </View>

        <View style={styles.form}>
            {/* Client Selection */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>CLIENT</Text>
                {clientsLoading ? (
                    <ActivityIndicator style={{ alignSelf: 'flex-start' }} color={theme.maroon} />
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

            <StyledInput
                label="CASE TITLE"
                placeholder="e.g. Smith v. Jones"
                value={title}
                onChangeText={setTitle}
            />

            <StyledInput
                label="DESCRIPTION"
                placeholder="Brief details about the matter..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: 'top', paddingTop: 16 }}
            />

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

        <PrimaryButton
            title="Create Case"
            onPress={handleCreate}
            loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.black,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  form: {
    backgroundColor: 'transparent',
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
  },
  statusChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
});
