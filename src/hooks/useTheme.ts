import { useThemeContext } from '../theme/ThemeContext';

export const useTheme = () => {
  const theme = useThemeContext();
  return theme;
};
