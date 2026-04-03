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
    <View style={[styles.container, { backgroundColor: '#FAFAFA' }]}>
      <View style={styles.header}>
        <Text style={[styles.routineTitle, { color: '#111' }]}>{routine.title}</Text>
        <Text style={[styles.progressText, { color: '#888' }]}>{progressText}</Text>
      </View>

      <View style={styles.stepInfoContainer}>
        <Text style={[styles.stepTitle, { color: '#111' }]} numberOfLines={2}>
          {currentStep.title}
        </Text>
        {currentStepIndex < steps.length - 1 && (
          <Text style={[styles.nextStepText, { color: '#AAA' }]}>
            {t('routines.nextUp', 'Next up:')} {steps[currentStepIndex + 1].title}
          </Text>
        )}
      </View>

      <View style={styles.timerContainer}>
        <View style={styles.timerRing}>
          <Text style={[styles.timerText, { color: timeLeft === 0 ? '#d9534f' : '#111' }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.smallBtn, currentStepIndex === 0 && { opacity: 0.2 }]} 
          onPress={handlePrevStep}
          disabled={currentStepIndex === 0}
        >
          <FontAwesome name="backward" size={24} color="#111" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.playPauseBtn, { backgroundColor: '#111' }]} 
          onPress={toggleTimer}
        >
          <FontAwesome 
            name={timeLeft === 0 ? "step-forward" : (isRunning ? "pause" : "play")} 
            size={28} 
            color="#FFF" 
            style={isRunning ? {} : { marginLeft: 4 }}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.smallBtn, currentStepIndex === steps.length - 1 && timeLeft > 0 && { opacity: 0.2 }]} 
          onPress={handleNextStep}
        >
          <FontAwesome name="forward" size={24} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, fontWeight: '700' },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: 40 },
  routineTitle: { fontSize: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  progressText: { fontSize: 14, fontWeight: '600' },
  stepInfoContainer: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  stepTitle: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 12, lineHeight: 42, letterSpacing: -1 },
  nextStepText: { fontSize: 15 },
  timerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timerRing: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  timerText: { fontSize: 80, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 60,
  },
  smallBtn: { padding: 20 },
  playPauseBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
