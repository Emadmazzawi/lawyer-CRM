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
      <View style={styles.blueCard}>
        <View style={styles.blueCardHeader}>
          <Text style={styles.blueCardTime}>
            {startTime}
          </Text>
        </View>
        <Text style={styles.blueCardTitle}>{nextRoutine.title}</Text>
        <TouchableOpacity
          style={styles.quickStartBtn}
          onPress={() => router.push(`/run-routine/${nextRoutine.id}`)}
        >
          <Text style={styles.quickStartText}>QUICK-START</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRoutineCheckItem = ({ item }: { item: Routine }) => {
    const completed = isCompletedToday(item.id);
    return (
      <TouchableOpacity
        style={[styles.checkItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => handleToggleCheck(item.id)}
        activeOpacity={0.6}
      >
        {/* Check circle */}
        <View style={[
          styles.checkCircle,
          { borderColor: completed ? theme.success : theme.border },
          completed && { backgroundColor: theme.success },
        ]}>
          {completed && <FontAwesome name="check" size={14} color="#FFF" />}
        </View>

        {/* Content */}
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

        {/* Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'transparent' }}>
          <TouchableOpacity onPress={() => router.push(`/run-routine/${item.id}`)}>
            <FontAwesome name="play-circle" size={28} color="#4A7BF7" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <FontAwesome name="trash-o" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Routines</Text>
        <TouchableOpacity onPress={() => router.push('/create-routine')}>
          <FontAwesome name="plus-circle" size={28} color="#4A7BF7" />
        </TouchableOpacity>
      </View>

      {/* Scheduled / Flexible Toggle */}
      <View style={[styles.tabRow, { backgroundColor: theme.surfaceElevated }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'scheduled' && styles.tabBtnActive]}
          onPress={() => setTab('scheduled')}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, tab === 'scheduled' && styles.tabTextActive]}>
            Scheduled 🔁
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'flexible' && styles.tabBtnActive]}
          onPress={() => setTab('flexible')}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, tab === 'flexible' && styles.tabTextActive]}>
            Flexible ✂️
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A7BF7" style={{ marginTop: 50 }} />
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
    fontSize: 28,
    letterSpacing: -0.5,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  tabTextActive: {
    color: '#111',
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

  // ── Blue Card ──────────────────
  blueCard: {
    backgroundColor: '#4A7BF7',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#4A7BF7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  blueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  blueCardTime: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  blueCardTitle: {
    fontFamily: Fonts.black,
    fontSize: 22,
    color: '#FFF',
    marginBottom: Spacing.md,
  },
  quickStartBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
  },
  quickStartText: {
    fontFamily: Fonts.black,
    color: '#FFF',
    fontSize: 14,
    letterSpacing: 1,
  },

  // ── Check Items ──────────────────
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  checkSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginTop: 2,
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
