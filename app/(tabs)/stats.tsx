import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { View, Text } from '@/components/Themed';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { fetchAllRoutineCompletions } from '@/src/api/stats';
import { format, subDays, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SQUARE_SIZE = 14;
const SQUARE_MARGIN = 4;
const WEEKS_TO_SHOW = 20;

export default function StatsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [completions, setCompletions] = useState<{ date_string: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const { data } = await fetchAllRoutineCompletions();
    if (data) setCompletions(data);
    setLoading(false);
  };

  const { currentStreak, longestStreak, totalCompletions, completedDatesSet } = useMemo(() => {
    if (!completions.length) return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completedDatesSet: new Set<string>() };

    const dates = completions.map(c => c.date_string);
    const uniqueDates = [...new Set(dates)].sort(); // Sorted oldest to newest
    const completedDatesSet = new Set(uniqueDates);

    let currStreak = 0;
    let maxStreak = 0;
    let tempStreak = 1;
    
    if (uniqueDates.length > 0) {
      maxStreak = 1;
      // Calculate Longest Streak
      for (let i = 1; i < uniqueDates.length; i++) {
        const diff = differenceInDays(parseISO(uniqueDates[i]), parseISO(uniqueDates[i-1]));
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      }
    }

    // Calculate Current Streak
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    let checkDate = new Date();
    
    if (completedDatesSet.has(todayStr)) {
      // Streak includes today
    } else if (completedDatesSet.has(yesterdayStr)) {
      // Streak continues from yesterday
      checkDate = subDays(new Date(), 1); 
    } else {
      // No active streak
      currStreak = 0;
      return { currentStreak: currStreak, longestStreak: maxStreak, totalCompletions: completions.length, completedDatesSet };
    }
    
    let checkDateStr = format(checkDate, 'yyyy-MM-dd');
    while (completedDatesSet.has(checkDateStr)) {
      currStreak++;
      checkDate = subDays(checkDate, 1);
      checkDateStr = format(checkDate, 'yyyy-MM-dd');
    }

    return { currentStreak: currStreak, longestStreak: maxStreak, totalCompletions: completions.length, completedDatesSet };
  }, [completions]);

  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // 7 days * WEEKS_TO_SHOW
    const totalDays = 7 * WEEKS_TO_SHOW;
    for (let i = totalDays - 1; i >= 0; i--) {
      days.push(subDays(today, i));
    }
    return days;
  }, []);

  const getHeatmapColor = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = completions.filter(c => c.date_string === dateStr).length;
    if (count === 0) return theme.surfaceElevated;
    if (count === 1) return theme.maroonSoft;
    if (count === 2) return theme.maroon;
    return theme.maroon; // can add more shades if desired
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.maroon} />
      </View>
    );
  }

  // Group days into columns for the heatmap
  const columns = [];
  for (let i = 0; i < heatmapDays.length; i += 7) {
    columns.push(heatmapDays.slice(i, i + 7));
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Your Stats</Text>
      
      {/* Streaks Container */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <FontAwesome name="fire" size={24} color={theme.maroon} style={{ marginBottom: 8 }} />
          <Text style={[styles.statValue, { color: theme.text }]}>{currentStreak}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <FontAwesome name="trophy" size={24} color="#F59E0B" style={{ marginBottom: 8 }} />
          <Text style={[styles.statValue, { color: theme.text }]}>{longestStreak}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Longest Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <FontAwesome name="check-circle" size={24} color={theme.success} style={{ marginBottom: 8 }} />
          <Text style={[styles.statValue, { color: theme.text }]}>{totalCompletions}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Routines</Text>
        </View>
      </View>

      {/* Heatmap */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Consistency Heatmap</Text>
      <View style={[styles.heatmapContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heatmapScroll}>
          {columns.map((col, colIndex) => (
            <View key={colIndex} style={styles.heatmapColumn}>
              {col.map((day, dayIndex) => {
                const isTod = isSameDay(day, new Date());
                return (
                  <View
                    key={dayIndex}
                    style={[
                      styles.heatmapSquare,
                      { backgroundColor: getHeatmapColor(day) },
                      isTod && { borderColor: theme.text, borderWidth: 1 }
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>
        <View style={styles.heatmapLegend}>
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Less</Text>
          <View style={[styles.legendSquare, { backgroundColor: theme.surfaceElevated }]} />
          <View style={[styles.legendSquare, { backgroundColor: theme.maroonSoft }]} />
          <View style={[styles.legendSquare, { backgroundColor: theme.maroon }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>More</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  headerTitle: { fontFamily: Fonts.black, fontSize: 32, marginBottom: Spacing.xl },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: Fonts.black,
    fontSize: 28,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginTop: 4,
  },
  
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    marginBottom: Spacing.md,
  },
  heatmapContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  heatmapScroll: {
    flexDirection: 'row',
  },
  heatmapColumn: {
    flexDirection: 'column',
    marginRight: SQUARE_MARGIN,
  },
  heatmapSquare: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 4,
    marginBottom: SQUARE_MARGIN,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.lg,
    gap: 6,
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginHorizontal: 4,
  },
});
