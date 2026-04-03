const tintColorLight = '#4A7BF7'; // Changed to match routines tab blue
const tintColorDark = '#4A7BF7'; // Changed to match routines tab blue

export default {
  light: {
    text: '#111111',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    tint: tintColorLight,
    border: '#E5E7EB',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    maroon: '#4A7BF7', // Blue to match routines tab
    maroonSoft: '#E6EFFF', // Light blue background
    accentSoft: '#E6EFFF',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
  },
  dark: {
    text: '#F0F0F5',
    textSecondary: '#8B8B9E',
    textMuted: '#5B5B6E',
    background: '#0D0D0F', // very dark background
    surface: '#1A1A1F', // slightly lighter for cards
    surfaceElevated: '#242429', // even lighter for elevated elements
    tint: tintColorDark,
    border: '#2A2A30',
    tabIconDefault: '#5B5B6E',
    tabIconSelected: tintColorDark,
    maroon: '#4A7BF7', // Blue to match routines tab
    maroonSoft: '#182848', // Dark blue background
    accentSoft: '#182848',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
  },
};
