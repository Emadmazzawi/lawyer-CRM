import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { Text, View, PrimaryButton } from '@/components/Themed';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { getCaseById, Case } from '@/src/api/cases';
import { getEventsTasksByClient, EventTask } from '@/src/api/events_and_tasks';
import { getClientById, Client } from '@/src/api/clients';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [tasks, setTasks] = useState<Partial<EventTask>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    if (caseItem) {
      navigation.setOptions({
        title: caseItem.title,
      });
    }
  }, [caseItem, navigation]);

  const loadData = async () => {
    setLoading(true);
    const { data: caseRes } = await getCaseById(id as string);
    if (caseRes) {
      setCaseItem(caseRes);
      
      const [clientRes, tasksRes] = await Promise.all([
        getClientById(caseRes.client_id),
        getEventsTasksByClient(caseRes.client_id)
      ]);
      
      if (clientRes.data) setClient(clientRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (!caseItem) return;
    try {
      await Share.share({
        message: `Case Detail: ${caseItem.title}\nStatus: ${caseItem.status}\nDescription: ${caseItem.description || 'No description'}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.maroon} />
      </View>
    );
  }

  if (!caseItem) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Case not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(600)} style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={[styles.statusBadge, { 
            backgroundColor: caseItem.status === 'Open' ? theme.successSoft : caseItem.status === 'Closed' ? theme.dangerSoft : theme.warningSoft 
          }]}>
            <Text style={[styles.statusText, { 
              color: caseItem.status === 'Open' ? theme.success : caseItem.status === 'Closed' ? theme.danger : theme.warning 
            }]}>{caseItem.status}</Text>
          </View>
          <TouchableOpacity onPress={handleShare}>
            <FontAwesome name="share-square-o" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{caseItem.title}</Text>
        
        {client && (
          <TouchableOpacity 
            style={styles.clientInfo} 
            onPress={() => router.push(`/client/${client.id}`)}
          >
            <FontAwesome name="user-circle-o" size={16} color={theme.maroon} />
            <Text style={[styles.clientName, { color: theme.maroon }]}>{client.name}</Text>
          </TouchableOpacity>
        )}

        {caseItem.description && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('forms.description', 'DESCRIPTION')}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{caseItem.description}</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Associated Tasks</Text>
          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/create-event', params: { clientId: client?.id } })}
            style={[styles.addBtn, { backgroundColor: theme.maroonSoft }]}
          >
            <FontAwesome name="plus" size={12} color={theme.maroon} />
            <Text style={[styles.addBtnText, { color: theme.maroon }]}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No tasks found for this client.</Text>
          </View>
        ) : (
          tasks.map((task, index) => (
            <Animated.View 
              key={task.id} 
              entering={FadeInDown.delay(200 + index * 100)}
              style={[styles.taskItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <FontAwesome 
                name={task.type === 'calendar_event' ? 'calendar' : 'clock-o'} 
                size={16} 
                color={theme.textSecondary} 
              />
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
                <Text style={[styles.taskDate, { color: theme.textMuted }]}>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                </Text>
              </View>
            </Animated.View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.black,
    fontSize: 28,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
    backgroundColor: 'transparent',
  },
  clientName: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  descriptionSection: {
    marginTop: Spacing.md,
    backgroundColor: 'transparent',
  },
  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginTop: Spacing.sm,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  addBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  taskContent: {
    marginStart: Spacing.md,
    backgroundColor: 'transparent',
  },
  taskTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  taskDate: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
});
