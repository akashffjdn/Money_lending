import { Colors } from '../constants/colors';

export type ThemeType = 'light' | 'dark';

export interface Theme {
  mode: ThemeType;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryMuted: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    success: string;
    successMuted: string;
    error: string;
    errorMuted: string;
    warning: string;
    warningMuted: string;
    info: string;
    infoMuted: string;
    purple: string;
    purpleMuted: string;
    background: string;
    card: string;
    surface: string;
    surfaceHover: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    inputBorder: string;
    inputBg: string;
    overlay: string;
  };
}

const shared = {
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  primaryMuted: Colors.primaryMuted,
  secondary: Colors.secondary,
  secondaryLight: Colors.secondaryLight,
  accent: Colors.accent,
  success: Colors.success,
  successMuted: Colors.successMuted,
  error: Colors.error,
  errorMuted: Colors.errorMuted,
  warning: Colors.warning,
  warningMuted: Colors.warningMuted,
  info: Colors.info,
  infoMuted: Colors.infoMuted,
  purple: Colors.purple,
  purpleMuted: Colors.purpleMuted,
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    ...shared,
    ...Colors.light,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    ...shared,
    ...Colors.dark,
  },
};
