import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, View as RNView } from 'react-native';
import { Text, View, StyledInput, PrimaryButton } from '@/components/Themed';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { createEventTask, EventType } from '@/src/api/events_and_tasks';
import { getCurrentUser } from '@/src/api/auth';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { useTranslation } from 'react-i18next';
import { AdaptiveDateTimePicker } from '@/components/AdaptiveDateTimePicker';

const TYPE_OPTIONS: { label: string; value: EventType; icon: any }[] = [
  { label: 'Countdown', value: 'countdown', icon: 'hourglass-half' },
  { label: 'Event', value: 'calendar_event', icon: 'calendar' },
  { label: 'Reminder', value: 'reminder', icon: 'bell' },
];

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

export default function CreateEventScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  React.useEffect(() => {
    navigation.setOptions({
      title: t('dashboard.addEvent')
    });
  }, [t, navigation]);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>((params.type as EventType) || 'calendar_event');
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleCreate = async () => {
    if (!title) {
      Alert.alert(t('common.error'), t('forms.eventTitleRequired', 'Please enter a title'));
      return;
    }

    if (!dueDate || isNaN(dueDate.getTime())) {
      Alert.alert(t('common.error'), t('forms.invalidDate', 'Please select a valid date and time.'));
      return;
    }

    setLoading(true);
    const { data: userData } = await getCurrentUser();
    if (!userData?.user) {
      Alert.alert(t('common.error'), t('forms.userNotAuth'));
      setLoading(false);
      return;
    }

    const { error } = await createEventTask({
      user_id: userData.user.id,
      title,
      type,
      due_date: dueDate.toISOString(),
      priority,
      client_id_fk: (params.clientId as string) || null,
    });

    setLoading(false);
    if (error) {
      Alert.alert(t('forms.creationFailed'), error.message);
    } else {
      Alert.alert(t('common.success'), t('forms.eventSaved', 'Entry saved successfully'));
      router.back();
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StyledInput
        label={t('forms.title')}
        placeholder={t('placeholders.eventTitle')}
        value={title}
        onChangeText={setTitle}
      />

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('forms.category')}</Text>
        <RNView style={styles.typeGrid}>
          {TYPE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.typeButton,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                type === opt.value && { backgroundColor: theme.maroon, borderColor: theme.maroon },
              ]}
              onPress={() => setType(opt.value)}
            >
              <FontAwesome 
                name={opt.icon} 
                size={18} 
                color={type === opt.value ? '#FFF' : theme.textSecondary} 
                style={{ marginBottom: 6 }}
              />
              <Text style={[styles.typeText, { color: theme.textSecondary }, type === opt.value && { color: '#FFF' }]}>
                {t(`categories.${opt.value}`, opt.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </RNView>
      </View>

      <AdaptiveDateTimePicker
        label={t('forms.dateAndTime')}
        value={dueDate}
        onChange={setDueDate}
        mode="datetime"
        theme={theme}
        minimumDate={new Date()}
      />

      <View style={[styles.section, { marginTop: Spacing.md }]}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('forms.priority')}</Text>
        <RNView style={styles.priorityContainer}>
          {PRIORITY_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityButton,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                priority === p && { backgroundColor: theme.maroon, borderColor: theme.maroon },
              ]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.priorityText, { color: theme.textSecondary }, priority === p && { color: '#FFF' }]}>
                {t(`priorities.${p.toLowerCase()}`, p)}
              </Text>
            </TouchableOpacity>
          ))}
        </RNView>
      </View>

      <PrimaryButton
        title={t('forms.save')}
        onPress={handleCreate}
        loading={loading}
        style={{ marginTop: Spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  section: {
    marginBottom: Spacing.lg,
    backgroundColor: 'transparent',
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  typeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
});
