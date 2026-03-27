import { useWindowDimensions } from 'react-native';
import { moderateScale } from '../utils/responsive';

// --- Base values (unscaled, used as design tokens) ---
const BASE_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

const BASE_SCREEN_PADDING = {
  horizontal: 20,
  vertical: 24,
} as const;

const BASE_BORDER_RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
} as const;

// --- Scaled helpers (factor 0.3 = gentle scaling, prevents extreme sizes) ---
const scaleObj = <T extends Record<string, number>>(
  obj: T,
  screenWidth: number,
  factor: number = 0.3,
): { [K in keyof T]: number } => {
  const result = {} as { [K in keyof T]: number };
  for (const key in obj) {
    const val = obj[key];
    // Don't scale 9999 (full border radius)
    result[key] = val >= 9999 ? val : moderateScale(val, screenWidth, factor);
  }
  return result;
};

// --- Hook: returns scaled spacing values (re-renders on dimension change) ---
export const useSpacing = () => {
  const { width } = useWindowDimensions(); // Responsive: re-renders on rotation/resize
  return {
    Spacing: scaleObj(BASE_SPACING, width),
    ScreenPadding: scaleObj(BASE_SCREEN_PADDING, width),
    BorderRadius: scaleObj(BASE_BORDER_RADIUS, width),
  };
};

// --- Static exports (backwards-compatible, for non-component code) ---
// These remain unscaled; screens/components should prefer useSpacing().
export const Spacing = { ...BASE_SPACING };
export const ScreenPadding = { ...BASE_SCREEN_PADDING };
export const BorderRadius = { ...BASE_BORDER_RADIUS };

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: '#C8850A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glowSuccess: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
