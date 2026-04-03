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
    <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.maroonSoft }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <FontAwesome name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
      {item.description ? (
        <Text style={[styles.description, { color: theme.text }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      
      <TouchableOpacity 
        style={[styles.runButton, { backgroundColor: theme.maroon }]}
        onPress={() => router.push(`/run-routine/${item.id}`)}
      >
        <FontAwesome name="play" size={16} color="#FFF" style={{ marginRight: 8 }} />
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
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.maroon }]}
        onPress={() => router.push('/create-routine')}
      >
        <FontAwesome name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  description: { fontSize: 14, marginBottom: 16, opacity: 0.8 },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  runButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
