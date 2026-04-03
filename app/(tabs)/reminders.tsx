import { StyleSheet, FlatList, TouchableOpacity, View as RNView, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useEffect, useState, useCallback } from 'react';
import { getEventsTasks, EventTask } from '@/src/api/events_and_tasks';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { EmptyState } from '@/components/EmptyState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { Skeleton } from '@/components/Skeleton';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'react-native';

export default function RemindersScreen() {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState<Partial<EventTask>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Urgent': return theme.danger;
      case 'High': return theme.warning;
      case 'Medium': return theme.success;
      default: return theme.border;
    }
  };

  const renderItem = useCallback(({ item }: { item: Partial<EventTask> }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderLeftWidth: 4, borderLeftColor: getPriorityColor(item.priority || undefined) }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
        <FontAwesome name="bell-o" size={16} color={theme.maroon} />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.dateGroup}>
          <FontAwesome name="calendar-o" size={12} color={theme.textSecondary} />
          <Text style={[styles.dateText, { color: theme.textMuted }]}>
            {item.due_date ? format(new Date(item.due_date), 'MMM d, yyyy') : 'No date'}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority || undefined) }]}>{item.priority ? t(`priorities.${item.priority.toLowerCase()}`) : t('priorities.medium')}</Text>
        </View>
      </View>
    </View>
  ), [theme, t]);

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

  const filteredReminders = reminders.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('reminders.title')}</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.maroon, shadowColor: theme.maroon }]}
          onPress={() => router.push('/create-event?type=reminder')}
        >
          <FontAwesome name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          placeholder="Search reminders..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
          data={filteredReminders}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontFamily: Fonts.black,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    position: 'relative',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  searchIcon: {
    position: 'absolute',
    left: Spacing.lg + 16,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    fontFamily: Fonts.medium,
    padding: 12,
    paddingLeft: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  title: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginEnd: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dateText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginStart: 6,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  priorityText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
});
