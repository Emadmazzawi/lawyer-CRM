import { StyleSheet, FlatList, TouchableOpacity, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useState, useCallback } from 'react';
import { getCompletedEventsTasks, EventTask } from '@/src/api/events_and_tasks';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/EmptyState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Skeleton } from '@/components/Skeleton';
import { format } from 'date-fns';

export default function CompletedScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Partial<EventTask>[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  useFocusEffect(
    useCallback(() => {
      loadCompleted();
    }, [])
  );

  const loadCompleted = async () => {
    setLoading(true);
    const { data } = await getCompletedEventsTasks();
    if (data) {
      setItems(data);
    }
    setLoading(false);
  };

  const renderItem = useCallback(({ item }: { item: Partial<EventTask> }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <FontAwesome name="check-circle" size={18} color="#4CAF50" style={{ marginEnd: 10 }} />
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <Text style={styles.typeLabel}>{item.type ? t(`categories.${item.type}`) : ''}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {t('clientDetails.completedOn')} {item.due_date ? format(new Date(item.due_date), 'MMM d, yyyy') : 'No date'}
        </Text>
      </View>
    </View>
  ), []);

  const LoadingSkeleton = () => (
    <View style={{ padding: 20 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.card}>
          <Skeleton width="60%" height={20} style={{ marginBottom: 15 }} />
          <Skeleton width="40%" height={14} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tabs.history')}</Text>
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState 
            icon="archive" 
            title={t('history.title')} 
            message={t('history.noHistoryMessage')}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FAFAFA',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    textDecorationLine: 'line-through',
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardFooter: {
    backgroundColor: 'transparent',
  },
  dateText: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '500',
  },
});
