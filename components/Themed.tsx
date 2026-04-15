import { 
  Text as DefaultText, 
  View as DefaultView, 
  TextInput as DefaultTextInput, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  I18nManager
} from 'react-native';
import React from 'react';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, BorderRadius, Spacing } from '@/constants/Theme';
import { useTranslation } from 'react-i18next';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];
export type TextInputProps = ThemeProps & DefaultTextInput['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  return <DefaultText style={[{ color, fontFamily: Fonts.regular, textAlign: isRTL ? 'right' : 'left' }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function Card(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'surface');
  const shadowColor = useThemeColor({ light: 'rgba(0,0,0,0.1)', dark: 'rgba(0,0,0,0.5)' }, 'cardShadow');

  return (
    <DefaultView 
      style={[
        { 
          backgroundColor, 
          borderRadius: BorderRadius.lg, 
          padding: Spacing.md,
          shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }, 
        style
      ]} 
      {...otherProps} 
    />
  );
}

export function StyledInput(props: TextInputProps & { label?: string; error?: string }) {
  const { style, lightColor, darkColor, label, error, ...otherProps } = props;
  const theme = Colors[useColorScheme()];
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <DefaultView style={styles.inputContainer}>
      {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      <DefaultTextInput
        style={[
          styles.input,
          { 
            color: theme.text, 
            borderColor: isFocused ? theme.inputBorderActive : theme.border, 
            backgroundColor: theme.surfaceElevated,
            fontFamily: Fonts.medium,
            textAlign: isRTL ? 'right' : 'left'
          },
          style,
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={theme.textMuted}
        {...otherProps}
      />
      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
    </DefaultView>
  );
}

export function PrimaryButton({ 
  title, 
  onPress, 
  loading, 
  disabled, 
  style 
}: { 
  title: string; 
  onPress: () => void; 
  loading?: boolean; 
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const theme = Colors[useColorScheme()];
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.maroon },
        (disabled || loading) && { opacity: 0.6 },
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: Fonts.medium,
  },
  button: {
    paddingVertical: 18,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: 0.5,
    textAlign: 'center', // Always center button text
  },
});
