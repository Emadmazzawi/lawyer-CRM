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
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { Skeleton } from '@/components/Skeleton';
import { format } from 'date-fns';

export default function CompletedScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Partial<EventTask>[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

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
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <FontAwesome name="check-circle" size={18} color={theme.success} style={{ marginEnd: 10 }} />
          <Text style={[styles.title, { color: theme.textSecondary }]}>{item.title}</Text>
        </View>
        <Text style={[styles.typeLabel, { color: theme.textMuted }]}>{item.type ? t(`categories.${item.type}`) : ''}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.dateText, { color: theme.textMuted }]}>
          {t('clientDetails.completedOn')} {item.due_date ? format(new Date(item.due_date), 'MMM d, yyyy') : 'No date'}
        </Text>
      </View>
    </View>
  ), [theme, t]);

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('tabs.history')}</Text>
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
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontFamily: Fonts.black,
    fontSize: 28,
    letterSpacing: -0.5,
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
    opacity: 0.7, // Muted appearance for completed items
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  typeLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardFooter: {
    backgroundColor: 'transparent',
  },
  dateText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
});
