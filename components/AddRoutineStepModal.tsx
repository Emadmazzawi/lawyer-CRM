import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Modal, FlatList, ScrollView, TextInput, View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { useTranslation } from 'react-i18next';

type StepTemplate = {
  emoji: string;
  title: string;
  duration_minutes: number;
  category: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectStep: (step: { emoji: string; title: string; duration_in_seconds: number }) => void;
  theme: any;
};

export default function AddRoutineStepModal({ visible, onClose, onSelectStep, theme }: Props) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('morning');
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customEmoji, setCustomEmoji] = useState('⭐');
  const [customDuration, setCustomDuration] = useState('5');

  const CATEGORIES = [
    { label: t('routines.categories.morning'), value: 'morning' },
    { label: t('routines.categories.evening'), value: 'evening' },
    { label: t('routines.categories.study'), value: 'study' },
    { label: t('routines.categories.fitness'), value: 'fitness' },
    { label: t('routines.categories.wellness'), value: 'wellness' },
  ];

  const PRESET_STEPS: StepTemplate[] = [
    { emoji: '✍️', title: t('routines.presets.goals'), duration_minutes: 10, category: 'morning' },
    { emoji: '🚿', title: t('routines.presets.shower'), duration_minutes: 15, category: 'morning' },
    { emoji: '🪥', title: t('routines.presets.brush'), duration_minutes: 3, category: 'morning' },
    { emoji: '🛏️', title: t('routines.presets.bed'), duration_minutes: 2, category: 'morning' },
    { emoji: '💊', title: t('routines.presets.vitamins'), duration_minutes: 1, category: 'morning' },
    { emoji: '☀️', title: t('routines.presets.sunlight'), duration_minutes: 10, category: 'morning' },
    { emoji: '🤸', title: t('routines.presets.stretch'), duration_minutes: 10, category: 'morning' },
    { emoji: '🧼', title: t('routines.presets.facewash'), duration_minutes: 1, category: 'morning' },
    { emoji: '🥞', title: t('routines.presets.breakfast'), duration_minutes: 15, category: 'morning' },
    { emoji: '🧘', title: t('routines.presets.meditation'), duration_minutes: 10, category: 'wellness' },
    { emoji: '💧', title: t('routines.presets.water'), duration_minutes: 1, category: 'morning' },
    { emoji: '📖', title: t('routines.presets.read'), duration_minutes: 20, category: 'evening' },
    { emoji: '📝', title: t('routines.presets.journal'), duration_minutes: 10, category: 'evening' },
    { emoji: '🎵', title: t('routines.presets.music'), duration_minutes: 15, category: 'evening' },
    { emoji: '🦷', title: t('routines.presets.skincare'), duration_minutes: 5, category: 'evening' },
    { emoji: '📚', title: t('routines.presets.study'), duration_minutes: 30, category: 'study' },
    { emoji: '📝', title: t('routines.presets.review'), duration_minutes: 15, category: 'study' },
    { emoji: '🏋️', title: t('routines.presets.workout'), duration_minutes: 30, category: 'fitness' },
    { emoji: '🏃', title: t('routines.presets.run'), duration_minutes: 20, category: 'fitness' },
  ];

  const filteredSteps = PRESET_STEPS.filter(s => s.category === selectedCategory);

  const handlePickStep = (step: StepTemplate) => {
    onSelectStep({
      emoji: step.emoji,
      title: step.title,
      duration_in_seconds: step.duration_minutes * 60,
    });
    onClose();
  };

  const handleCustomStep = () => {
    if (!customTitle.trim()) return;
    onSelectStep({
      emoji: customEmoji,
      title: customTitle,
      duration_in_seconds: (parseInt(customDuration) || 5) * 60,
    });
    setCustomTitle('');
    setCustomDuration('5');
    setShowCustom(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('routines.createStep')}</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Custom Step Button */}
          <TouchableOpacity 
            style={[styles.customStepButton, { backgroundColor: theme.maroon }]}
            onPress={() => setShowCustom(!showCustom)}
          >
            <Text style={styles.customStepButtonText}>{t('routines.customStep')}</Text>
          </TouchableOpacity>

          {showCustom && (
            <View style={[styles.customForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.emojiInput, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                  value={customEmoji}
                  onChangeText={setCustomEmoji}
                  maxLength={2}
                />
                <TextInput
                  style={[styles.customInput, { flex: 1, color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                  placeholder={t('routines.stepNamePlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  value={customTitle}
                  onChangeText={setCustomTitle}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
                <TextInput
                  style={[styles.customInput, { width: 60, textAlign: 'center', color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  keyboardType="number-pad"
                />
                <Text style={{ color: theme.textSecondary, fontFamily: Fonts.medium }}>{t('common.min')}</Text>
                <TouchableOpacity style={[styles.addCustomBtn, { backgroundColor: theme.maroon }]} onPress={handleCustomStep}>
                  <Text style={{ color: '#FFF', fontFamily: Fonts.bold }}>{t('common.add')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.orText, { color: theme.textMuted }]}>{t('common.or')}</Text>

          {/* Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryPill,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  selectedCategory === cat.value && { backgroundColor: theme.maroon, borderColor: theme.maroon },
                ]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Text style={[
                  styles.categoryPillText,
                  { color: theme.textSecondary },
                  selectedCategory === cat.value && { color: '#FFF' },
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Preset Steps List */}
          <FlatList
            data={filteredSteps}
            keyExtractor={(item, idx) => `${item.title}-${idx}`}
            style={styles.stepsList}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.stepRow, { borderBottomColor: theme.border }]} onPress={() => handlePickStep(item)}>
                <Text style={styles.stepEmoji}>{item.emoji}</Text>
                <Text style={[styles.stepTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.stepDuration, { color: theme.textMuted }]}>{item.duration_minutes} {t('common.min')}</Text>
              </TouchableOpacity>
            )}
          />

          {/* Bottom Pick Button */}
          <TouchableOpacity style={[styles.pickButton, { backgroundColor: theme.textMuted }]} onPress={onClose}>
            <Text style={styles.pickButtonText}>{t('routines.pickStep')}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: Fonts.black,
    fontSize: 22,
  },
  customStepButton: {
    paddingVertical: 14,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  customStepButtonText: {
    fontFamily: Fonts.bold,
    color: '#FFF',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  customForm: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  emojiInput: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 22,
  },
  customInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  addCustomBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.pill,
    marginLeft: 'auto',
  },
  orText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  categoryScroll: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  categoryPillText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  stepsList: {
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  stepEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
    width: 32,
  },
  stepTitle: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  stepDuration: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  pickButton: {
    paddingVertical: 14,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  pickButtonText: {
    fontFamily: Fonts.bold,
    color: '#FFF',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
