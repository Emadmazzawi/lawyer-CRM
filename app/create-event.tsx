import React, { useState, createElement } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, View as RNView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { createEventTask, EventType } from '@/src/api/events_and_tasks';
import { getCurrentUser } from '@/src/api/auth';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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
  const [dueDate, setDueDate] = useState(new Date());
  
  // Mobile Picker States
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleCreate = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setLoading(true);
    const { data: userData } = await getCurrentUser();
    if (!userData?.user) {
      Alert.alert('Error', 'User not authenticated');
      setLoading(false);
      return;
    }

    
    if (isNaN(dueDate.getTime())) {
      Alert.alert('Invalid Date', 'Please select a valid date and time.');
      setLoading(false);
      return;
    }

    const { data: eventData, error } = await createEventTask({
      user_id: userData.user.id,
      title,
      type,
      due_date: dueDate.toISOString(),
      priority,
      client_id_fk: (params.clientId as string) || null,
    });

    setLoading(false);
    if (error) {
      Alert.alert('Creation Failed', error.message);
    } else {
      Alert.alert('Success', 'Entry saved successfully');
      router.back();
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const openPicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const renderWebDatePicker = () => (
    <RNView style={styles.webDateContainer}>
      <RNView style={{ flex: 1, position: 'relative' }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.date', 'Date')}</Text>
        {Platform.OS === 'web' && createElement('input', {
          type: 'date',
          value: format(dueDate, 'yyyy-MM-dd'),
          onChange: (e: any) => {
            const val = e.target.value;
            if (!val) return;
            const [y, m, d] = val.split('-');
            if (y && m && d && y.length === 4) {
              const newD = new Date(dueDate);
              newD.setFullYear(Number(y), Number(m) - 1, Number(d));
              if (!isNaN(newD.getTime())) setDueDate(newD);
            }
          },
          onClick: (e: any) => {
            try { e.target.showPicker(); } catch (err) {}
          },
          style: {
            padding: '14px',
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme.border,
            backgroundColor: theme.surfaceElevated,
            color: theme.text,
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box'
          }
        })}
        <FontAwesome name="calendar" size={16} color={theme.maroon} style={{ position: 'absolute', right: 14, top: 38, pointerEvents: 'none' }} />
      </RNView>
      <RNView style={{ flex: 1, position: 'relative' }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.time', 'Time')}</Text>
        {Platform.OS === 'web' && createElement('input', {
          type: 'time',
          value: format(dueDate, 'HH:mm'),
          onChange: (e: any) => {
            const val = e.target.value;
            if (!val) return;
            const [h, m] = val.split(':');
            if (h && m) {
              const newD = new Date(dueDate);
              newD.setHours(Number(h), Number(m));
              if (!isNaN(newD.getTime())) setDueDate(newD);
            }
          },
          onClick: (e: any) => {
            try { e.target.showPicker(); } catch (err) {}
          },
          style: {
            padding: '14px',
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme.border,
            backgroundColor: theme.surfaceElevated,
            color: theme.text,
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box'
          }
        })}
        <FontAwesome name="clock-o" size={16} color={theme.maroon} style={{ position: 'absolute', right: 14, top: 38, pointerEvents: 'none' }} />
      </RNView>
    </RNView>
  );

  const renderNativeDatePicker = () => (
    <RNView style={styles.webDateContainer}>
      <TouchableOpacity 
        style={[styles.dateTimeBox, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
        onPress={() => openPicker('date')}
      >
        <FontAwesome name="calendar" size={18} color={theme.maroon} />
        <Text style={[styles.dateText, { color: theme.text }]}>{format(dueDate, 'MMM d, yyyy')}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.dateTimeBox, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
        onPress={() => openPicker('time')}
      >
        <FontAwesome name="clock-o" size={18} color={theme.maroon} />
        <Text style={[styles.dateText, { color: theme.text }]}>{format(dueDate, 'p')}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dueDate}
          mode={pickerMode}
          display={
            pickerMode === 'date' 
              ? (Platform.OS === 'ios' ? 'inline' : 'calendar') 
              : 'spinner'
          }
          onChange={onDateChange}
          minimumDate={new Date()}
          textColor={theme.text}
        />
      )}
    </RNView>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: theme.text }]}>{t('forms.title', 'TITLE')}</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
        placeholder={t('placeholders.eventTitle', 'e.g., Client Meeting')}
        placeholderTextColor={theme.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: theme.text }]}>{t('forms.category', 'CATEGORY')}</Text>
      <RNView style={styles.typeGrid}>
        {TYPE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.typeButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
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

      <Text style={[styles.label, { color: theme.text }]}>{t('forms.dateAndTime', 'DATE & TIME')}</Text>
      {Platform.OS === 'web' ? renderWebDatePicker() : renderNativeDatePicker()}

      <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>{t('forms.priority', 'PRIORITY')}</Text>
      <RNView style={styles.priorityContainer}>
        {PRIORITY_OPTIONS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.priorityButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
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

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.maroon, shadowColor: theme.maroon }]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>{t('forms.save', 'Save Event')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  microLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    fontFamily: Fonts.medium,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 16,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  typeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
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
  webDateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  dateTimeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  dateText: {
    fontFamily: Fonts.semiBold,
    marginStart: 10,
    fontSize: 15,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  submitButton: {
    padding: 20,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  submitText: {
    fontFamily: Fonts.bold,
    color: '#FFF',
    fontSize: 18,
  },
});
