const tintColorLight = '#8B1818';
const tintColorDark = '#8B1818';

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
    maroon: '#8B1818',
    maroonSoft: '#FCE8E8',
    accentSoft: '#FCE8E8',
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
    maroon: '#8B1818',
    maroonSoft: '#2A0808',
    accentSoft: '#2A0808',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
  },
};
