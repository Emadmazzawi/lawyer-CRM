import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, Pressable, View as RNView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { View, Text, Card } from './Themed';
import { Spacing, Fonts } from '@/constants/Theme';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { StepItem } from './StepItem';
import Animated, { FadeInDown, Layout, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

interface RoutineCardProps {
  routine: any;
  index: number;
  isDone: (id: string) => boolean;
  isStepDone: (id: string) => boolean;
  onToggleRoutine: (routine: any) => void;
  onToggleStep: (routineId: string, stepId: string) => void;
  onDeleteRoutine: (id: string) => void;
  onDeleteStep: (stepId: string) => void;
}

export const RoutineCard = React.memo(({ 
  routine, 
  index, 
  isDone, 
  isStepDone, 
  onToggleRoutine, 
  onToggleStep, 
  onDeleteRoutine, 
  onDeleteStep 
}: RoutineCardProps) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const done = isDone(routine.id);

  const stepsDoneCount = useMemo(() => {
    if (!routine.steps) return 0;
    return routine.steps.filter((s: any) => isStepDone(s.id)).length;
  }, [routine.steps, isStepDone]);

  const progress = routine.steps?.length > 0 ? (stepsDoneCount / routine.steps.length) * 100 : (done ? 100 : 0);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onToggleRoutine(routine);
  };

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${progress}%`, { damping: 15, stiffness: 100 }),
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 50)} layout={Layout.springify()}>
      <Card style={[styles.routineCard, { borderColor: theme.border }]}>
        <View style={styles.routineHeader}>
          <TouchableOpacity 
            style={styles.routineTitleArea} 
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <View style={[styles.checkCircle, { borderColor: theme.border }, done && { backgroundColor: theme.maroon, borderColor: theme.maroon }]}>
              {done && <FontAwesome name="check" size={10} color="#FFF" />}
            </View>
            <Text style={[styles.routineTitle, { color: theme.text }, done && styles.doneText]}>{routine.title}</Text>
          </TouchableOpacity>
          
          <RNView style={styles.headerActions}>
            <Pressable 
              onPress={() => {
                console.log('--- [Debug] Trash bin pressed for routine:', routine.id);
                onDeleteRoutine(routine.id);
              }} 
              style={({ pressed }) => [
                styles.actionBtn,
                { 
                  opacity: pressed ? 0.5 : 1,
                  backgroundColor: pressed ? theme.surfaceElevated : 'transparent' 
                }
              ]}
              hitSlop={20}
            >
              <FontAwesome name="trash-o" size={20} color={theme.danger} />
            </Pressable>
            <Pressable 
                onPress={() => {
                  console.log('--- [Debug] Play pressed for routine:', routine.id);
                  router.push(`/run-routine/${routine.id}`);
                }} 
                style={({ pressed }) => [
                  styles.actionBtn,
                  { 
                    opacity: pressed ? 0.5 : 1,
                    backgroundColor: pressed ? theme.surfaceElevated : 'transparent'
                  }
                ]}
                hitSlop={20}
            >
              <FontAwesome name="play" size={18} color={theme.maroon} />
            </Pressable>
          </RNView>
        </View>

        {routine.steps && routine.steps.length > 0 && (
          <View style={styles.stepsContainer}>
            {routine.steps.map((step: any) => (
              <StepItem 
                key={step.id} 
                step={step} 
                isDone={isStepDone(step.id)} 
                onToggle={(sid) => onToggleStep(routine.id, sid)}
                onDelete={onDeleteStep}
              />
            ))}
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { backgroundColor: theme.maroon }, progressStyle]} />
        </View>
      </Card>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  routineCard: { 
    borderRadius: 24, 
    borderWidth: 1, 
    marginBottom: Spacing.md, 
    overflow: 'hidden', 
    padding: 0 
  },
  routineHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: Spacing.lg, 
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  routineTitleArea: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    backgroundColor: 'transparent',
    paddingRight: 8,
  },
  checkCircle: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    borderWidth: 2, 
    marginEnd: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  routineTitle: { 
    fontSize: 18, 
    fontFamily: Fonts.bold 
  },
  headerActions: { 
    flexDirection: 'row', 
    gap: 8, 
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 100,
  },
  actionBtn: { 
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  stepsContainer: { 
    paddingBottom: 10, 
    backgroundColor: 'transparent' 
  },
  doneText: { 
    textDecorationLine: 'line-through', 
    opacity: 0.5 
  },
  progressContainer: {
    height: 3,
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  }
});
