import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius, style }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const opacity = new Animated.Value(0.3);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: (width || '100%') as any,
          height: (height || 20) as any,
          borderRadius: borderRadius || 4,
          opacity: opacity,
          backgroundColor: theme.border, // dynamically use theme.border instead of hardcoded
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    // Background color is handled inline to support theming properly
  },
});
