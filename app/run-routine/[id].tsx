import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Text, View, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchRoutineById, Routine, RoutineStep } from '@/src/api/routines';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { format } from 'date-fns';

type ScreenMode = 'preview' | 'running';

export default function RunRoutineScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ScreenMode>('preview');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadRoutine = async () => {
      if (!id || Array.isArray(id)) return;
      const { data, error } = await fetchRoutineById(id);
      if (error || !data) {
        Alert.alert('Error', 'Could not load the routine.');
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
  }, [id]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
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
      Alert.alert('Congrats! 🎉', 'You have finished this routine.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
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

  const startRoutine = () => {
    setMode('running');
    setIsRunning(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !routine) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4A7BF7" />
      </View>
    );
  }

  if (steps.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>This routine has no steps.</Text>
      </View>
    );
  }

  const totalMinutes = steps.reduce((sum, s) => sum + Math.round(s.duration_in_seconds / 60), 0);
  const firstEmoji = steps[0]?.emoji || '📝';
  const finishTime = format(new Date(Date.now() + totalMinutes * 60 * 1000), 'h:mm a');

  // ── PREVIEW MODE ──
  if (mode === 'preview') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Close */}
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome name="angle-down" size={28} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.nextRoutineLabel, { color: theme.textMuted }]}>Next Routine</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Big Emoji Ring */}
        <View style={styles.emojiRingContainer}>
          <View style={[styles.emojiRing, { borderColor: '#4A7BF7' }]}>
            <View style={[styles.emojiInner, { backgroundColor: '#E8EEFF' }]}>
              <Text style={styles.bigEmoji}>{firstEmoji}</Text>
            </View>
          </View>
          <View style={[styles.startNowBadge, { backgroundColor: '#4A7BF7' }]}>
            <Text style={styles.startNowText}>Start now</Text>
          </View>
        </View>

        {/* Title & Info */}
        <Text style={[styles.previewTitle, { color: theme.text }]}>{routine.title}</Text>
        <Text style={[styles.previewSub, { color: theme.textMuted }]}>{steps.length} steps · {totalMinutes} min</Text>

        {/* Steps List */}
        <FlatList
          data={steps}
          keyExtractor={(s) => s.id}
          style={styles.previewStepsList}
          renderItem={({ item }) => (
            <View style={[styles.previewStepRow, { borderBottomColor: theme.border }]}>
              <Text style={styles.previewStepEmoji}>{item.emoji || '📝'}</Text>
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={[styles.previewStepTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.previewStepDuration, { color: theme.textMuted }]}>{Math.round(item.duration_in_seconds / 60)} min</Text>
              </View>
            </View>
          )}
        />

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
            <View style={[styles.bottomPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={styles.bottomPillEmoji}>{firstEmoji}</Text>
              <Text style={[styles.bottomPillText, { color: theme.text }]}>{routine.title}</Text>
            </View>
            <View style={[styles.bottomPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.bottomPillText, { color: theme.textSecondary }]}>Finish at {finishTime}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.startButton, { backgroundColor: '#4A7BF7' }]} onPress={startRoutine}>
            <Text style={styles.startButtonText}>START ROUTINE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── RUNNING MODE ──
  const currentStep = steps[currentStepIndex];
  const progressText = `Step ${currentStepIndex + 1} / ${steps.length}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'space-between', padding: Spacing.lg }]}>
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <Text style={[styles.routineRunTitle, { color: theme.textSecondary }]}>{routine.title}</Text>
        <Text style={[styles.progressText, { color: theme.textMuted }]}>{progressText}</Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text style={styles.runningEmoji}>{currentStep.emoji || '📝'}</Text>
        <Text style={[styles.stepName, { color: theme.text }]}>{currentStep.title}</Text>
        {currentStepIndex < steps.length - 1 && (
          <Text style={[styles.nextUpText, { color: theme.textMuted }]}>
            Next: {steps[currentStepIndex + 1].title}
          </Text>
        )}
      </View>

      <View style={{ alignItems: 'center' }}>
        <View style={[styles.timerRing, { borderColor: timeLeft === 0 ? theme.success : '#4A7BF7', backgroundColor: theme.surface }]}>
          <Text style={[styles.timerText, { color: timeLeft === 0 ? theme.success : theme.text }]}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.smallBtn, currentStepIndex === 0 && { opacity: 0.2 }]}
          onPress={handlePrevStep}
          disabled={currentStepIndex === 0}
        >
          <FontAwesome name="backward" size={24} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.playPauseBtn, { backgroundColor: '#4A7BF7' }]} onPress={toggleTimer}>
          <FontAwesome
            name={timeLeft === 0 ? 'step-forward' : isRunning ? 'pause' : 'play'}
            size={28}
            color="#FFF"
            style={isRunning ? {} : { marginLeft: 4 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallBtn, currentStepIndex === steps.length - 1 && timeLeft > 0 && { opacity: 0.2 }]}
          onPress={handleNextStep}
        >
          <FontAwesome name="forward" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: Fonts.bold, fontSize: 18 },
  container: { flex: 1 },

  // ── Preview ──
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  nextRoutineLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  emojiRingContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  emojiRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigEmoji: {
    fontSize: 56,
  },
  startNowBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    marginTop: -16,
  },
  startNowText: {
    fontFamily: Fonts.bold,
    color: '#FFF',
    fontSize: 14,
  },
  previewTitle: {
    fontFamily: Fonts.black,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 4,
  },
  previewSub: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  previewStepsList: {
    paddingHorizontal: Spacing.lg,
  },
  previewStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  previewStepEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  previewStepTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  previewStepDuration: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  bottomBar: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  bottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    gap: 6,
  },
  bottomPillEmoji: {
    fontSize: 16,
  },
  bottomPillText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    shadowColor: '#4A7BF7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontFamily: Fonts.black,
    color: '#FFF',
    fontSize: 16,
    letterSpacing: 1,
  },

  // ── Running Mode ──
  routineRunTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  progressText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  runningEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  stepName: {
    fontFamily: Fonts.black,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  nextUpText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  timerRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontFamily: Fonts.black,
    fontSize: 72,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
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
  },
});
