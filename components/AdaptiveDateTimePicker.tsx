import React, { useState, createElement } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
} from 'react-native';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { FontAwesome } from '@expo/vector-icons';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';

interface AdaptiveDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  mode: 'date' | 'time' | 'datetime';
  label?: string;
  theme: any;
  minimumDate?: Date;
  showLabel?: boolean;
  placeholder?: string;
}

export const AdaptiveDateTimePicker: React.FC<AdaptiveDateTimePickerProps> = ({
  value,
  onChange,
  mode,
  label,
  theme,
  minimumDate,
  showLabel = true,
  placeholder = 'None',
}) => {
  const [show, setShow] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>(mode === 'datetime' ? 'date' : mode);

  // Fallback for display and picker
  const activeDate = value && !isNaN(value.getTime()) ? value : new Date();
  const isSet = !!value;

  // Web implementation using native HTML5 inputs
  if (Platform.OS === 'web') {
    const handleWebChange = (e: any) => {
      const val = e.target.value;
      if (!val) {
        onChange(null);
        return;
      }
      
      const newDate = new Date(activeDate);
      if (e.target.type === 'date') {
        const [y, m, d] = val.split('-');
        newDate.setFullYear(Number(y), Number(m) - 1, Number(d));
      } else if (e.target.type === 'time') {
        const [h, m] = val.split(':');
        newDate.setHours(Number(h), Number(m));
      }
      
      if (!isNaN(newDate.getTime())) {
        onChange(newDate);
      }
    };

    return (
      <View style={styles.container}>
        {showLabel && label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
        <View style={styles.webRow}>
          {(mode === 'date' || mode === 'datetime') && (
            <View style={styles.inputWrapper}>
              {showLabel && mode === 'datetime' && <Text style={[styles.microLabel, { color: theme.textSecondary }]}>Date</Text>}
              <View style={styles.relative}>
                {createElement('input', {
                  type: 'date',
                  value: isSet ? format(activeDate, 'yyyy-MM-dd') : '',
                  onChange: handleWebChange,
                  onClick: (e: any) => { try { e.target.showPicker(); } catch (err) {} },
                  style: {
                    ...webInputStyle,
                    backgroundColor: theme.surfaceElevated,
                    color: isSet ? theme.text : theme.textMuted,
                    borderColor: theme.border,
                  }
                })}
                <FontAwesome name="calendar" size={16} color={theme.maroon} style={styles.icon} />
              </View>
            </View>
          )}
          {(mode === 'time' || mode === 'datetime') && (
            <View style={styles.inputWrapper}>
              {showLabel && mode === 'datetime' && <Text style={[styles.microLabel, { color: theme.textSecondary }]}>Time</Text>}
              <View style={styles.relative}>
                {createElement('input', {
                  type: 'time',
                  value: isSet ? format(activeDate, 'HH:mm') : '',
                  onChange: handleWebChange,
                  onClick: (e: any) => { try { e.target.showPicker(); } catch (err) {} },
                  style: {
                    ...webInputStyle,
                    backgroundColor: theme.surfaceElevated,
                    color: isSet ? theme.text : theme.textMuted,
                    borderColor: theme.border,
                  }
                })}
                <FontAwesome name="clock-o" size={16} color={theme.maroon} style={styles.icon} />
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Native implementation using @react-native-community/datetimepicker
  const onNativeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const openPicker = (m: 'date' | 'time') => {
    setPickerMode(m);
    setShow(true);
    // If not set, initialize to now when opening
    if (!isSet) {
      onChange(new Date());
    }
  };

  return (
    <View style={styles.container}>
      {showLabel && label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <View style={styles.nativeRow}>
        {(mode === 'date' || mode === 'datetime') && (
          <TouchableOpacity 
            style={[styles.pickerButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => openPicker('date')}
          >
            <FontAwesome name="calendar" size={18} color={theme.maroon} />
            <Text style={[styles.pickerText, { color: isSet ? theme.text : theme.textMuted }]}>
              {isSet ? format(activeDate, 'MMM d, yyyy') : placeholder}
            </Text>
          </TouchableOpacity>
        )}
        {(mode === 'time' || mode === 'datetime') && (
          <TouchableOpacity 
            style={[styles.pickerButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => openPicker('time')}
          >
            <FontAwesome name="clock-o" size={18} color={theme.maroon} />
            <Text style={[styles.pickerText, { color: isSet ? theme.text : theme.textMuted }]}>
              {isSet ? format(activeDate, 'p') : placeholder}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {show && (
        <RNDateTimePicker
          value={activeDate}
          mode={pickerMode}
          display={
            pickerMode === 'date' 
              ? (Platform.OS === 'ios' ? 'inline' : 'calendar') 
              : (Platform.OS === 'ios' ? 'spinner' : 'default')
          }
          onChange={onNativeChange}
          minimumDate={minimumDate}
          textColor={theme.text}
        />
      )}
      
      {Platform.OS === 'ios' && show && (
          <TouchableOpacity 
            onPress={() => setShow(false)} 
            style={[styles.iosConfirm, { backgroundColor: theme.maroon }]}
          >
            <Text style={styles.iosConfirmText}>Done</Text>
          </TouchableOpacity>
      )}
    </View>
  );
};

const webInputStyle = {
  padding: '14px',
  borderRadius: BorderRadius.lg,
  borderWidth: '1px',
  borderStyle: 'solid',
  fontSize: '16px',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box' as const,
  fontFamily: Fonts.medium,
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.md,
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
    marginStart: 2,
  },
  webRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nativeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  relative: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -8,
    pointerEvents: 'none' as any,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    height: 56,
  },
  pickerText: {
    fontFamily: Fonts.semiBold,
    marginStart: 10,
    fontSize: 15,
  },
  iosConfirm: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.pill,
    marginTop: 8,
  },
  iosConfirmText: {
    color: '#FFF',
    fontFamily: Fonts.bold,
    fontSize: 14,
  }
});
