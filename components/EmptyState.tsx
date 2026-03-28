import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  message: string;
  onPress?: () => void;
  actionLabel?: string;
}

export const EmptyState = ({ icon, title, message, onPress, actionLabel }: EmptyStateProps) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: theme.maroonSoft }]}>
        <FontAwesome name={icon} size={40} color={theme.maroon} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onPress && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.maroon }]} 
          onPress={onPress}
        >
          <Text style={styles.buttonText}>{actionLabel || 'Get Started'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
