import React from 'react';
import { ThemeContext } from './ThemeContext';
import { useThemeStore } from '../store/themeStore';
import { lightTheme, darkTheme } from './themes';

interface Props {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<Props> = ({ children }) => {
  const isDark = useThemeStore((s) => s.isDark);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
