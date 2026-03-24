import React, { createContext, useContext } from 'react';
import { Theme, lightTheme } from './themes';

export const ThemeContext = createContext<Theme>(lightTheme);

export const useThemeContext = () => useContext(ThemeContext);
