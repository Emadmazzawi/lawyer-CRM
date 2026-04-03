import { StyleSheet, FlatList, Dimensions, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getEventsTasks, EventTask, deleteEventTask, updateEventTask } from '@/src/api/events_and_tasks';
import { getCurrentUser } from '@/src/api/auth';
import { getProfile, Profile } from '@/src/api/profiles';
import Animated, { FadeInDown, FadeInRight, Layout, FadeIn } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { useTranslation } from 'react-i18next';

import { useRouter, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

const EventItem = React.memo(({ item, index, formatDate, onDelete, onComplete, theme, t }: { item: Partial<EventTask>; index: number; formatDate: (date: string | null) => string; onDelete: (id: string) => void; onComplete: (id: string) => void; theme: any; t: any }) => (
  <Animated.View 
    entering={FadeInDown.delay(index * 50).duration(500)}
    layout={Layout.springify()}
    style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
  >
    <View style={[styles.iconContainer, { backgroundColor: item.type === 'calendar_event' ? theme.maroonSoft : '#F3E5F5' }]}>
      <FontAwesome 
        name={item.type === 'calendar_event' ? 'calendar' : 'clock-o'} 
        size={20} 
        color={item.type === 'calendar_event' ? theme.maroon : '#7B1FA2'} 
      />
    </View>
    <View style={styles.cardContent}>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{formatDate(item.due_date ?? null)}</Text>
    </View>
    
    <View style={styles.actionGroup}>
      <TouchableOpacity onPress={() => onComplete(item.id!)} style={styles.actionButton}>
        <FontAwesome name="check-circle-o" size={24} color={theme.success} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(item.id!)} style={[styles.actionButton, { marginLeft: Spacing.md }]}>
        <FontAwesome name="trash-o" size={22} color={theme.danger} />
      </TouchableOpacity>
    </View>
  </Animated.View>
));

const CountdownItem = React.memo(({ item, index, formatDate, onDelete, onComplete, theme, t }: { item: Partial<EventTask>; index: number; formatDate: (date: string | null) => string; onDelete: (id: string) => void; onComplete: (id: string) => void; theme: any, t: any }) => {
  const daysLeft = useMemo(() => {
    if (!item.due_date) return null;
    const diff = differenceInDays(new Date(item.due_date), new Date());
    return diff;
  }, [item.due_date]);

  return (
    <Animated.View 
      entering={FadeInRight.delay(index * 75).duration(600)}
      style={[styles.countdownCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={styles.countdownHeader}>
        <Text style={[styles.countdownTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => onDelete(item.id!)}>
           <FontAwesome name="times-circle" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.countdownBody}>
        {daysLeft !== null && (
          <View style={[styles.daysBadge, { backgroundColor: daysLeft <= 3 ? theme.accentSoft : theme.maroonSoft }]}>
            <Text style={[styles.daysText, { color: daysLeft <= 3 ? theme.danger : theme.maroon }]}>
              {daysLeft < 0 ? t('dashboard.overdue') : t('dashboard.daysLeft', { days: daysLeft })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.countdownFooter}>
        <View style={styles.countdownDateGroup}>
          <FontAwesome name="calendar-o" size={12} color={theme.textSecondary} />
          <Text style={[styles.countdownDate, { color: theme.textMuted }]}>{formatDate(item.due_date ?? null)}</Text>
        </View>
        <TouchableOpacity onPress={() => onComplete(item.id!)}>
          <FontAwesome name="check-circle" size={24} color={theme.success} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export default function DashboardScreen() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Partial<EventTask>[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    const { data: userData } = await getCurrentUser();
    if (userData?.user) {
      const { data: profileData } = await getProfile(userData.user.id);
      if (profileData) setProfile(profileData);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 17) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  }, [t]);

  const loadDashboardData = async () => {
    setLoading(true);
    const { data } = await getEventsTasks(0, 20);
    if (data) {
      setEvents(data);
      setHasMore(data.length === 20);
    }
    setLoading(false);
  };

  const loadMoreData = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    const { data } = await getEventsTasks(nextPage, 20);
    if (data && data.length > 0) {
      setEvents(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === 20);
    } else {
      setHasMore(false);
    }
    setIsFetchingMore(false);
  };

  const handleComplete = async (id: string) => {
    const { error } = await updateEventTask(id, { is_completed: true });
    if (!error) loadDashboardData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteEventTask(id);
    if (!error) loadDashboardData();
  };

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr) return 'No date set';
    try {
      return format(new Date(dateStr), 'MMM d, h:mm a');
    } catch (e) {
      return dateStr;
    }
  }, []);

  const renderEventItem = useCallback(({ item, index }: { item: Partial<EventTask>; index: number }) => (
    <EventItem 
      item={item} 
      index={index} 
      formatDate={formatDate} 
      onDelete={handleDelete}
      onComplete={handleComplete}
      theme={theme}
      t={t}
    />
  ), [formatDate, theme, t]);

  const renderCountdownItem = useCallback(({ item, index }: { item: Partial<EventTask>; index: number }) => (
    <CountdownItem 
      item={item} 
      index={index} 
      formatDate={formatDate} 
      onDelete={handleDelete}
      onComplete={handleComplete}
      theme={theme}
      t={t}
    />
  ), [formatDate, theme, t]);

  const countdowns = useMemo(() => events.filter(e => e.type === 'countdown'), [events]);
  const upcomingEvents = useMemo(() => events.filter(e => e.type === 'calendar_event'), [events]);

  const LoadingSkeleton = () => (
    <View style={{ paddingHorizontal: 20 }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <Skeleton width={44} height={44} borderRadius={12} />
          <View style={[styles.cardContent, { marginLeft: 15 }]}>
            <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeInDown.duration(800)} style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting},</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{profile?.full_name || 'Legal Professional'}</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dashboard.activeCountdowns')}</Text>
          {countdowns.length > 0 && (
            <Pressable onPress={() => router.push('/reminders')}>
              <Text style={[styles.seeAll, { color: theme.textSecondary }]}>{t('dashboard.seeFullList')}</Text>
            </Pressable>
          )}
        </View>
        
        {loading ? (
          <View style={{ flexDirection: 'row', paddingLeft: 20 }}>
            <Skeleton width={width * 0.7} height={120} borderRadius={24} style={{ marginRight: 15 }} />
            <Skeleton width={width * 0.7} height={120} borderRadius={24} />
          </View>
        ) : countdowns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState 
              icon="hourglass-start" 
              title={t('dashboard.noDeadlines')} 
              message="Keep track of your case deadlines and court dates with countdown cards."
              onPress={() => router.push('/create-event?type=countdown')}
              actionLabel={t('dashboard.addDeadline')}
            />
          </View>
        ) : (
          <FlatList
            data={countdowns}
            renderItem={renderCountdownItem}
            keyExtractor={item => item.id!}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dashboard.upcomingEvents')}</Text>
          {upcomingEvents.length > 0 && (
            <Pressable onPress={() => router.push('/completed')}>
              <Text style={[styles.seeAll, { color: theme.textSecondary }]}>{t('dashboard.pastArchive')}</Text>
            </Pressable>
          )}
        </View>
        
        {loading ? (
          <LoadingSkeleton />
        ) : upcomingEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState 
              icon="calendar-check-o" 
              title={t('dashboard.noEvents')} 
              message="Schedule consultations, hearings, and meetings to see them listed here."
              onPress={() => router.push('/create-event?type=calendar_event')}
              actionLabel={t('dashboard.addEvent')}
            />
          </View>
        ) : (
          <FlatList
            data={upcomingEvents}
            renderItem={renderEventItem}
            keyExtractor={item => item.id!}
            contentContainerStyle={styles.verticalList}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.5}
            ListFooterComponent={isFetchingMore ? <Skeleton width="100%" height={50} style={{ marginVertical: 10 }} /> : null}
          />
        )}
      </ScrollView>

      <Animated.View entering={FadeIn.delay(1000)} style={styles.fabContainer}>
        <Pressable 
          style={[styles.fab, { backgroundColor: theme.maroon }]}
          onPress={() => router.push('/create-event')}
        >
          <FontAwesome name="plus" size={24} color="#FFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  greeting: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userName: {
    fontFamily: Fonts.black,
    fontSize: 28,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
  },
  seeAll: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  emptyContainer: {
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'transparent',
  },
  horizontalList: {
    paddingStart: Spacing.lg,
    paddingEnd: 10,
    backgroundColor: 'transparent',
  },
  countdownCard: {
    width: width * 0.7,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginEnd: Spacing.md,
    borderWidth: 1,
  },
  countdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  countdownTitle: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginEnd: Spacing.sm,
  },
  daysBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  daysText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  countdownFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  countdownDate: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginStart: Spacing.sm,
  },
  verticalList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    backgroundColor: 'transparent',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  countdownBody: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  countdownDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  actionButton: {
    padding: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginStart: Spacing.md,
    backgroundColor: 'transparent',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginTop: 2,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    end: Spacing.xl,
    zIndex: 100,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
