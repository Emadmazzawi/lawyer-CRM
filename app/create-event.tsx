import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createEventTask, EventType } from '@/src/api/events_and_tasks';
import { getCurrentUser } from '@/src/api/auth';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useNavigation } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

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
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

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

    console.log('Attempting to create event/task:', { title, type, dueDate, priority });
    const { data: eventData, error } = await createEventTask({
      user_id: userData.user.id,
      title,
      type,
      due_date: dueDate.toISOString(),
      priority,
      client_id_fk: (params.clientId as string) || null,
    });

    console.log('Create event response:', { eventData, error });

    setLoading(false);
    if (error) {
      console.error('Event creation error:', error);
      Alert.alert('Creation Failed', error.message);
    } else {
      Alert.alert('Success', 'Entry saved successfully');
      router.back();
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      setPickerMode('date');
      return;
    }

    const currentDate = selectedDate || dueDate;
    
    if (Platform.OS === 'ios') {
      setDueDate(currentDate);
    } else {
      // Android flow: Date -> Time
      if (pickerMode === 'date') {
        setDueDate(currentDate);
        setPickerMode('time');
        // We need a small timeout to let the date picker close before opening the time picker
        setTimeout(() => setShowPicker(true), 0);
      } else {
        setDueDate(currentDate);
        setShowPicker(false);
        setPickerMode('date');
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: theme.text }]}>{t('forms.title')}</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
        placeholder={t('placeholders.eventTitle')}
        placeholderTextColor="#999"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: theme.text }]}>{t('forms.category')}</Text>
      <View style={styles.typeGrid}>
        {TYPE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.typeButton,
              type === opt.value && { backgroundColor: theme.maroon, borderColor: theme.maroon },
            ]}
            onPress={() => setType(opt.value)}
          >
            <FontAwesome 
              name={opt.icon} 
              size={18} 
              color={type === opt.value ? '#FFF' : '#666'} 
              style={{ marginBottom: 6 }}
            />
            <Text style={[styles.typeText, type === opt.value && { color: '#FFF' }]}>{t(`categories.${opt.value}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.text }]}>{t('forms.date')}</Text>
      {Platform.OS === 'web' ? (
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
          // @ts-ignore - type is supported in react-native-web
          type="datetime-local"
          value={dueDate.toISOString().slice(0, 16)}
          onChangeText={(val) => {
            if (val) setDueDate(new Date(val));
          }}
        />
      ) : (
        <TouchableOpacity 
          style={[styles.datePickerContainer, { borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
          onPress={() => {
            setPickerMode('date');
            setShowPicker(true);
          }}
        >
          <FontAwesome name="clock-o" size={20} color={theme.maroon} />
          <Text style={[styles.dateText, { color: theme.text }]}>
            {format(dueDate, 'PPPP p')}
          </Text>
        </TouchableOpacity>
      )}

      {Platform.OS !== 'web' && showPicker && (
        <DateTimePicker
          value={dueDate}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      <Text style={[styles.label, { color: theme.text }]}>{t('forms.priority')}</Text>
      <View style={styles.priorityContainer}>
        {PRIORITY_OPTIONS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.priorityButton,
              priority === p && { backgroundColor: theme.maroon, borderColor: theme.maroon },
            ]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.priorityText, priority === p && { color: '#FFF' }]}>{t(`priorities.${p.toLowerCase()}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.maroon }]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>{t('forms.save')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  typeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
    backgroundColor: 'transparent',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EEE',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  dateText: {
    flex: 1,
    marginStart: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EEE',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  submitButton: {
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
