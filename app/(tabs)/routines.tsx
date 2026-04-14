import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Text, View, Animated, ScrollView, Platform } from 'react-native';
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

const DAY_MAP: Record<number, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completions, setCompletions] = useState<RoutineCompletion[]>([]);
  const [stepCompletions, setStepCompletions] = useState<StepCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'scheduled' | 'flexible'>('scheduled');
  
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
    
    const [routineRes, completionRes, stepCompletionRes] = await Promise.all([
      fetchRoutines(),
      fetchCompletionsForRange(startDate, endDate),
      fetchStepCompletionsForRange(startDate, endDate),
    ]);
    if (routineRes.data) setRoutines(routineRes.data);
    if (completionRes.data) setCompletions(completionRes.data);
    if (stepCompletionRes.data) setStepCompletions(stepCompletionRes.data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  const handleDeleteRoutine = (id: string) => {
    const performDelete = async () => {
      setLoading(true);
      const { error } = await deleteRoutine(id);
      if (error) Alert.alert(t('common.error'), error.message);
      else await loadData();
    };

    Alert.alert(t('routines.deleteRoutine'), t('routines.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: performDelete }
    ]);
  };

  const handleDeleteStep = (stepId: string) => {
    const performDelete = async () => {
      const { error } = await deleteStep(stepId);
      if (error) Alert.alert(t('common.error'), error.message);
      else await loadData();
    };

    Alert.alert('Delete Step', 'Are you sure you want to delete this step?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: performDelete }
    ]);
  };

  const isRoutineDone = (id: string) => completions.some(c => c.routine_id === id && c.date_string === selectedDateString);
  const isStepDone = (id: string) => stepCompletions.some(c => c.step_id === id && c.date_string === selectedDateString);

  const handleToggleRoutine = async (routine: Routine) => {
    if (isFuture(startOfDay(selectedDate)) && !isToday(selectedDate)) return;
    
    const currentDone = isRoutineDone(routine.id);
    const targetStatus = !currentDone;

    // 1. Toggle Routine Status
    const { completed, error } = await toggleRoutineCompletion(routine.id, selectedDateString, targetStatus);
    
    if (!error) {
      // 2. Sync UI state for routine
      if (completed) {
        setCompletions(prev => [...prev, { id: 'temp-'+Date.now(), routine_id: routine.id, user_id: '', date_string: selectedDateString, completed_at: '' }]);
      } else {
        setCompletions(prev => prev.filter(c => !(c.routine_id === routine.id && c.date_string === selectedDateString)));
      }

      // 3. Batch Update Steps
      if (routine.steps && routine.steps.length > 0) {
        const stepIds = routine.steps.map(s => s.id);
        const { error: batchError } = await batchSetStepCompletion(stepIds, selectedDateString, completed);
        
        if (!batchError) {
          // Sync UI state for steps
          if (completed) {
            const newComps = stepIds.map(sid => ({ id: 'temp-'+sid, step_id: sid, user_id: '', date_string: selectedDateString, completed_at: '' }));
            // Avoid duplicates
            setStepCompletions(prev => {
              const otherDateComps = prev.filter(c => c.date_string !== selectedDateString || !stepIds.includes(c.step_id));
              return [...otherDateComps, ...newComps];
            });
          } else {
            setStepCompletions(prev => prev.filter(c => !(c.date_string === selectedDateString && stepIds.includes(c.step_id))));
          }
        }
      }
    }
  };

  const handleToggleStep = async (routineId: string, stepId: string) => {
    if (isFuture(startOfDay(selectedDate)) && !isToday(selectedDate)) return;
    
    const { completed, error } = await toggleStepCompletion(stepId, selectedDateString);
    
    if (!error) {
      // 1. Update step UI
      let updatedSteps: StepCompletion[] = [];
      if (completed) {
        updatedSteps = [...stepCompletions, { id: 'temp-'+Date.now(), step_id: stepId, user_id: '', date_string: selectedDateString, completed_at: '' }];
      } else {
        updatedSteps = stepCompletions.filter(c => !(c.step_id === stepId && c.date_string === selectedDateString));
      }
      setStepCompletions(updatedSteps);

      // 2. Recalculate Parent Routine
      const routine = routines.find(r => r.id === routineId);
      if (routine && routine.steps) {
        const allStepsDone = routine.steps.every(s => 
          updatedSteps.some(sc => sc.step_id === s.id && sc.date_string === selectedDateString)
        );
        const parentDone = isRoutineDone(routineId);

        if (allStepsDone && !parentDone) {
          // Auto-check parent
          const { error: rError } = await toggleRoutineCompletion(routineId, selectedDateString, true);
          if (!rError) setCompletions(prev => [...prev, { id: 'temp-r-'+Date.now(), routine_id: routineId, user_id: '', date_string: selectedDateString, completed_at: '' }]);
        } else if (!allStepsDone && parentDone) {
          // Auto-uncheck parent
          const { error: rError } = await toggleRoutineCompletion(routineId, selectedDateString, false);
          if (!rError) setCompletions(prev => prev.filter(c => !(c.routine_id === routineId && c.date_string === selectedDateString)));
        }
      }
    }
  };

  const filteredRoutines = routines.filter(r => {
    const matchType = r.schedule_type === tab || (!r.schedule_type && tab === 'scheduled');
    if (!isToday(selectedDate) && r.schedule_type === 'flexible') return isRoutineDone(r.id);
    const matchDay = tab === 'flexible' || !r.active_days || (Array.isArray(r.active_days) && r.active_days.includes(todayKey));
    return matchType && matchDay;
  });

  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
        {calendarDays.map((day, index) => {
          const isSel = isSameDay(day, selectedDate);
          const isTod = isToday(day);
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
              <Text style={[styles.calendarDayName, { color: theme.textSecondary }, isSel && { color: '#FFF' }]}>{format(day, 'EEE')}</Text>
              <Text style={[styles.calendarDayNum, { color: theme.text }, isSel && { color: '#FFF' }]}>{format(day, 'd')}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderRoutineItem = ({ item }: { item: Routine }) => {
    const done = isRoutineDone(item.id);
    const isPast = !isToday(selectedDate) && !isFuture(selectedDate);

    return (
      <View style={[styles.routineCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.routineHeader}>
          <TouchableOpacity 
            style={styles.routineTitleArea} 
            onPress={() => handleToggleRoutine(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkCircle, done && { backgroundColor: theme.maroon, borderColor: theme.maroon }]}>
              {done && <FontAwesome name="check" size={10} color="#FFF" />}
            </View>
            <Text style={[styles.routineTitle, { color: theme.text }, done && styles.doneText]}>{item.title}</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push(`/run-routine/${item.id}`)} style={styles.actionBtn}>
              <FontAwesome name="play" size={14} color={theme.maroon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteRoutine(item.id)} style={styles.actionBtn}>
              <FontAwesome name="trash-o" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {item.steps && item.steps.length > 0 && (
          <View style={styles.stepsContainer}>
            {item.steps.map(step => {
              const sDone = isStepDone(step.id);
              return (
                <View key={step.id} style={[styles.stepRow, { borderTopColor: theme.border }]}>
                  <TouchableOpacity 
                    style={styles.stepTitleArea}
                    onPress={() => handleToggleStep(item.id, step.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={[styles.stepCheck, sDone && { backgroundColor: theme.maroon, borderColor: theme.maroon }]}>
                      {sDone && <FontAwesome name="check" size={8} color="#FFF" />}
                    </View>
                    <Text style={styles.stepEmoji}>{step.emoji || '✨'}</Text>
                    <Text style={[styles.stepTitle, { color: theme.textSecondary }, sDone && styles.doneText]}>{step.title}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteStep(step.id)} style={styles.stepDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <FontAwesome name="times" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('routines.title')}</Text>
        <TouchableOpacity onPress={() => router.push('/create-routine')}><FontAwesome name="plus" size={22} color={theme.text} /></TouchableOpacity>
      </View>

      {renderCalendar()}

      <View style={[styles.tabRow, { backgroundColor: theme.surfaceElevated }]}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'scheduled' && styles.tabBtnActive]} onPress={() => setTab('scheduled')}>
          <Text style={[styles.tabText, tab === 'scheduled' && styles.tabTextActive]}>{t('routines.scheduled')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'flexible' && styles.tabBtnActive]} onPress={() => setTab('flexible')}>
          <Text style={[styles.tabText, tab === 'flexible' && styles.tabTextActive]}>{t('routines.flexible')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.maroon} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredRoutines}
          keyExtractor={item => item.id}
          renderItem={renderRoutineItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('routines.noRoutines', { tab: t(`routines.${tab}`) })}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  headerTitle: { fontFamily: Fonts.black, fontSize: 32 },
  calendarContainer: { marginBottom: Spacing.md },
  calendarScroll: { paddingHorizontal: Spacing.lg, gap: 10 },
  calendarDay: { width: 50, height: 70, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  calendarDayName: { fontSize: 10, fontFamily: Fonts.bold, textTransform: 'uppercase' },
  calendarDayNum: { fontSize: 16, fontFamily: Fonts.bold },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, borderRadius: 12, padding: 4, marginBottom: Spacing.md },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFF' },
  tabText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#666' },
  tabTextActive: { color: '#000' },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  routineCard: { borderRadius: 20, borderWidth: 1, marginBottom: Spacing.md, overflow: 'hidden' },
  routineHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  routineTitleArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#DDD', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  routineTitle: { fontSize: 18, fontFamily: Fonts.bold },
  headerActions: { flexDirection: 'row', gap: 15 },
  actionBtn: { padding: 5 },
  stepsContainer: { paddingBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: Spacing.md, borderTopWidth: 1 },
  stepTitleArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepCheck: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#EEE', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  stepEmoji: { fontSize: 16, marginRight: 8 },
  stepTitle: { fontSize: 14, fontFamily: Fonts.medium },
  stepDelete: { padding: 5 },
  doneText: { textDecorationLine: 'line-through', opacity: 0.5 },
  emptyText: { textAlign: 'center', marginTop: 40, fontFamily: Fonts.medium }
});
