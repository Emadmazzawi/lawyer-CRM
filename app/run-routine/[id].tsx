import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchRoutineById, Routine, RoutineStep } from '@/src/api/routines';

export default function RunRoutineScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadRoutine = async () => {
      if (!id || Array.isArray(id)) return;
      const { data, error } = await fetchRoutineById(id);
      if (error || !data) {
        Alert.alert(t('common.error', 'Error'), t('routines.loadError', 'Could not load the routine.'));
        router.back();
        return;
      }
      setRoutine(data.routine);
      setSteps(data.steps);
      if (data.steps.length > 0) {
        setTimeLeft(data.steps[0].duration_in_seconds);
      }
      setLoading(false);
    };
    loadRoutine();
  }, [id, router, t]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Step complete
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      // Play a sound here ideally, falling back to Alert/Auto-next
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeLeft(steps[nextIndex].duration_in_seconds);
      setIsRunning(true);
    } else {
      Alert.alert(
        t('routines.completeTitle', 'Congrats!'), 
        t('routines.completeDesc', 'You have finished this routine.'),
        [{ text: t('common.ok', 'OK'), onPress: () => router.back() }]
      );
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setTimeLeft(steps[prevIndex].duration_in_seconds);
      setIsRunning(false);
    }
  };

  const toggleTimer = () => {
    if (timeLeft > 0) {
      setIsRunning(!isRunning);
    } else if (timeLeft === 0) {
      handleNextStep();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !routine) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.maroon} />
      </View>
    );
  }

  if (steps.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          {t('routines.noSteps', 'This routine has no steps.')}
        </Text>
      </View>
    );
  }

  const currentStep = steps[currentStepIndex];
  const progressText = `${t('routines.step', 'Step')} ${currentStepIndex + 1} / ${steps.length}`;

  // Circular progress approximation using border radius
  const totalSeconds = currentStep.duration_in_seconds;
  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.routineTitle, { color: theme.text }]}>{routine.title}</Text>
        <Text style={[styles.progressText, { color: theme.maroon }]}>{progressText}</Text>
      </View>

      <View style={styles.stepInfoContainer}>
        <Text style={[styles.stepTitle, { color: theme.text }]} numberOfLines={2}>
          {currentStep.title}
        </Text>
        {currentStepIndex < steps.length - 1 && (
          <Text style={[styles.nextStepText, { color: '#888' }]}>
            {t('routines.nextUp', 'Next up:')} {steps[currentStepIndex + 1].title}
          </Text>
        )}
      </View>

      <View style={styles.timerContainer}>
        {/* Simple Ring Progress Visual */}
        <View style={[styles.timerRing, { borderColor: theme.maroonSoft }]}>
          <Text style={[styles.timerText, { color: timeLeft === 0 ? 'red' : theme.text }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.smallBtn, currentStepIndex === 0 && { opacity: 0.3 }]} 
          onPress={handlePrevStep}
          disabled={currentStepIndex === 0}
        >
          <FontAwesome name="backward" size={20} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.playPauseBtn, { backgroundColor: theme.maroon }]} 
          onPress={toggleTimer}
        >
          <FontAwesome 
            name={timeLeft === 0 ? "step-forward" : (isRunning ? "pause" : "play")} 
            size={32} 
            color="#FFF" 
            style={{ marginLeft: isRunning || timeLeft === 0 ? 0 : 6 }}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.smallBtn, currentStepIndex === steps.length - 1 && timeLeft > 0 && { opacity: 0.5 }]} 
          onPress={handleNextStep}
        >
          <FontAwesome name="forward" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, fontWeight: 'bold' },
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  routineTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  progressText: { fontSize: 16, fontWeight: '600' },
  stepInfoContainer: { alignItems: 'center', marginBottom: 40, height: 80, justifyContent: 'center' },
  stepTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  nextStepText: { fontSize: 16, fontStyle: 'italic' },
  timerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timerRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: { fontSize: 72, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 40,
  },
  smallBtn: { padding: 20 },
  playPauseBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});
