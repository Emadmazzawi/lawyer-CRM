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
  const [steps, setSteps] = useState<{ emoji: string; title: string; duration_in_seconds: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);

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

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleAddStep = (step: { emoji: string; title: string; duration_in_seconds: number }) => {
    setSteps(prev => [...prev, step]);
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <View style={{ marginBottom: Spacing.sm }}>
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
              <FontAwesome name="bell" size={18} color={theme.textSecondary} style={{ marginRight: 12 }} />
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

        {/* Steps */}
        <View style={styles.stepsHeaderRow}>
          <Text style={[styles.stepsCount, { color: theme.text }]}>{steps.length} steps</Text>
          <Text style={[styles.reorderHint, { color: theme.textMuted }]}>Press & hold step to reorder</Text>
        </View>

        {steps.map((step, index) => (
          <View key={index} style={[styles.stepItem, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={styles.stepEmoji}>{step.emoji}</Text>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
            </View>
            <Text style={[styles.stepDuration, { color: theme.textMuted }]}>{Math.round(step.duration_in_seconds / 60)} min</Text>
            <TouchableOpacity onPress={() => handleRemoveStep(index)} style={{ paddingLeft: 10 }}>
              <FontAwesome name="times-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Step (dashed) */}
        <TouchableOpacity
          style={[styles.addStepDashed, { backgroundColor: theme.background, borderColor: theme.border }]}
          onPress={() => setShowStepModal(true)}
        >
          <FontAwesome name="plus" size={14} color={theme.textMuted} style={{ marginRight: 8 }} />
          <Text style={[styles.addStepText, { color: theme.textMuted }]}>Add step</Text>
        </TouchableOpacity>

      </ScrollView>

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
    color: '#111827',
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  stepEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  stepTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  stepDuration: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  addStepDashed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#111827',
    alignItems: 'center',
    shadowColor: '#000',
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
