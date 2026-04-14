import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Text, View, Animated, ScrollView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchRoutines, deleteRoutine, fetchCompletionsForRange, toggleRoutineCompletion, Routine, RoutineCompletion } from '@/src/api/routines';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays, addDays, isToday, isFuture, startOfDay } from 'date-fns';

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
  
  // Tracker State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), 14),
      end: addDays(new Date(), 7),
    });
  }, []);

  const todayKey = DAY_MAP[selectedDate.getDay()];
  const selectedDateLabel = format(selectedDate, 'EEEE, MMM do');
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  const loadData = async () => {
    setLoading(true);
    const startDate = format(calendarDays[0], 'yyyy-MM-dd');
    const endDate = format(calendarDays[calendarDays.length - 1], 'yyyy-MM-dd');
    
    const [routineRes, completionRes] = await Promise.all([
      fetchRoutines(),
      fetchCompletionsForRange(startDate, endDate),
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
    const performDelete = async () => {
      setLoading(true);
      try {
        const { error } = await deleteRoutine(id);
        if (error) {
          Alert.alert(t('common.error'), error.message || 'Failed to delete routine');
        } else {
          await loadData();
        }
      } catch (err: any) {
        Alert.alert(t('common.error'), err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('routines.deleteConfirm'));
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        t('routines.deleteRoutine'),
        t('routines.deleteConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: performDelete
          }
        ]
      );
    }
  };

  const handleToggleCheck = async (routineId: string) => {
    if (isFuture(startOfDay(selectedDate)) && !isToday(selectedDate)) {
      Alert.alert(t('common.error'), 'You cannot complete routines for future dates.');
      return;
    }

    const { completed, error } = await toggleRoutineCompletion(routineId, selectedDateString);
    if (!error) {
      if (completed) {
        setCompletions(prev => [...prev, { id: 'temp-' + Date.now(), routine_id: routineId, user_id: '', date_string: selectedDateString, completed_at: new Date().toISOString() }]);
      } else {
        setCompletions(prev => prev.filter(c => !(c.routine_id === routineId && c.date_string === selectedDateString)));
      }
    } else {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const isCompletedOn = (routineId: string, dateStr: string) => {
    return completions.some(c => c.routine_id === routineId && c.date_string === dateStr);
  };

  const getCompletionStatsForDay = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    const dayKey = DAY_MAP[date.getDay()];
    
    const dayRoutines = routines.filter(r => {
      if (r.schedule_type === 'flexible') return false;
      return Array.isArray(r.active_days) && r.active_days.includes(dayKey);
    });

    if (dayRoutines.length === 0) return 'none';
    
    const completedCount = dayRoutines.filter(r => isCompletedOn(r.id, dStr)).length;
    
    if (completedCount === 0) return 'zero';
    if (completedCount === dayRoutines.length) return 'all';
    return 'partial';
  };

  const filteredRoutines = routines.filter(r => {
    const matchType = r.schedule_type === tab || (!r.schedule_type && tab === 'scheduled');
    
    if (!isToday(selectedDate) && r.schedule_type === 'flexible') {
      return isCompletedOn(r.id, selectedDateString);
    }

    const matchDay = tab === 'flexible' || !r.active_days || (Array.isArray(r.active_days) && r.active_days.includes(todayKey));
    return matchType && matchDay;
  }).sort((a, b) => {
    if (!a.reminder_time && !b.reminder_time) return 0;
    if (!a.reminder_time) return 1;
    if (!b.reminder_time) return -1;
    return a.reminder_time.localeCompare(b.reminder_time);
  });

  const nextRoutine = filteredRoutines.find(r => !isCompletedOn(r.id, selectedDateString));

  const renderNextRoutineCard = () => {
    if (!isToday(selectedDate)) return null;
    if (!nextRoutine) return null;
    const startTime = nextRoutine.reminder_time || format(new Date(), 'h:mm a');
    
    return (
      <View style={[styles.primaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.primaryCardHeader}>
          <Text style={[styles.primaryCardTime, { color: theme.textSecondary }]}>
            {startTime}
          </Text>
        </View>
        <Text style={[styles.primaryCardTitle, { color: theme.text }]}>{nextRoutine.title}</Text>
        <TouchableOpacity
          style={[styles.quickStartBtn, { backgroundColor: theme.maroon }]}
          activeOpacity={0.8}
          onPress={() => router.push(`/run-routine/${nextRoutine.id}`)}
        >
          <Text style={styles.quickStartText}>{t('routines.quickStart')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCalendar = () => {
    return (
      <View style={styles.calendarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
          {calendarDays.map((day, index) => {
            const isSel = isSameDay(day, selectedDate);
            const isTod = isToday(day);
            const status = getCompletionStatsForDay(day);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  { backgroundColor: theme.surfaceElevated },
                  isSel && { backgroundColor: theme.maroon, borderColor: theme.maroon },
                  isTod && !isSel && { borderColor: theme.maroon, borderWidth: 1 }
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[styles.calendarDayName, { color: theme.textSecondary }, isSel && { color: '#FFF' }]}>
                  {format(day, 'EEE')}
                </Text>
                <Text style={[styles.calendarDayNum, { color: theme.text }, isSel && { color: '#FFF' }]}>
                  {format(day, 'd')}
                </Text>
                
                <View style={styles.dotRow}>
                  {status === 'all' && <View style={[styles.dot, { backgroundColor: '#10B981' }]} />}
                  {status === 'partial' && <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />}
                  {status === 'zero' && !isFuture(day) && <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderRoutineCheckItem = ({ item }: { item: Routine }) => {
    const completed = isCompletedOn(item.id, selectedDateString);
    const isPast = !isToday(selectedDate) && !isFuture(selectedDate);
    
    return (
      <View
        style={[styles.checkItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: 'transparent' }}
          onPress={() => handleToggleCheck(item.id)}
          activeOpacity={0.6}
        >
          <View style={[
            styles.checkCircle,
            { borderColor: completed ? theme.maroon : theme.border },
            completed && { backgroundColor: theme.maroon },
            !completed && isPast && { borderColor: theme.error },
          ]}>
            {completed ? (
              <FontAwesome name="check" size={12} color="#FFF" />
            ) : isPast ? (
              <FontAwesome name="times" size={12} color={theme.error} />
            ) : null}
          </View>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={[
              styles.checkTitle,
              { color: theme.text },
              completed && { textDecorationLine: 'line-through', color: theme.textMuted },
            ]}>
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' }}>
              {item.reminder_time && (
                <Text style={[styles.checkSub, { color: theme.textMuted }]}>
                  {item.reminder_time}
                </Text>
              )}
              {isPast && !completed && (
                <Text style={[styles.missedLabel, { color: theme.error }]}>• {t('routines.missed', 'Missed')}</Text>
              )}
              {completed && (
                <Text style={[styles.doneLabel, { color: '#10B981' }]}>• {t('routines.done', 'Done')}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'transparent' }}>
          {!isPast && (
            <TouchableOpacity onPress={() => router.push(`/run-routine/${item.id}`)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View style={[styles.playButtonIcon, { backgroundColor: theme.surfaceElevated }]}>
                <FontAwesome name="play" size={12} color={theme.maroon} style={{ marginStart: 2 }} />
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FontAwesome name="trash-o" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('routines.title')}</Text>
        <TouchableOpacity onPress={() => router.push('/create-routine')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FontAwesome name="plus" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {renderCalendar()}

      <View style={[styles.tabRow, { backgroundColor: theme.surfaceElevated }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'scheduled' && [styles.tabBtnActive, { backgroundColor: theme.surface }]]}
          onPress={() => setTab('scheduled')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, tab === 'scheduled' && [styles.tabTextActive, { color: theme.text }]]}>
            {t('routines.scheduled')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'flexible' && [styles.tabBtnActive, { backgroundColor: theme.surface }]]}
          onPress={() => setTab('flexible')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, tab === 'flexible' && [styles.tabTextActive, { color: theme.text }]]}>
            {t('routines.flexible')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.maroon} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredRoutines}
          keyExtractor={(item) => item.id}
          renderItem={renderRoutineCheckItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.dayRow}>
                <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>
                  {isToday(selectedDate) ? t('common.today', 'Today') : selectedDateLabel}
                </Text>
                <FontAwesome name="calendar" size={16} color={theme.textMuted} />
              </View>
              {tab === 'scheduled' && renderNextRoutineCard()}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="moon-o" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {t('routines.noRoutines', { tab: t(`routines.${tab}`) })}
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
  calendarContainer: {
    marginBottom: Spacing.lg,
  },
  calendarScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  calendarDay: {
    width: 60,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  calendarDayName: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  calendarDayNum: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  dotRow: {
    flexDirection: 'row',
    height: 4,
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
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
    marginEnd: Spacing.md,
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
  missedLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  doneLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  playButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
