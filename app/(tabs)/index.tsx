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
import { useTranslation } from 'react-i18next';

import { useRouter, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

const EventItem = React.memo(({ item, index, formatDate, onDelete, onComplete, t }: { item: Partial<EventTask>; index: number; formatDate: (date: string | null) => string; onDelete: (id: string) => void; onComplete: (id: string) => void; t: any }) => (
  <Animated.View 
    entering={FadeInDown.delay(index * 50).duration(500)}
    layout={Layout.springify()}
    style={styles.card}
  >
    <View style={[styles.iconContainer, { backgroundColor: item.type === 'calendar_event' ? '#E3F2FD' : '#F3E5F5' }]}>
      <FontAwesome 
        name={item.type === 'calendar_event' ? 'calendar' : 'clock-o'} 
        size={20} 
        color={item.type === 'calendar_event' ? '#1976D2' : '#7B1FA2'} 
      />
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{formatDate(item.due_date ?? null)}</Text>
    </View>
    
    <View style={styles.actionGroup}>
      <TouchableOpacity onPress={() => onComplete(item.id!)} style={styles.actionButton}>
        <FontAwesome name="check-circle-o" size={22} color="#4CAF50" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(item.id!)} style={[styles.actionButton, { marginLeft: 15 }]}>
        <FontAwesome name="trash-o" size={20} color="#FF5252" />
      </TouchableOpacity>
    </View>
  </Animated.View>
));

const CountdownItem = React.memo(({ item, index, formatDate, onDelete, onComplete, t }: { item: Partial<EventTask>; index: number; formatDate: (date: string | null) => string; onDelete: (id: string) => void; onComplete: (id: string) => void; t: any }) => {
  const daysLeft = useMemo(() => {
    if (!item.due_date) return null;
    const diff = differenceInDays(new Date(item.due_date), new Date());
    return diff;
  }, [item.due_date]);

  return (
    <Animated.View 
      entering={FadeInRight.delay(index * 75).duration(600)}
      style={styles.countdownCard}
    >
      <View style={styles.countdownHeader}>
        <Text style={styles.countdownTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => onDelete(item.id!)}>
           <FontAwesome name="times-circle" size={18} color="#FFCDD2" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.countdownBody}>
        {daysLeft !== null && (
          <View style={[styles.daysBadge, { backgroundColor: daysLeft <= 3 ? '#FFEBEE' : '#E8F5E9' }]}>
            <Text style={[styles.daysText, { color: daysLeft <= 3 ? '#D32F2F' : '#2E7D32' }]}>
              {daysLeft < 0 ? t('dashboard.overdue') : t('dashboard.daysLeft', { days: daysLeft })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.countdownFooter}>
        <View style={styles.countdownDateGroup}>
          <FontAwesome name="calendar-o" size={12} color="#888" />
          <Text style={styles.countdownDate}>{formatDate(item.due_date ?? null)}</Text>
        </View>
        <TouchableOpacity onPress={() => onComplete(item.id!)}>
          <FontAwesome name="check-circle" size={24} color="#4CAF50" />
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
      t={t}
    />
  ), [formatDate, t]);

  const renderCountdownItem = useCallback(({ item, index }: { item: Partial<EventTask>; index: number }) => (
    <CountdownItem 
      item={item} 
      index={index} 
      formatDate={formatDate} 
      onDelete={handleDelete}
      onComplete={handleComplete}
      t={t}
    />
  ), [formatDate, t]);

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
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{profile?.full_name || 'Legal Professional'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <FontAwesome name="cog" size={26} color={theme.maroon} />
            </TouchableOpacity>
            <Pressable style={styles.profileButton}>
              <FontAwesome name="user-circle-o" size={36} color={theme.maroon} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.activeCountdowns')}</Text>
          {countdowns.length > 0 && (
            <Pressable onPress={() => router.push('/reminders')}>
              <Text style={styles.seeAll}>{t('dashboard.seeFullList')}</Text>
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
          <Text style={styles.sectionTitle}>{t('dashboard.upcomingEvents')}</Text>
          {upcomingEvents.length > 0 && (
            <Pressable onPress={() => router.push('/completed')}>
              <Text style={styles.seeAll}>{t('dashboard.pastArchive')}</Text>
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
    backgroundColor: '#FDFDFD',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  settingsButton: {
    marginEnd: 20,
    padding: 4,
    backgroundColor: 'transparent',
  },
  greeting: {
    fontSize: 14,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 4,
  },
  profileButton: {
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  seeAll: {
    fontSize: 14,
    color: '#800000',
    fontWeight: '700',
    textAlign: 'left',
  },
  emptyContainer: {
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  horizontalList: {
    paddingStart: 20,
    paddingEnd: 10,
    backgroundColor: 'transparent',
  },
  countdownCard: {
    width: width * 0.7,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    marginEnd: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  countdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  countdownTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginEnd: 8,
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  countdownFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  countdownDate: {
    fontSize: 13,
    color: '#666',
    marginStart: 8,
    fontWeight: '500',
  },
  verticalList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    backgroundColor: 'transparent',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  countdownBody: {
    marginBottom: 16,
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginStart: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    end: 30,
    zIndex: 100,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
});
