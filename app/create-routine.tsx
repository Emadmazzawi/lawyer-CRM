import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { createRoutine, RoutineStep } from '@/src/api/routines';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function CreateRoutineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<{ title: string; duration_in_seconds: number }[]>([
    { title: '', duration_in_seconds: 60 } // Default one step of 1 minute
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddStep = () => {
    setSteps([...steps, { title: '', duration_in_seconds: 60 }]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleChangeStepTitle = (text: string, index: number) => {
    const newSteps = [...steps];
    newSteps[index].title = text;
    setSteps(newSteps);
  };

  const handleChangeStepDuration = (text: string, index: number) => {
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    const newSteps = [...steps];
    newSteps[index].duration_in_seconds = isNaN(parsed) ? 0 : parsed;
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error', 'Error'), t('routines.titleRequired', 'Please enter a routine title.'));
      return;
    }

    if (steps.some(s => !s.title.trim())) {
      Alert.alert(t('common.error', 'Error'), t('routines.stepTitleRequired', 'All steps must have a title.'));
      return;
    }

    if (steps.some(s => s.duration_in_seconds <= 0)) {
      Alert.alert(t('common.error', 'Error'), t('routines.stepDurationRequired', 'All steps must have a valid duration > 0.'));
      return;
    }

    setLoading(true);
    
    // Convert to the correct format for API
    const formattedSteps: Omit<RoutineStep, 'id' | 'routine_id'>[] = steps.map((s, index) => ({
      title: s.title,
      duration_in_seconds: s.duration_in_seconds,
      order_index: index,
    }));

    const { error } = await createRoutine(title, description, formattedSteps);
    setLoading(false);

    if (error) {
      Alert.alert(t('common.error', 'Error'), error.message);
    } else {
      Alert.alert(t('common.success', 'Success'), t('routines.createSuccess', 'Routine created successfully.'));
      router.back();
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: theme.text }]}>{t('routines.titleLabel', 'Routine Title')}</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
        placeholder={t('routines.titlePlaceholder', 'e.g., Morning Client Onboarding')}
        placeholderTextColor="#999"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: theme.text }]}>{t('routines.descLabel', 'Description')}</Text>
      <TextInput
        style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
        placeholder={t('routines.descPlaceholder', 'Routine details...')}
        placeholderTextColor="#999"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <View style={styles.stepsHeader}>
        <Text style={[styles.label, { color: theme.text }]}>{t('routines.stepsLabel', 'Routine Steps')}</Text>
      </View>

      {steps.map((step, index) => (
        <View key={index} style={[styles.stepItem, { borderColor: theme.maroonSoft, backgroundColor: theme.background }]}>
          <View style={styles.stepHeaderRow}>
            <Text style={[styles.stepNumber, { color: theme.maroon }]}>{t('routines.step', 'Step')} {index + 1}</Text>
            {steps.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveStep(index)}>
                <FontAwesome name="times-circle" size={24} color="#d9534f" />
              </TouchableOpacity>
            )}
          </View>
          
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: '#EEE', marginBottom: 10 }]}
            placeholder={t('routines.stepTitlePlaceholder', 'Step Name (e.g., Send Intro Email)')}
            placeholderTextColor="#999"
            value={step.title}
            onChangeText={(text) => handleChangeStepTitle(text, index)}
          />
          <View style={styles.durationRow}>
            <Text style={{ color: theme.text, marginRight: 10 }}>{t('routines.durationSeconds', 'Duration (seconds):')}</Text>
            <TextInput
              style={[styles.input, styles.durationInput, { color: theme.text, borderColor: '#EEE' }]}
              keyboardType="number-pad"
              value={step.duration_in_seconds.toString()}
              onChangeText={(text) => handleChangeStepDuration(text, index)}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addStepButton}
        onPress={handleAddStep}
      >
        <FontAwesome name="plus" size={16} color={theme.maroon} style={{ marginRight: 8 }} />
        <Text style={[styles.addStepText, { color: theme.maroon }]}>{t('routines.addStep', 'Add Another Step')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.maroon }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>{t('forms.save', 'Save')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
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
    marginBottom: 20,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  stepItem: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: { fontSize: 16, fontWeight: 'bold' },
  durationRow: { flexDirection: 'row', alignItems: 'center' },
  durationInput: { flex: 1, marginBottom: 0, padding: 12, height: 50 },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 30,
  },
  addStepText: { fontSize: 16, fontWeight: '600' },
  submitButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
