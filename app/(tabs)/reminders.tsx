import { StyleSheet, FlatList, TouchableOpacity, View as RNView, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useEffect, useState, useCallback } from 'react';
import { getEventsTasks, EventTask, deleteEventTask, updateEventTask } from '@/src/api/events_and_tasks';
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
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const ReminderItem = React.memo(({ item, index, theme, t, onComplete, onDelete }: { item: Partial<EventTask>; index: number; theme: any; t: any; onComplete: (id: string) => void; onDelete: (id: string) => void }) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Urgent': return theme.danger;
      case 'High': return theme.warning;
      case 'Medium': return theme.success;
      default: return theme.border;
    }
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(500)}
      layout={Layout.springify()}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderLeftWidth: 4, borderLeftColor: getPriorityColor(item.priority || undefined) }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
        <FontAwesome 
          name="bell-o" 
          size={20} 
          color="#7B1FA2" 
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{item.due_date ? format(new Date(item.due_date), 'MMM d, yyyy') : 'No date'}</Text>
      </View>
      
      <View style={styles.actionGroup}>
        <TouchableOpacity onPress={() => onComplete(item.id!)} style={styles.actionButton}>
          <FontAwesome name="check-circle-o" size={24} color={theme.success} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id!)} style={[styles.actionButton, { marginLeft: Spacing.md }]}>
          <FontAwesome name="trash-o" size={22} color={theme.danger} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

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

  const handleComplete = async (id: string) => {
    const { error } = await updateEventTask(id, { is_completed: true });
    if (!error) loadReminders();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteEventTask(id);
    if (!error) loadReminders();
  };

  const renderItem = useCallback(({ item, index }: { item: Partial<EventTask>, index: number }) => (
    <ReminderItem
      item={item}
      index={index}
      theme={theme}
      t={t}
      onComplete={handleComplete}
      onDelete={handleDelete}
    />
  ), [theme, t]);

  const LoadingSkeleton = () => (
    <View style={{ padding: 20 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <Skeleton width={44} height={44} borderRadius={12} />
          <View style={[styles.cardContent, { marginLeft: 15 }]}>
            <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={12} />
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginStart: Spacing.md,
    backgroundColor: 'transparent',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginTop: 2,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  actionButton: {
    padding: 4,
  },
});
