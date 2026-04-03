import React, { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchRoutines, deleteRoutine, Routine } from '@/src/api/routines';

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoutines = async () => {
    setLoading(true);
    const { data, error } = await fetchRoutines();
    if (error) {
      console.error('Error fetching routines:', error);
      Alert.alert(t('common.error', 'Error'), t('routines.fetchError', 'Failed to load routines.'));
    } else {
      setRoutines(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      t('routines.deleteTitle', 'Delete Routine'),
      t('routines.deleteConfirm', 'Are you sure you want to delete this routine?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('common.delete', 'Delete'), 
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteRoutine(id);
            if (error) {
              Alert.alert(t('common.error', 'Error'), t('routines.deleteError', 'Failed to delete routine.'));
            } else {
              loadRoutines();
            }
          }
        }
      ]
    );
  };

  const renderRoutine = ({ item }: { item: Routine }) => (
    <View style={[styles.card, { backgroundColor: theme.background, borderBottomColor: '#EBEBEB' }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
          {item.description ? (
            <Text style={[styles.description, { color: '#888' }]} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <FontAwesome name="trash" size={16} color="#d9534f" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.runButton, { backgroundColor: '#1A1A1A' }]}
        onPress={() => router.push(`/run-routine/${item.id}`)}
      >
        <Text style={styles.runButtonText}>{t('routines.run', 'Run Routine')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.maroon} style={{ marginTop: 50 }} />
      ) : routines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            {t('routines.empty', 'No routines found. Create one to get started!')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => item.id}
          renderItem={renderRoutine}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#111' }]}
        onPress={() => router.push('/create-routine')}
      >
        <FontAwesome name="plus" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: { flex: 1, paddingRight: 10 },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
  description: { fontSize: 14, lineHeight: 20 },
  deleteButton: { padding: 8, backgroundColor: '#F9F9F9', borderRadius: 20 },
  runButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  runButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, textAlign: 'center', color: '#666' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
});
