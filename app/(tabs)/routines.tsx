import React, { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Text, View, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchRoutines, deleteRoutine, fetchTodayCompletions, toggleRoutineCompletion, Routine, RoutineCompletion } from '@/src/api/routines';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { format } from 'date-fns';

const DAY_MAP: Record<number, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completions, setCompletions] = useState<RoutineCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'scheduled' | 'flexible'>('scheduled');

  const todayKey = DAY_MAP[new Date().getDay()];
  const todayLabel = format(new Date(), 'EEEE');

  const loadData = async () => {
    setLoading(true);
    const [routineRes, completionRes] = await Promise.all([
      fetchRoutines(),
      fetchTodayCompletions(),
    ]);
    if (routineRes.data) setRoutines(routineRes.data);
    if (completionRes.data) setCompletions(completionRes.data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteRoutine(id);
            if (!error) loadData();
          }
        }
      ]
    );
  };

  const handleToggleCheck = async (routineId: string) => {
    const { completed, error } = await toggleRoutineCompletion(routineId);
    if (!error) {
      if (completed) {
        setCompletions(prev => [...prev, { id: 'temp', routine_id: routineId, user_id: '', date_string: '', completed_at: '' }]);
      } else {
        setCompletions(prev => prev.filter(c => c.routine_id !== routineId));
      }
    }
  };

  const isCompletedToday = (routineId: string) => {
    return completions.some(c => c.routine_id === routineId);
  };

  // Filter routines by tab and today's day
  const filteredRoutines = routines.filter(r => {
    const matchType = r.schedule_type === tab || (!r.schedule_type && tab === 'scheduled');
    const matchDay = tab === 'flexible' || !r.active_days || (Array.isArray(r.active_days) && r.active_days.includes(todayKey));
    return matchType && matchDay;
  });

  // The first uncompleted routine is the "next" one
  const nextRoutine = filteredRoutines.find(r => !isCompletedToday(r.id));

  const renderNextRoutineCard = () => {
    if (!nextRoutine) return null;
    const startTime = nextRoutine.reminder_time || format(new Date(), 'h:mm a');
    
    return (
      <View style={styles.primaryCard}>
        <View style={styles.primaryCardHeader}>
          <Text style={styles.primaryCardTime}>
            {startTime}
          </Text>
        </View>
        <Text style={styles.primaryCardTitle}>{nextRoutine.title}</Text>
        <TouchableOpacity
          style={styles.quickStartBtn}
          activeOpacity={0.8}
          onPress={() => router.push(`/run-routine/${nextRoutine.id}`)}
        >
          <Text style={styles.quickStartText}>Quick Start</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRoutineCheckItem = ({ item }: { item: Routine }) => {
    const completed = isCompletedToday(item.id);
    return (
      <View
        style={[styles.checkItem, { backgroundColor: theme.surface }]}
      >
        {/* Tappable check area (circle + title) */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: 'transparent' }}
          onPress={() => handleToggleCheck(item.id)}
          activeOpacity={0.6}
        >
          <View style={[
            styles.checkCircle,
            { borderColor: completed ? '#111827' : '#E5E7EB' },
            completed && { backgroundColor: '#111827' },
          ]}>
            {completed && <FontAwesome name="check" size={12} color="#FFF" />}
          </View>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={[
              styles.checkTitle,
              { color: theme.text },
              completed && { textDecorationLine: 'line-through', color: theme.textMuted },
            ]}>
              {item.title}
            </Text>
            {item.reminder_time && (
              <Text style={[styles.checkSub, { color: theme.textMuted }]}>
                {item.reminder_time}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Action buttons (independent, NOT inside the check's touch area) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'transparent' }}>
          <TouchableOpacity onPress={() => router.push(`/run-routine/${item.id}`)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View style={styles.playButtonIcon}>
              <FontAwesome name="play" size={12} color="#111827" style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FontAwesome name="trash-o" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Routines</Text>
        <TouchableOpacity onPress={() => router.push('/create-routine')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FontAwesome name="plus" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Scheduled / Flexible Toggle */}
      <View style={[styles.tabRow, { backgroundColor: '#F3F4F6' }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'scheduled' && styles.tabBtnActive]}
          onPress={() => setTab('scheduled')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: '#6B7280' }, tab === 'scheduled' && styles.tabTextActive]}>
            Scheduled
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'flexible' && styles.tabBtnActive]}
          onPress={() => setTab('flexible')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: '#6B7280' }, tab === 'flexible' && styles.tabTextActive]}>
            Flexible
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredRoutines}
          keyExtractor={(item) => item.id}
          renderItem={renderRoutineCheckItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Day label */}
              <View style={styles.dayRow}>
                <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>{todayLabel}</Text>
                <FontAwesome name="calendar" size={16} color={theme.textMuted} />
              </View>

              {/* Blue Card */}
              {tab === 'scheduled' && renderNextRoutineCard()}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="moon-o" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                No {tab} routines for today.{'\n'}Tap + to create one!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Fonts.black,
    fontSize: 34,
    letterSpacing: -1,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: 16,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  tabTextActive: {
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  dayLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  // ── Primary Card ──────────────────
  primaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  primaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryCardTime: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: '#6B7280',
  },
  primaryCardTitle: {
    fontFamily: Fonts.black,
    fontSize: 24,
    color: '#111827',
    marginBottom: Spacing.xl,
    letterSpacing: -0.5,
  },
  quickStartBtn: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  quickStartText: {
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    fontSize: 15,
  },

  // ── Check Items ──────────────────
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Spacing.sm,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#111827',
  },
  checkSub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginTop: 2,
    color: '#6B7280',
  },
  playButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Empty ──────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
  },
});
