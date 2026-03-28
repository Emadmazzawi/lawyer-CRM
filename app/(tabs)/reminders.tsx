import { StyleSheet, FlatList, TouchableOpacity, View as RNView, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useEffect, useState, useCallback } from 'react';
import { getEventsTasks, EventTask } from '@/src/api/events_and_tasks';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { EmptyState } from '@/components/EmptyState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Skeleton } from '@/components/Skeleton';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function RemindersScreen() {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState<Partial<EventTask>[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const loadReminders = async () => {
    setLoading(true);
    const { data } = await getEventsTasks();
    if (data) {
      setReminders(data.filter(i => i.type === 'reminder'));
    }
    setLoading(false);
  };

  const renderItem = useCallback(({ item }: { item: Partial<EventTask> }) => (
    <View style={styles.card}>
      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority || undefined) }]}>
        <Text style={styles.priorityText}>{item.priority ? t(`priorities.${item.priority.toLowerCase()}`) : t('priorities.medium')}</Text>
      </View>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <FontAwesome name="bell-o" size={16} color={theme.maroon} />
      </View>
      <View style={styles.cardFooter}>
        <FontAwesome name="calendar-o" size={12} color="#888" />
        <Text style={styles.dateText}>
          {item.due_date ? format(new Date(item.due_date), 'MMM d, yyyy') : 'No date'}
        </Text>
      </View>
    </View>
  ), [theme]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Urgent': return '#FFEBEE';
      case 'High': return '#FFF3E0';
      case 'Medium': return '#E3F2FD';
      default: return '#F5F5F5';
    }
  };

  const LoadingSkeleton = () => (
    <View style={{ padding: 20 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.card}>
          <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={24} style={{ marginBottom: 12 }} />
          <Skeleton width="30%" height={14} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('reminders.title')}</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.maroon }]}
          onPress={() => router.push('/create-event?type=reminder')}
        >
          <FontAwesome name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : reminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState 
            icon="bell-slash-o" 
            title={t('reminders.noReminders')} 
            message={t('reminders.noRemindersMessage')}
            onPress={() => router.push('/create-event?type=reminder')}
            actionLabel={t('dashboard.addEvent')}
          />
        </View>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          onRefresh={loadReminders}
          refreshing={loading}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    borderRadius: 24,
    backgroundColor: '#FFF',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
    textTransform: 'uppercase',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginEnd: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    marginStart: 8,
    fontWeight: '500',
  },
});
