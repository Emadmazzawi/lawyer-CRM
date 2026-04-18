import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions, ScrollView, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchRoutineById, Routine, RoutineStep, toggleRoutineCompletion } from '@/src/api/routines';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { format } from 'date-fns';
import { View, Text, Card, PrimaryButton } from '@/components/Themed';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  FadeIn,
  FadeInDown,
  SlideInRight,
  SlideOutLeft,
  withSpring
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
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
  const [isDeepFocus, setIsDeepFocus] = useState(false);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progress = useSharedValue(1);

  useEffect(() => {
    const loadRoutine = async () => {
      if (!id || Array.isArray(id)) return;
      const { data, error } = await fetchRoutineById(id);
      if (error || !data) {
        Alert.alert(t('common.error'), t('routines.loadError', 'Could not load the routine.'));
        router.back();
        return;
      }
      
      const currentDayValue = new Date().getDay();
      const dailySteps = data.steps.filter(s => s.day_of_week === null || s.day_of_week === currentDayValue);

      setRoutine(data.routine);
      setSteps(dailySteps);
      if (dailySteps.length > 0) {
        setTimeLeft(dailySteps[0].duration_in_seconds);
      }
      setLoading(false);
    };
    loadRoutine();
  }, [id, t, router]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          const currentDuration = steps[currentStepIndex].duration_in_seconds;
          progress.value = withTiming(newTime / currentDuration, { duration: 1000 });
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, currentStepIndex, steps]);

  const handleNextStep = async () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeLeft(steps[nextIndex].duration_in_seconds);
      progress.value = 1;
      setIsRunning(true);
    } else {
      if (id && typeof id === 'string') {
        await toggleRoutineCompletion(id);
      }
      Alert.alert(t('routines.congrats', 'Congrats! 🎉'), t('routines.finishedMsg', 'You have finished this routine.'), [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setTimeLeft(steps[prevIndex].duration_in_seconds);
      progress.value = 1;
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

  const handleCloseRunning = () => {
    if (isDeepFocus && isRunning) {
      Alert.alert(
        t('routines.deepFocusWarning', 'Deep Focus Active'),
        t('routines.deepFocusMessage', 'You are in Deep Focus mode. Are you sure you want to exit?'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          { text: t('common.exit', 'Exit'), style: 'destructive', onPress: () => {
              setIsRunning(false);
              setMode('preview');
            } 
          }
        ]
      );
    } else {
      setIsRunning(false);
      setMode('preview');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(interpolate(progress.value, [0, 0.1], [0.5, 1])),
      transform: [{ scale: withSpring(interpolate(progress.value, [0, 1], [0.95, 1])) }]
    };
  });

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
      backgroundColor: progress.value < 0.2 ? theme.danger : theme.maroon
    };
  });

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
        <Text style={[styles.errorText, { color: theme.text }]}>{t('routines.noSteps', 'This routine has no steps.')}</Text>
      </View>
    );
  }

  const totalMinutes = steps.reduce((sum, s) => sum + Math.round(s.duration_in_seconds / 60), 0);
  const firstEmoji = steps[0]?.emoji || '📝';
  const finishTime = format(new Date(Date.now() + totalMinutes * 60 * 1000), 'h:mm a');

  if (mode === 'preview') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <FontAwesome name="angle-down" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.nextRoutineLabel, { color: theme.textSecondary }]}>{t('routines.preview', 'Routine Preview')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
          <View style={styles.emojiRingContainer}>
            <Animated.View entering={FadeIn.duration(800)} style={[styles.emojiRing, { borderColor: theme.border }]}>
              <View style={[styles.emojiInner, { backgroundColor: theme.surfaceElevated }]}>
                <Text style={styles.bigEmoji}>{firstEmoji}</Text>
              </View>
            </Animated.View>
            <View style={[styles.startNowBadge, { backgroundColor: theme.maroon }]}>
              <Text style={styles.startNowText}>{t('routines.startNow', 'Start now')}</Text>
            </View>
          </View>

          <Text style={[styles.previewTitle, { color: theme.text }]}>{routine.title}</Text>
          <Text style={[styles.previewSub, { color: theme.textSecondary }]}>{steps.length} steps · {totalMinutes} min</Text>

          <View style={styles.previewStepsList}>
            {steps.map((item, index) => (
              <Animated.View 
                key={item.id} 
                entering={FadeInDown.delay(index * 100)}
                style={[styles.previewStepRow, { borderBottomColor: theme.border }]}
              >
                <Text style={styles.previewStepEmoji}>{item.emoji || '📝'}</Text>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text style={[styles.previewStepTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.previewStepDuration, { color: theme.textSecondary }]}>{Math.round(item.duration_in_seconds / 60)} min</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md, backgroundColor: 'transparent' }}>
            <View style={[styles.bottomPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={styles.bottomPillEmoji}>{firstEmoji}</Text>
              <Text style={[styles.bottomPillText, { color: theme.text }]}>{routine.title}</Text>
            </View>
            <View style={[styles.bottomPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.bottomPillText, { color: theme.textSecondary }]}>{t('routines.finishAt', { time: finishTime })}</Text>
            </View>
          </View>

          <View style={styles.deepFocusRow}>
            <Text style={[styles.deepFocusLabel, { color: theme.text }]}>{t('routines.deepFocusMode', 'Deep Focus Mode')}</Text>
            <Switch 
              value={isDeepFocus} 
              onValueChange={setIsDeepFocus} 
              trackColor={{ true: theme.maroon, false: theme.border }} 
              thumbColor="#fff" 
            />
          </View>

          <PrimaryButton 
            title={t('routines.startRoutine', 'START ROUTINE')}
            onPress={startRoutine}
          />
        </View>
      </View>
    );
  }

  const currentStep = steps[currentStepIndex];
  const progressText = t('routines.stepCount', { current: currentStepIndex + 1, total: steps.length });

  return (
    <View style={[styles.container, { backgroundColor: theme.background, padding: Spacing.lg }]}>
      <View style={styles.runningHeader}>
        <TouchableOpacity onPress={handleCloseRunning} style={styles.iconBtn}>
          <FontAwesome name="close" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', backgroundColor: 'transparent' }}>
          <Text style={[styles.routineRunTitle, { color: theme.textSecondary }]}>{routine.title}</Text>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>{progressText}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.progressBackground, { backgroundColor: theme.border }]}>
        <Animated.View style={[styles.progressBar, progressBarStyle]} />
      </View>

      <View style={styles.runningContent}>
        <Animated.View 
          key={currentStep.id} 
          entering={SlideInRight} 
          exiting={SlideOutLeft}
          style={{ alignItems: 'center', backgroundColor: 'transparent' }}
        >
          <Text style={styles.runningEmoji}>{currentStep.emoji || '📝'}</Text>
          <Text style={[styles.stepName, { color: theme.text }]}>{currentStep.title}</Text>
          {currentStepIndex < steps.length - 1 && (
            <Text style={[styles.nextUpText, { color: theme.textSecondary }]}>
              {t('routines.nextUp', 'Next: ')} {steps[currentStepIndex + 1].title}
            </Text>
          )}
        </Animated.View>

        <View style={{ alignItems: 'center', marginVertical: 40, backgroundColor: 'transparent' }}>
          <Animated.View style={[styles.timerRing, { borderColor: timeLeft === 0 ? theme.success : theme.border }, timerAnimatedStyle]}>
            <Text style={[styles.timerText, { color: timeLeft === 0 ? theme.success : theme.text }]}>{formatTime(timeLeft)}</Text>
          </Animated.View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        {!isDeepFocus ? (
          <TouchableOpacity
            style={[styles.smallBtn, currentStepIndex === 0 && { opacity: 0.2 }]}
            onPress={handlePrevStep}
            disabled={currentStepIndex === 0}
          >
            <FontAwesome name="backward" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.smallBtn} />
        )}

        <TouchableOpacity 
          style={[styles.playPauseBtn, { backgroundColor: theme.maroon }]} 
          onPress={toggleTimer}
          activeOpacity={0.9}
        >
          <FontAwesome
            name={timeLeft === 0 ? 'step-forward' : isRunning ? 'pause' : 'play'}
            size={28}
            color="#FFF"
            style={isRunning || timeLeft === 0 ? {} : { marginStart: 4 }}
          />
        </TouchableOpacity>

        {!isDeepFocus ? (
          <TouchableOpacity
            style={[styles.smallBtn]}
            onPress={handleNextStep}
          >
            <FontAwesome name="forward" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.smallBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: Fonts.bold, fontSize: 18 },
  container: { flex: 1 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Preview ──
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: 'transparent',
  },
  nextRoutineLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  emojiRingContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
    backgroundColor: 'transparent',
  },
  emojiRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigEmoji: {
    fontSize: 64,
  },
  startNowBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    marginTop: -20,
  },
  startNowText: {
    fontFamily: Fonts.bold,
    color: '#FFF',
    fontSize: 14,
  },
  previewTitle: {
    fontFamily: Fonts.black,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 4,
  },
  previewSub: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  previewStepsList: {
    paddingHorizontal: Spacing.xl,
    backgroundColor: 'transparent',
  },
  previewStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  previewStepEmoji: {
    fontSize: 32,
    marginEnd: Spacing.lg,
  },
  previewStepTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  previewStepDuration: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  bottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    gap: 8,
  },
  bottomPillEmoji: {
    fontSize: 16,
  },
  bottomPillText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  deepFocusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: Spacing.xl,
  },
  deepFocusLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },

  // ── Running Mode ──
  runningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  routineRunTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  progressText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  progressBackground: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 40,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  runningContent: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  runningEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  stepName: {
    fontFamily: Fonts.black,
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  nextUpText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  timerRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontFamily: Fonts.black,
    fontSize: 84,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  smallBtn: { 
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
