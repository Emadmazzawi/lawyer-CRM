import { useAppTheme } from '@/src/providers/ThemeContext';

export const useColorScheme = (): 'light' | 'dark' => {
  const { colorScheme } = useAppTheme();
  return colorScheme;
};
