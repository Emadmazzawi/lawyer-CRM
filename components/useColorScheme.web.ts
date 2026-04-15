import { useAppTheme } from '@/src/providers/ThemeContext';

export function useColorScheme() {
  const { colorScheme } = useAppTheme();
  return colorScheme;
}
