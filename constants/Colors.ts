const tintColorLight = '#FF6B6B'; // Softer maroon/coral for general tint
const tintColorDark = '#FF6B6B'; // Coral for dark mode

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
    maroon: '#8B1A1A', // classic maroon for branding when needed
    maroonSoft: '#F8E7E7',
    accentSoft: '#FEF2F2',
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
    maroon: '#FF6B6B', // shifted to coral for contrast in dark mode
    maroonSoft: '#2D1515',
    accentSoft: '#2D1515',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
  },
};
