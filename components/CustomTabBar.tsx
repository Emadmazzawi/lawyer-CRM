import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const TabBarItem = ({
  options,
  route,
  isFocused,
  onPress,
  onLongPress,
  colorScheme,
}: {
  options: any;
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colorScheme: 'light' | 'dark';
}) => {
  const scale = useSharedValue(isFocused ? 1.1 : 1);
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, {
      damping: 10,
      stiffness: 100,
    });
    progress.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        progress.value,
        [0, 1],
        [Colors[colorScheme].tabIconDefault, Colors[colorScheme].tint]
      ),
      fontWeight: isFocused ? '600' : '400',
    };
  });

  // Extract the icon name from the default setup if available.
  // For safety, we fallback to a default icon.
  const getIconName = (routeName: string): React.ComponentProps<typeof FontAwesome>['name'] => {
    switch (routeName) {
      case 'index': return 'home';
      case 'clients': return 'users';
      case 'reminders': return 'bell';
      case 'completed': return 'check-circle';
      default: return 'circle';
    }
  };

  const activeColor = Colors[colorScheme].tint;
  const inactiveColor = Colors[colorScheme].tabIconDefault;

  return (
    <AnimatedTouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <FontAwesome
          name={getIconName(route.name)}
          size={24}
          color={isFocused ? activeColor : inactiveColor}
        />
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, animatedTextStyle]}>
        {options.title !== undefined ? options.title : route.name}
      </Animated.Text>
    </AnimatedTouchableOpacity>
  );
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isRTL = I18nManager.isRTL;
  
  // Create an animated value for the sliding pill
  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 15,
      stiffness: 120,
    });
  }, [state.index]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    // Basic calculation for the indicator position.
    // Assuming each tab takes equal width.
    const tabWidth = 100 / state.routes.length;
    // In RTL, the translation direction might be inverted depending on the flex layout,
    // but React Native usually handles `left` in an LTR manner. However, percentage 
    // translations work consistently with the layout direction.
    const position = isRTL 
      ? (state.routes.length - 1 - activeIndex.value) * tabWidth 
      : activeIndex.value * tabWidth;
      
    return {
      left: `${position}%`,
      width: `${tabWidth}%`,
    };
  });

  return (
    <View style={[
      styles.tabBarContainer, 
      { 
        paddingBottom: insets.bottom || 16,
        backgroundColor: Colors[colorScheme].background,
        borderTopColor: colorScheme === 'dark' ? '#333' : '#e5e5e5'
      }
    ]}>
      <Animated.View style={[
        styles.activeIndicatorContainer, 
        animatedIndicatorStyle
      ]}>
        <View style={[
          styles.activeIndicator,
          { backgroundColor: Colors[colorScheme].tint + '20' } // 20% opacity for pill background
        ]} />
      </Animated.View>

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarItem
            key={route.key}
            options={options}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            colorScheme={colorScheme}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconContainer: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  activeIndicatorContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeIndicator: {
    width: '60%',
    height: '100%',
    borderRadius: 20,
  }
});
