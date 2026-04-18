import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Text, View, Switch, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { createRoutine, RoutineStep } from '@/src/api/routines';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import AddRoutineStepModal from '@/components/AddRoutineStepModal';
import { AdaptiveDateTimePicker } from '@/components/AdaptiveDateTimePicker';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { format } from 'date-fns';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ROUTINE_PRESETS = [
  { label: '☀️ Morning', value: 'Morning Routine' },
  { label: '🌙 Evening', value: 'Evening Routine' },
  { label: '📚 Study', value: 'Study Routine' },
  { label: '💪 Fitness', value: 'Fitness Routine' },
  { label: '🧘 Wellness', value: 'Wellness Routine' },
  { label: '✏️ Custom', value: 'custom' },
];

export default function CreateRoutineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState('Morning Routine');
  const [selectedPreset, setSelectedPreset] = useState('Morning Routine');
  const [steps, setSteps] = useState<{ id: string; emoji: string; title: string; duration_in_seconds: number; day_of_week?: number | null; start_time?: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [isWeeklyCalendar, setIsWeeklyCalendar] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(1); // 1 = Mon

  // Schedule state
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [activeDays, setActiveDays] = useState<string[]>([...DAYS]);
  const [isFlexible, setIsFlexible] = useState(false);

  const totalMinutes = steps.reduce((sum, s) => sum + Math.round(s.duration_in_seconds / 60), 0);

  const toggleDay = (day: string) => {
    setActiveDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleRemoveStep = (idToRemove: string) => {
    setSteps(steps.filter(s => s.id !== idToRemove));
  };

  const handleAddStep = (step: { emoji: string; title: string; duration_in_seconds: number; start_time?: string | null }) => {
    setSteps(prev => [...prev, { ...step, id: Date.now().toString() + Math.random(), day_of_week: isWeeklyCalendar ? selectedCalendarDay : null }]);
  };

  const handlePresetSelect = (presetValue: string) => {
    setSelectedPreset(presetValue);
    if (presetValue === 'custom') {
      setTitle('New Routine');
    } else {
      setTitle(presetValue);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error', 'Error'), t('routines.titleRequired', 'Please enter a routine title.'));
      return;
    }
    if (steps.length === 0) {
      Alert.alert(t('common.error', 'Error'), 'Add at least one step to your routine.');
      return;
    }

    setLoading(true);

    const formattedSteps: Omit<RoutineStep, 'id' | 'routine_id'>[] = steps.map((s, index) => ({
      title: s.title,
      duration_in_seconds: s.duration_in_seconds,
      order_index: index,
      emoji: s.emoji,
      day_of_week: isWeeklyCalendar ? (s.day_of_week ?? null) : null,
      start_time: s.start_time ?? null,
    }));

    const { error } = await createRoutine(title, '', formattedSteps, {
      schedule_type: isFlexible ? 'flexible' : 'scheduled',
      reminder_time: reminderTime ? format(reminderTime, 'HH:mm') : null,
      active_days: activeDays,
      alarm_enabled: alarmEnabled,
    });

    setLoading(false);

    if (error) {
      Alert.alert(t('common.error', 'Error'), error.message);
    } else {
      Alert.alert(t('common.success', 'Success'), t('routines.createSuccess', 'Routine created successfully.'));
      router.back();
    }
  };

  const renderHeader = () => (
    <View style={{ backgroundColor: 'transparent' }}>
      {/* Header with close & total */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="times" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.totalBadge, { backgroundColor: theme.surfaceElevated }]}>
          <Text style={[styles.totalBadgeText, { color: theme.text }]}>{totalMinutes}m total</Text>
        </View>
      </View>

      {/* Routine Name / Preset */}
      <Text style={[styles.label, { color: theme.textSecondary }]}>Routine Type</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 4, paddingBottom: 16 }}>
        {ROUTINE_PRESETS.map(preset => (
          <Pressable
            key={preset.value}
            style={[
              styles.categoryPill,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              selectedPreset === preset.value && { backgroundColor: theme.maroon, borderColor: theme.maroon },
            ]}
            onPress={() => handlePresetSelect(preset.value)}
          >
            <Text style={[
              styles.categoryPillText,
              { color: theme.textSecondary },
              selectedPreset === preset.value && { color: '#FFF' },
            ]}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedPreset === 'custom' && (
        <View style={{ marginBottom: Spacing.sm, backgroundColor: 'transparent' }}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Custom Name</Text>
          <TextInput
            style={[styles.nameInput, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            placeholder="e.g. Weekend Routine"
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={35}
          />
          <Text style={[styles.charCount, { color: theme.textMuted }]}>{title.length}/35</Text>
        </View>
      )}

      {/* Schedule Card */}
      <Text style={[styles.label, { color: theme.textSecondary }]}>Schedule</Text>
      <View style={[styles.scheduleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>

        {/* Reminder Section */}
        <AdaptiveDateTimePicker
          mode="time"
          value={reminderTime}
          onChange={setReminderTime}
          theme={theme}
          showLabel={false}
          placeholder="No reminder set"
        />

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Alarm Row */}
        <View style={styles.scheduleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
            <FontAwesome name="bell" size={18} color={theme.textSecondary} style={{ marginEnd: 12 }} />
            <View style={{ backgroundColor: 'transparent' }}>
              <Text style={[styles.scheduleLabel, { color: theme.text }]}>Alarm</Text>
              <Text style={[styles.scheduleSub, { color: theme.textMuted }]}>Rings until you dismiss</Text>
            </View>
          </View>
          <Switch
            value={alarmEnabled}
            onValueChange={setAlarmEnabled}
            trackColor={{ false: theme.border, true: theme.maroon }}
            thumbColor="#FFF"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Day Selector */}
        <View style={styles.daysRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayPill,
                { borderColor: theme.border, backgroundColor: theme.surface },
                activeDays.includes(day) && { backgroundColor: theme.maroon, borderColor: theme.maroon },
              ]}
              onPress={() => toggleDay(day)}
            >
              <Text style={[
                styles.dayPillText,
                { color: theme.textSecondary },
                activeDays.includes(day) && { color: '#FFF' },
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ alignItems: 'center', marginVertical: 10, backgroundColor: 'transparent' }}>
          <Text style={[styles.orText, { color: theme.textMuted }]}>or</Text>
        </View>

        {/* Flexible Toggle */}
        <View style={[styles.flexibleRow, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.scheduleLabel, { color: theme.text }]}>Flexible</Text>
          <Switch
            value={isFlexible}
            onValueChange={setIsFlexible}
            trackColor={{ false: theme.border, true: theme.maroon }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* Steps Mode Toggle */}
      <View style={styles.stepsHeaderRow}>
        <Text style={[styles.stepsCount, { color: theme.text }]}>{steps.length} steps</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
          <Text style={[styles.reorderHint, { color: theme.textSecondary, marginRight: 8 }]}>Weekly View</Text>
          <Switch
            value={isWeeklyCalendar}
            onValueChange={(val) => setIsWeeklyCalendar(val)}
            trackColor={{ false: theme.border, true: theme.maroon }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {isWeeklyCalendar && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }} contentContainerStyle={{ gap: 8 }}>
          {DAYS.map((day, idx) => {
            const dayValue = day === 'Sun' ? 0 : idx + 1;
            const isSelected = selectedCalendarDay === dayValue;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayPill,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                  isSelected && { backgroundColor: theme.maroon, borderColor: theme.maroon }
                ]}
                onPress={() => setSelectedCalendarDay(dayValue)}
              >
                <Text style={[styles.dayPillText, { color: theme.textSecondary }, isSelected && { color: '#FFF' }]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={{ backgroundColor: 'transparent' }}>
      <TouchableOpacity
        style={[styles.addStepDashed, { backgroundColor: theme.background, borderColor: theme.border }]}
        onPress={() => setShowStepModal(true)}
      >
        <FontAwesome name="plus" size={14} color={theme.textMuted} style={{ marginEnd: 8 }} />
        <Text style={[styles.addStepText, { color: theme.textMuted }]}>Add step</Text>
      </TouchableOpacity>
      <View style={{ height: 100, backgroundColor: 'transparent' }} />
    </View>
  );

  const visibleSteps = steps.filter(s => !isWeeklyCalendar || s.day_of_week === selectedCalendarDay);
  const hiddenSteps = steps.filter(s => isWeeklyCalendar && s.day_of_week !== selectedCalendarDay);

  const renderStepItem = ({ item, drag, isActive }: RenderItemParams<any>) => (
    <ScaleDecorator>
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.stepItem,
          { borderColor: theme.border, backgroundColor: theme.surface },
          isActive && { backgroundColor: theme.surfaceElevated, transform: [{ scale: 1.02 }], zIndex: 10, shadowOpacity: 0.1, shadowRadius: 10 }
        ]}
      >
        <Text style={styles.stepEmoji}>{item.emoji}</Text>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>{item.title}</Text>
          {item.start_time && (
            <Text style={[styles.stepStartTime, { color: theme.textSecondary }]}>
              <FontAwesome name="clock-o" size={12} color={theme.textSecondary} /> {item.start_time}
            </Text>
          )}
        </View>
        <Text style={[styles.stepDuration, { color: theme.textMuted, marginRight: 10 }]}>{Math.round(item.duration_in_seconds / 60)} min</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
          <TouchableOpacity onPressIn={drag} style={{ padding: 8 }}>
            <FontAwesome name="bars" size={18} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRemoveStep(item.id)} style={{ padding: 8 }}>
            <FontAwesome name="times-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <DraggableFlatList
        data={visibleSteps}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => setSteps([...data, ...hiddenSteps])}
        renderItem={renderStepItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom CTA */}
      <Pressable
        style={[styles.createButton, { backgroundColor: theme.maroon }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.createButtonText}>CREATE ROUTINE</Text>
        )}
      </Pressable>

      <AddRoutineStepModal
        visible={showStepModal}
        onClose={() => setShowStepModal(false)}
        onSelectStep={handleAddStep}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  totalBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  totalBadgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  nameInput: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  charCount: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: Spacing.lg,
  },
  scheduleCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: 'transparent',
  },
  scheduleLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  scheduleSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  scheduleValue: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    backgroundColor: 'transparent',
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  dayPillText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  orText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  flexibleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  stepsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepsCount: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  reorderHint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontStyle: 'italic',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  stepEmoji: {
    fontSize: 24,
    marginEnd: Spacing.md,
  },
  stepTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  stepDuration: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  stepStartTime: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  addStepDashed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: Spacing.lg,
  },
  addStepText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  createButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    paddingVertical: 18,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  createButtonText: {
    fontFamily: Fonts.black,
    color: '#FFF',
    fontSize: 16,
    letterSpacing: 1,
  },
  presetScroll: {
    flexGrow: 0,
    marginBottom: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  categoryPillText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
});
