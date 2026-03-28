import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, View as RNView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { createEventTask, EventType } from '@/src/api/events_and_tasks';
import { getCurrentUser } from '@/src/api/auth';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
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
      <RNView style={{ flex: 1 }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.date', 'Date')}</Text>
        <TextInput
          style={[styles.webInput, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
          // @ts-ignore
          type="date"
          value={format(dueDate, 'yyyy-MM-dd')}
          onChangeText={(val) => {
            if (val) {
              const [y, m, d] = val.split('-');
              const newD = new Date(dueDate);
              if (y && m && d) {
                newD.setFullYear(Number(y), Number(m)-1, Number(d));
                setDueDate(newD);
              }
            }
          }}
        />
      </RNView>
      <RNView style={{ flex: 1 }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.time', 'Time')}</Text>
        <TextInput
          style={[styles.webInput, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
          // @ts-ignore
          type="time"
          value={format(dueDate, 'HH:mm')}
          onChangeText={(val) => {
            if (val) {
              const [h, m] = val.split(':');
              const newD = new Date(dueDate);
              if (h && m) {
                newD.setHours(Number(h), Number(m));
                setDueDate(newD);
              }
            }
          }}
        />
      </RNView>
    </RNView>
  );

  const renderNativeDatePicker = () => (
    <RNView style={styles.webDateContainer}>
      <TouchableOpacity 
        style={[styles.dateTimeBox, { borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
        onPress={() => openPicker('date')}
      >
        <FontAwesome name="calendar" size={18} color={theme.maroon} />
        <Text style={[styles.dateText, { color: theme.text }]}>{format(dueDate, 'MMM d, yyyy')}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.dateTimeBox, { borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: theme.text }]}>{t('forms.title', 'TITLE')}</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
        placeholder={t('placeholders.eventTitle', 'e.g., Client Meeting')}
        placeholderTextColor="#999"
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
            <Text style={[styles.typeText, type === opt.value && { color: '#FFF' }]}>
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
              priority === p && { backgroundColor: theme.maroon, borderColor: theme.maroon },
            ]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.priorityText, priority === p && { color: '#FFF' }]}>
              {t(`priorities.${p.toLowerCase()}`, p)}
            </Text>
          </TouchableOpacity>
        ))}
      </RNView>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.maroon }]}
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
  microLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    color: '#666',
    marginLeft: 2,
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
  webDateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  webInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  dateTimeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  dateText: {
    marginStart: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
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
