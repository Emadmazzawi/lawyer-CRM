import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, ScrollView, View as RNView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { 
  fetchRoutines, 
  deleteRoutine, 
  deleteStep,
  fetchCompletionsForRange, 
  fetchStepCompletionsForRange,
  toggleRoutineCompletion, 
  toggleStepCompletion,
  batchSetStepCompletion,
  Routine, 
  RoutineCompletion,
  StepCompletion
} from '@/src/api/routines';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { format, eachDayOfInterval, isSameDay, subDays, addDays, isToday, isFuture, startOfDay } from 'date-fns';
import { View, Text } from '@/components/Themed';
import { Skeleton } from '@/components/Skeleton';
import { RoutineCard } from '@/components/RoutineCard';
import * as Haptics from 'expo-haptics';
import { syncRoutineNotifications } from '@/src/lib/notifications';

const DAY_MAP: Record<number, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

export default function RoutinesScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const isRTL = i18n.dir() === 'rtl';

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completions, setCompletions] = useState<RoutineCompletion[]>([]);
  const [stepCompletions, setStepCompletions] = useState<StepCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'scheduled' | 'flexible'>('scheduled');
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scrollRef = useRef<ScrollView>(null);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), 14),
      end: addDays(new Date(), 14),
    });
  }, []);

  const todayKey = DAY_MAP[selectedDate.getDay()];
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('--- [Debug] loadData starting...');
      const startDate = format(calendarDays[0], 'yyyy-MM-dd');
      const endDate = format(calendarDays[calendarDays.length - 1], 'yyyy-MM-dd');
      
      const [routineRes, completionRes, stepCompletionRes] = await Promise.all([
        fetchRoutines(),
        fetchCompletionsForRange(startDate, endDate),
        fetchStepCompletionsForRange(startDate, endDate),
      ]);

      if (routineRes.error) throw routineRes.error;
      console.log('--- [Debug] Routines loaded:', routineRes.data?.length);
      
      if (routineRes.data) {
        setRoutines(routineRes.data);
        // Fire-and-forget sync of push notifications for routines
        syncRoutineNotifications(routineRes.data).catch(err => console.warn('Failed to sync notifications', err));
      }
      if (completionRes.data) setCompletions(completionRes.data);
      if (stepCompletionRes.data) setStepCompletions(stepCompletionRes.data);
    } catch (error: any) {
      console.error('--- [Debug] loadData error:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Failed to load routines');
      } else {
        Alert.alert(t('common.error'), error.message || 'Failed to load routines');
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  // Center calendar on today or selected date
  useEffect(() => {
    if (scrollRef.current) {
      const index = calendarDays.findIndex(d => isSameDay(d, selectedDate));
      if (index !== -1) {
        // Approximate width of a calendar day (54) + gap (10)
        const offset = index * 64 - 150; 
        scrollRef.current.scrollTo({ x: offset, animated: true });
      }
    }
  }, [selectedDate, calendarDays]);

  const handleGoToToday = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedDate(new Date());
  };

  const handleDeleteRoutine = useCallback((id: string) => {
    const performDelete = async () => {
      try {
        setLoading(true);
        console.log('--- [Debug] Attempting to delete routine:', id);
        const { error, status } = await deleteRoutine(id);
        
        if (error) {
          console.error('--- [Debug] Delete Routine Error:', error);
          if (Platform.OS === 'web') {
            window.alert(`Delete failed: ${error.message}`);
          } else {
            Alert.alert(t('common.error'), `Delete failed: ${error.message}`);
          }
        } else {
          console.log('--- [Debug] Delete Routine Success. Status:', status);
          // Refresh data immediately
          await loadData();
        }
      } catch (e: any) {
        console.error('--- [Debug] Catch block error:', e);
        if (Platform.OS === 'web') {
          window.alert(e.message || 'An unexpected error occurred');
        } else {
          Alert.alert(t('common.error'), e.message || 'An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('routines.deleteConfirm'))) {
        performDelete();
      }
    } else {
      Alert.alert(t('routines.deleteRoutine'), t('routines.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: performDelete }
      ]);
    }
  }, [t, loadData]);

  const handleDeleteStep = useCallback((stepId: string) => {
    const performDelete = async () => {
      try {
        const { error } = await deleteStep(stepId);
        if (error) {
          if (Platform.OS === 'web') {
            window.alert(error.message);
          } else {
            Alert.alert(t('common.error'), error.message);
          }
        } else {
          await loadData();
        }
      } catch (e: any) {
        if (Platform.OS === 'web') {
          window.alert(e.message || 'Failed to delete step');
        } else {
          Alert.alert(t('common.error'), e.message || 'Failed to delete step');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this step?')) {
        performDelete();
      }
    } else {
      Alert.alert('Delete Step', 'Are you sure you want to delete this step?', [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: performDelete }
      ]);
    }
  }, [t, loadData]);

  const isRoutineDone = useCallback((id: string) => 
    completions.some(c => c.routine_id === id && c.date_string === selectedDateString),
    [completions, selectedDateString]
  );
  
  const isStepDone = useCallback((id: string) => 
    stepCompletions.some(c => c.step_id === id && c.date_string === selectedDateString),
    [stepCompletions, selectedDateString]
  );

  const handleToggleRoutine = async (routine: Routine) => {
    if (isFuture(startOfDay(selectedDate)) && !isToday(selectedDate)) return;
    
    const currentDone = isRoutineDone(routine.id);
    const targetStatus = !currentDone;

    // Optimistic UI Update
    const previousCompletions = [...completions];
    const previousStepCompletions = [...stepCompletions];

    if (targetStatus) {
      setCompletions(prev => [...prev, { id: 'temp-'+Date.now(), routine_id: routine.id, user_id: '', date_string: selectedDateString, completed_at: '' }]);
      if (routine.steps) {
        const newStepComps = routine.steps.map(s => ({ id: 'temp-'+s.id, step_id: s.id, user_id: '', date_string: selectedDateString, completed_at: '' }));
        setStepCompletions(prev => [...prev, ...newStepComps]);
      }
    } else {
      setCompletions(prev => prev.filter(c => !(c.routine_id === routine.id && c.date_string === selectedDateString)));
      if (routine.steps) {
        const stepIds = routine.steps.map(s => s.id);
        setStepCompletions(prev => prev.filter(c => !(c.date_string === selectedDateString && stepIds.includes(c.step_id))));
      }
    }

    const { completed, error } = await toggleRoutineCompletion(routine.id, selectedDateString, targetStatus);
    
    if (error) {
      if (Platform.OS === 'web') {
        window.alert(error.message);
      } else {
        Alert.alert(t('common.error'), error.message);
      }
      setCompletions(previousCompletions);
      setStepCompletions(previousStepCompletions);
      return;
    }

    if (routine.steps && routine.steps.length > 0) {
      const stepIds = routine.steps.map(s => s.id);
      const { error: batchError } = await batchSetStepCompletion(stepIds, selectedDateString, completed);
      if (batchError) {
        // Rollback is tricky here but let's at least notify
        if (Platform.OS === 'web') {
          window.alert('Failed to update some steps');
        } else {
          Alert.alert(t('common.error'), 'Failed to update some steps');
        }
        loadData();
      }
    }
  };

  const handleToggleStep = async (routineId: string, stepId: string) => {
    if (isFuture(startOfDay(selectedDate)) && !isToday(selectedDate)) return;
    
    const currentDone = isStepDone(stepId);
    const targetStatus = !currentDone;

    // Optimistic Update
    const previousStepCompletions = [...stepCompletions];
    const previousCompletions = [...completions];

    let updatedSteps: StepCompletion[] = [];
    if (targetStatus) {
      updatedSteps = [...stepCompletions, { id: 'temp-'+Date.now(), step_id: stepId, user_id: '', date_string: selectedDateString, completed_at: '' }];
    } else {
      updatedSteps = stepCompletions.filter(c => !(c.step_id === stepId && c.date_string === selectedDateString));
    }
    setStepCompletions(updatedSteps);

    // Check if we need to toggle the parent routine optimistically
    const routine = routines.find(r => r.id === routineId);
    if (routine && routine.steps) {
      const allStepsDone = routine.steps.every(s => 
        updatedSteps.some(sc => sc.step_id === s.id && sc.date_string === selectedDateString)
      );
      const parentDone = isRoutineDone(routineId);

      if (allStepsDone && !parentDone) {
        setCompletions(prev => [...prev, { id: 'temp-r-'+Date.now(), routine_id: routineId, user_id: '', date_string: selectedDateString, completed_at: '' }]);
      } else if (!allStepsDone && parentDone) {
        setCompletions(prev => prev.filter(c => !(c.routine_id === routineId && c.date_string === selectedDateString)));
      }
    }

    const { completed, error } = await toggleStepCompletion(stepId, selectedDateString);
    
    if (error) {
      if (Platform.OS === 'web') {
        window.alert(error.message);
      } else {
        Alert.alert(t('common.error'), error.message);
      }
      setStepCompletions(previousStepCompletions);
      setCompletions(previousCompletions);
      return;
    }

    // Sync parent routine on backend if needed
    if (routine && routine.steps) {
      const allStepsDone = routine.steps.every(s => 
        (s.id === stepId ? completed : isStepDone(s.id))
      );
      const parentDone = isRoutineDone(routineId);

      if (allStepsDone !== parentDone) {
        const { error: rError } = await toggleRoutineCompletion(routineId, selectedDateString, allStepsDone);
        if (rError) {
           // Silently fail or reload
           loadData();
        }
      }
    }
  };

  const filteredRoutines = useMemo(() => {
    const selectedDayValue = selectedDate.getDay(); // 0 = Sun, 1 = Mon ...
    return routines.map(r => {
      // Filter steps for the current day
      const dailySteps = (r.steps || []).filter(s => s.day_of_week === null || s.day_of_week === selectedDayValue);
      return { ...r, steps: dailySteps };
    }).filter(r => {
      const matchType = r.schedule_type === tab || (!r.schedule_type && tab === 'scheduled');
      if (!isToday(selectedDate) && r.schedule_type === 'flexible') return isRoutineDone(r.id);
      const matchDay = tab === 'flexible' || !r.active_days || (Array.isArray(r.active_days) && r.active_days.includes(todayKey));
      return matchType && matchDay && r.steps.length > 0; // optionally hide routines with 0 steps today
    });
  }, [routines, tab, selectedDate, todayKey, isRoutineDone]);

  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <Text style={[styles.calendarMonth, { color: theme.textSecondary }]}>
          {format(selectedDate, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={handleGoToToday} style={[styles.todayBtn, { backgroundColor: theme.maroonSoft }]}>
          <Text style={[styles.todayBtnText, { color: theme.maroon }]}>{t('common.today') || 'Today'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        ref={scrollRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.calendarScroll}
      >
        {calendarDays.map((day, index) => {
          const isSel = isSameDay(day, selectedDate);
          const isTod = isToday(day);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: 1 },
                isSel && { backgroundColor: theme.maroon, borderColor: theme.maroon, transform: [{ scale: 1.05 }] },
                isTod && !isSel && { borderColor: theme.maroon }
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                setSelectedDate(day);
              }}
            >
              <Text style={[styles.calendarDayName, { color: theme.textSecondary }, isSel && { color: '#FFF' }]}>{format(day, 'EEE')}</Text>
              <Text style={[styles.calendarDayNum, { color: theme.text }, isSel && { color: '#FFF' }]}>{format(day, 'd')}</Text>
              {isTod && !isSel && <View style={[styles.todayIndicator, { backgroundColor: theme.maroon }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const LoadingSkeleton = () => (
    <RNView style={{ paddingHorizontal: Spacing.lg }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.routineCardSkeleton, { borderColor: theme.border, padding: Spacing.md }]}>
          <RNView style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'transparent' }}>
            <Skeleton width={24} height={24} borderRadius={12} style={{ marginEnd: 15 }} />
            <Skeleton width="60%" height={20} />
          </RNView>
          <Skeleton width="100%" height={40} borderRadius={8} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={40} borderRadius={8} />
        </View>
      ))}
    </RNView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('routines.title')}</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.maroon }]}
          onPress={() => router.push('/create-routine')}
        >
          <FontAwesome name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {renderCalendar()}

      <View style={[styles.tabRow, { backgroundColor: theme.surfaceElevated }]}>
        <TouchableOpacity 
          style={[styles.tabBtn, tab === 'scheduled' && { backgroundColor: theme.surface }]} 
          onPress={() => {
             if (Platform.OS !== 'web') {
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
             }
             setTab('scheduled');
          }}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, tab === 'scheduled' && { color: theme.text }]}>{t('routines.scheduled')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, tab === 'flexible' && { backgroundColor: theme.surface }]} 
          onPress={() => {
             if (Platform.OS !== 'web') {
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
             }
             setTab('flexible');
          }}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, tab === 'flexible' && { color: theme.text }]}>{t('routines.flexible')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={filteredRoutines}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <RoutineCard 
              routine={item}
              index={index}
              isDone={isRoutineDone}
              isStepDone={isStepDone}
              onToggleRoutine={handleToggleRoutine}
              onToggleStep={handleToggleStep}
              onDeleteRoutine={handleDeleteRoutine}
              onDeleteStep={handleDeleteStep}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('routines.noRoutines', { tab: t(`routines.${tab}`) })}</Text>}
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  headerTitle: { fontFamily: Fonts.black, fontSize: 32 },
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
  calendarContainer: { marginBottom: Spacing.md, backgroundColor: 'transparent' },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  calendarMonth: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    textTransform: 'capitalize',
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  calendarScroll: { paddingHorizontal: Spacing.lg, gap: 10, paddingVertical: 5 },
  calendarDay: { width: 54, height: 74, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  calendarDayName: { fontSize: 10, fontFamily: Fonts.bold, textTransform: 'uppercase' },
  calendarDayNum: { fontSize: 18, fontFamily: Fonts.bold, marginTop: 4 },
  todayIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, borderRadius: 16, padding: 4, marginBottom: Spacing.md },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontFamily: Fonts.bold },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  routineCardSkeleton: { borderRadius: 24, borderWidth: 1, marginBottom: Spacing.md, backgroundColor: 'transparent' },
  emptyText: { textAlign: 'center', marginTop: 40, fontFamily: Fonts.medium },
});
