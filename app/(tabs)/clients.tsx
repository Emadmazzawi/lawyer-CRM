import { StyleSheet, FlatList, TouchableOpacity, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useEffect, useState, useCallback } from 'react';
import { getClients, Client } from '@/src/api/clients';
import { useRouter, useFocusEffect } from 'expo-router';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const ClientListItem = React.memo(({ item, onPress, t }: { item: Partial<Client>; onPress: (id: string) => void; t: any }) => (
  <TouchableOpacity 
      style={styles.item}
      onPress={() => onPress(item.id!)}
  >
    <View style={styles.itemContent}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {item.status ? t(`statuses.${item.status.replace(/\s+/g, '').replace(/^\w/, (c) => c.toLowerCase())}`) : ''}
            </Text>
        </View>
    </View>
  </TouchableOpacity>
));

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'Consultation': return '#E3F2FD';
        case 'Awaiting Docs': return '#FFF3E0';
        case 'In Court': return '#F3E5F5';
        case 'Closed': return '#E8F5E9';
        default: return '#F5F5F5';
    }
};

export default function ClientsScreen() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Partial<Client>[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

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

  const renderItem = useCallback(({ item }: { item: Partial<Client> }) => (
    <ClientListItem item={item} onPress={handlePress} t={t} />
  ), [handlePress, t]);

  const LoadingSkeleton = () => (
    <RNView style={{ padding: 10 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
            <RNView key={i} style={styles.skeletonItem}>
                <Skeleton width="50%" height={20} style={{ marginBottom: 10 }} />
                <Skeleton width="30%" height={15} />
            </RNView>
        ))}
    </RNView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('clients.title')}</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.maroon }]}
          onPress={() => router.push('/create-client')}
        >
          <FontAwesome name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : clients.length === 0 ? (
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
          data={clients}
          renderItem={renderItem}
          keyExtractor={item => item.id!}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingMore ? <Skeleton width="90%" height={60} style={{ alignSelf: 'center', marginVertical: 10 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
  item: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
    textTransform: 'uppercase',
  },
  skeletonItem: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
  }
});
