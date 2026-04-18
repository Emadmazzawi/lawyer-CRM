import React from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { View, Text } from './Themed';
import { Spacing, Fonts } from '@/constants/Theme';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

// Helper to calculate end time
function calculateEndTime(startTime: string, durationSeconds: number) {
  if (!startTime || !startTime.includes(':')) return null;
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Math.floor(durationSeconds / 60);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

interface StepItemProps {
  step: {
    id: string;
    title: string;
    emoji?: string;
    start_time?: string | null;
    duration_in_seconds?: number;
  };
  isDone: boolean;
  onToggle: (stepId: string) => void;
  onDelete: (stepId: string) => void;
}

export const StepItem = React.memo(({ step, isDone, onToggle, onDelete }: StepItemProps) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle(step.id);
  };

  return (
    <View style={[styles.stepRow, { borderTopColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.stepTitleArea}
        onPress={handleToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={[styles.stepCheck, { borderColor: theme.border }, isDone && { backgroundColor: theme.maroon, borderColor: theme.maroon }]}>
          {isDone && <FontAwesome name="check" size={8} color="#FFF" />}
        </View>
        <Text style={styles.stepEmoji}>{step.emoji || '✨'}</Text>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Text style={[styles.stepTitle, { color: theme.textSecondary }, isDone && styles.doneText]}>{step.title}</Text>
          {step.start_time && step.duration_in_seconds !== undefined && (
            <Text style={[styles.stepTimeText, { color: theme.textMuted }, isDone && styles.doneText]}>
              {step.start_time} - {calculateEndTime(step.start_time, step.duration_in_seconds)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => onDelete(step.id)} 
        style={styles.stepDelete} 
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        activeOpacity={0.6}
      >
        <FontAwesome name="times" size={14} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  stepRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: Spacing.lg, 
    borderTopWidth: 1, 
    backgroundColor: 'transparent' 
  },
  stepTitleArea: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    backgroundColor: 'transparent' 
  },
  stepCheck: { 
    width: 18, 
    height: 18, 
    borderRadius: 9, 
    borderWidth: 1.5, 
    marginEnd: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  stepEmoji: { 
    fontSize: 18, 
    marginEnd: 10 
  },
  stepTitle: { 
    fontSize: 15, 
    fontFamily: Fonts.medium 
  },
  stepTimeText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  stepDelete: { 
    padding: 10,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: { 
    textDecorationLine: 'line-through', 
    opacity: 0.5 
  },
});
