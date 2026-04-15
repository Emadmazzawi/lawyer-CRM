import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Spacing, BorderRadius, Fonts } from '@/constants/Theme';
import { useTranslation } from 'react-i18next';
import { View, Text, Card } from './Themed';

interface StatItemProps {
  label: string;
  value: number;
  icon: any;
  theme: any;
}

const StatItem = ({ label, value, icon, theme }: StatItemProps) => (
  <Card style={[styles.statItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
    <View style={[styles.iconContainer, { backgroundColor: theme.maroonSoft }]}>
      <FontAwesome name={icon} size={18} color={theme.maroon} />
    </View>
    <View style={styles.statTextContainer}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1}>{label}</Text>
    </View>
  </Card>
);

export const SummaryWidget = ({ stats, theme }: { stats: any; theme: any }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatItem 
          label={t('dashboard.stats.activeCountdowns', 'Countdowns')} 
          value={stats?.activeCountdowns || 0} 
          icon="hourglass-half" 
          theme={theme} 
        />
        <StatItem 
          label={t('dashboard.stats.upcomingEvents', 'Events')} 
          value={stats?.upcomingEvents || 0} 
          icon="calendar" 
          theme={theme} 
        />
      </View>
      <View style={[styles.row, { marginTop: Spacing.md }]}>
        <StatItem 
          label={t('dashboard.stats.totalClients', 'Clients')} 
          value={stats?.totalClients || 0} 
          icon="users" 
          theme={theme} 
        />
        <StatItem 
          label={t('dashboard.stats.completedRoutines', 'Done')} 
          value={stats?.completedRoutines || 0} 
          icon="check-circle" 
          theme={theme} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: 'transparent',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    elevation: 0, // Cards inside SummaryWidget don't need elevation if they have borders
    shadowOpacity: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: Spacing.sm,
  },
  statTextContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    lineHeight: 24,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
});
