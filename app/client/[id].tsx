import { StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { getClientById, Client } from '@/src/api/clients';
import { getNotesByClientId, createNote, Note } from '@/src/api/notes';
import { getCasesByClientId, Case } from '@/src/api/cases';
import { getCurrentUser } from '@/src/api/auth';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  
  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    if (id) {
        loadData();
    }
  }, [id]);

  useEffect(() => {
    if (client) {
      navigation.setOptions({
        title: client.name
      });
    }
  }, [client, navigation]);

  const loadData = async () => {
    setLoading(true);
    const { data: clientData } = await getClientById(id as string);
    if (clientData) setClient(clientData);

    const { data: casesData } = await getCasesByClientId(id as string);
    if (casesData) setCases(casesData as Case[]);

    const { data: notesData } = await getNotesByClientId(id as string);
    if (notesData) setNotes(notesData as Note[]);
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote) return;
    setNoteLoading(true);
    
    const { data: userData } = await getCurrentUser();
    if (!userData?.user) {
      Alert.alert('Error', 'User not authenticated');
      setNoteLoading(false);
      return;
    }

    const { data, error } = await createNote({
        user_id: userData.user.id,
        client_id: id as string,
        content: newNote
    });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else if (data) {
        setNotes([data as Note, ...notes]);
        setNewNote('');
        Alert.alert('Success', 'Note added successfully');
    }
    setNoteLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.maroon} />
        <Text style={[styles.loadingText, { color: theme.text }]}>{t('clientDetails.loading')}</Text>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Client not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(600)} style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: theme.maroon + '15' }]}>
                <Text style={[styles.statusText, { color: theme.maroon }]}>
                    {t(`statuses.${client.status.replace(/\s+/g, '').replace(/^\w/, (c) => c.toLowerCase())}`)}
                </Text>
            </View>
        </View>
        
        <Text style={[styles.name, { color: theme.text }]}>{client.name}</Text>
        
        <View style={styles.contactSection}>
          <Text style={styles.sectionLabel}>{t('clientDetails.contact')}</Text>
          <View style={styles.contactItem}>
            <FontAwesome name="envelope-o" size={14} color="#666" style={styles.contactIcon} />
            <Text style={styles.contactValue}>{client.contact_info?.email || 'N/A'}</Text>
          </View>
          <View style={styles.contactItem}>
            <FontAwesome name="phone" size={14} color="#666" style={styles.contactIcon} />
            <Text style={styles.contactValue}>{client.contact_info?.phone || 'N/A'}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(200)} style={styles.casesSection}>
        <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.subHeader, { color: theme.text }]}>Cases / Matters</Text>
            <TouchableOpacity 
                style={[styles.addCaseBtn, { backgroundColor: theme.maroon + '20' }]} 
                onPress={() => router.push({ pathname: '/create-case' as any, params: { clientId: id } })}
            >
                <FontAwesome name="plus" size={12} color={theme.maroon} />
                <Text style={[styles.addCaseBtnText, { color: theme.maroon }]}>New</Text>
            </TouchableOpacity>
        </View>
        
        {cases.length === 0 ? (
          <View style={styles.emptyNotes}>
            <FontAwesome name="briefcase" size={40} color="#EEE" />
            <Text style={styles.emptyNotesText}>No cases opened</Text>
          </View>
        ) : (
          cases.map((item, index) => (
            <Animated.View 
              key={item.id}
              entering={FadeInDown.delay(300 + index * 100)}
              style={[styles.caseItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            >
              <View style={styles.caseHeader}>
                  <Text style={styles.caseTitle}>{item.title}</Text>
                  <View style={[styles.caseStatusBadge, { backgroundColor: item.status === 'Open' ? '#E8F5E9' : item.status === 'Closed' ? '#FFEBEE' : '#FFF3E0' }]}>
                      <Text style={[styles.caseStatusText, { color: item.status === 'Open' ? '#2E7D32' : item.status === 'Closed' ? '#C62828' : '#EF6C00' }]}>{item.status}</Text>
                  </View>
              </View>
              {item.description ? <Text style={styles.caseDescription} numberOfLines={2}>{item.description}</Text> : null}
              <Text style={styles.date}>Opened: {new Date(item.created_at).toLocaleDateString()}</Text>
            </Animated.View>
          ))
        )}
      </Animated.View>

      <Animated.View entering={FadeIn.delay(300)} style={styles.notesSection}>
        <Text style={[styles.subHeader, { color: theme.text }]}>{t('clientDetails.notes')}</Text>
        
        <View style={[styles.addNoteContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <TextInput 
            style={[styles.input, { color: theme.text }]}
            value={newNote}
            onChangeText={setNewNote}
            placeholder={t('clientDetails.addNote')}
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.maroon }]} 
            onPress={handleAddNote}
            disabled={noteLoading}
          >
            {noteLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.addButtonText}>{t('clientDetails.add')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {notes.length === 0 ? (
          <View style={styles.emptyNotes}>
            <FontAwesome name="sticky-note-o" size={40} color="#EEE" />
            <Text style={styles.emptyNotesText}>{t('clientDetails.noNotes')}</Text>
          </View>
        ) : (
          notes.map((item, index) => (
            <Animated.View 
              key={item.id}
              entering={FadeInDown.delay(400 + index * 100)}
              style={[styles.noteItem, { backgroundColor: theme.surfaceElevated, borderLeftColor: theme.maroon, borderColor: theme.border }]}
            >
              <Text style={[styles.noteContent, { color: theme.text }]}>{item.content}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </Animated.View>
          ))
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  headerCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 30,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
  },
  contactSection: {
    backgroundColor: 'transparent',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  contactIcon: {
    width: 20,
    marginEnd: 10,
  },
  contactValue: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
  notesSection: {
    backgroundColor: 'transparent',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  casesSection: {
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  addCaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  addCaseBtnText: {
    fontWeight: '700',
    fontSize: 12,
  },
  caseItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  caseStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  caseStatusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  caseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  addNoteContainer: {
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  noteItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  noteContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  date: {
    fontSize: 11,
    color: '#AAA',
    marginTop: 10,
    fontWeight: '600',
  },
  emptyNotes: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'transparent',
  },
  emptyNotesText: {
    marginTop: 12,
    color: '#AAA',
    fontSize: 14,
  }
});
