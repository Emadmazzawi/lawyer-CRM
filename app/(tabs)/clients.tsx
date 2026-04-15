import { StyleSheet, FlatList, TouchableOpacity, View as RNView, TextInput } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import React, { useEffect, useState, useCallback } from 'react';
import { getClients, Client } from '@/src/api/clients';
import { useRouter, useFocusEffect } from 'expo-router';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

const getInitials = (name?: string) => {
  if (!name) return 'C';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const ClientListItem = React.memo(({ item, index, onPress, theme, t }: { item: Partial<Client>; index: number; onPress: (id: string) => void; theme: any; t: any }) => (
  <Animated.View entering={FadeInDown.delay(index * 50).duration(500)}>
    <TouchableOpacity 
        onPress={() => onPress(item.id!)}
        activeOpacity={0.7}
    >
      <Card style={[styles.item, { borderColor: theme.border }]}>
        <View style={styles.itemContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
              <View style={[styles.avatar, { backgroundColor: theme.maroonSoft }]}>
                <Text style={[styles.avatarText, { color: theme.maroon }]}>{getInitials(item.name)}</Text>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{item.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border }]}>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                  {item.status ? t(`statuses.${item.status.replace(/\s+/g, '').replace(/^\w/, (c) => c.toLowerCase())}`) : ''}
                </Text>
            </View>
        </View>
      </Card>
    </TouchableOpacity>
  </Animated.View>
));

export default function ClientsScreen() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Partial<Client>[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const loadClients = async () => {
    setLoading(true);
    const { data } = await getClients(0, 20);
    if (data) {
      setClients(data);
      setHasMore(data.length === 20);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    const { data } = await getClients(nextPage, 20);
    if (data && data.length > 0) {
      setClients(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === 20);
    } else {
      setHasMore(false);
    }
    setIsFetchingMore(false);
  };

  const handlePress = useCallback((id: string) => {
    router.push(`/client/${id}`);
  }, [router]);

  const renderItem = useCallback(({ item, index }: { item: Partial<Client>; index: number }) => (
    <ClientListItem item={item} index={index} onPress={handlePress} theme={theme} t={t} />
  ), [handlePress, theme, t]);

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const LoadingSkeleton = () => (
    <RNView style={{ paddingHorizontal: Spacing.lg }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
            <RNView key={i} style={styles.skeletonItem}>
                <Skeleton width={48} height={48} borderRadius={24} style={{ marginEnd: 15 }} />
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
                  <Skeleton width="30%" height={12} />
                </View>
            </RNView>
        ))}
    </RNView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('clients.title')}</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.maroon }]}
          onPress={() => router.push('/create-client')}
        >
          <FontAwesome name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          placeholder={t('clients.search_placeholder')}
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : filteredClients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState 
            icon="users" 
            title={t('clients.noClients')} 
            message={t('clients.noClientsMessage')}
            onPress={() => router.push('/create-client')}
            actionLabel={t('clients.addClient')}
          />
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderItem}
          keyExtractor={item => item.id!}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingMore ? <Skeleton width="100%" height={60} style={{ marginVertical: 10 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontFamily: Fonts.black,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    position: 'relative',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  searchIcon: {
    position: 'absolute',
    left: Spacing.lg + 16,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    fontFamily: Fonts.medium,
    padding: 12,
    paddingLeft: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  item: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: Spacing.sm,
  },
  avatarText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  statusText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: 'transparent',
  }
});
