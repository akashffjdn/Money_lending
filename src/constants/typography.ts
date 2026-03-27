import { Platform, useWindowDimensions } from 'react-native';
import { moderateScale } from '../utils/responsive';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// --- Base values (unscaled design tokens, targeting ~390pt width) ---
const BASE = {
  displayLarge: { fontSize: 40, lineHeight: 48 },
  display: { fontSize: 34, lineHeight: 42 },
  h1: { fontSize: 28, lineHeight: 36 },
  h2: { fontSize: 22, lineHeight: 28 },
  h3: { fontSize: 18, lineHeight: 24 },
  bodyLarge: { fontSize: 16, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  overline: { fontSize: 11, lineHeight: 16 },
  button: { fontSize: 16, lineHeight: 24 },
  buttonSmall: { fontSize: 14, lineHeight: 20 },
  amountLarge: { fontSize: 36, lineHeight: 44 },
  amount: { fontSize: 24, lineHeight: 32 },
  amountSmall: { fontSize: 18, lineHeight: 24 },
} as const;

// --- Style metadata (weight, spacing, etc.) ---
const META = {
  displayLarge: { fontWeight: '700' as const, letterSpacing: -1.5, fontFamily },
  display: { fontWeight: '700' as const, letterSpacing: -1, fontFamily },
  h1: { fontWeight: '700' as const, letterSpacing: -0.5, fontFamily },
  h2: { fontWeight: '600' as const, letterSpacing: -0.3, fontFamily },
  h3: { fontWeight: '600' as const, letterSpacing: 0, fontFamily },
  bodyLarge: { fontWeight: '400' as const, letterSpacing: 0.1, fontFamily },
  body: { fontWeight: '400' as const, letterSpacing: 0.1, fontFamily },
  bodySmall: { fontWeight: '400' as const, letterSpacing: 0.2, fontFamily },
  caption: { fontWeight: '500' as const, letterSpacing: 0.3, fontFamily },
  overline: { fontWeight: '600' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily },
  button: { fontWeight: '600' as const, letterSpacing: 0.3, fontFamily },
  buttonSmall: { fontWeight: '600' as const, letterSpacing: 0.3, fontFamily },
  amountLarge: { fontWeight: '700' as const, letterSpacing: -1, fontFamily },
  amount: { fontWeight: '700' as const, letterSpacing: -0.5, fontFamily },
  amountSmall: { fontWeight: '600' as const, letterSpacing: 0, fontFamily },
} as const;

type TypographyKeys = keyof typeof BASE;
type TypographyStyle = {
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  letterSpacing: number;
  fontFamily: string;
  textTransform?: 'uppercase';
};
type TypographyMap = Record<TypographyKeys, TypographyStyle>;

// --- Hook: returns scaled typography (re-renders on dimension change) ---
export const useTypography = (): TypographyMap => {
  const { width } = useWindowDimensions(); // Responsive: re-renders on rotation/resize
  const result = {} as TypographyMap;

  for (const key of Object.keys(BASE) as TypographyKeys[]) {
    const { fontSize, lineHeight } = BASE[key];
    result[key] = {
      ...META[key],
      fontSize: moderateScale(fontSize, width, 0.25), // Responsive: gentle font scaling
      lineHeight: moderateScale(lineHeight, width, 0.25), // Responsive: scaled lineHeight
    } as TypographyStyle;
  }

  return result;
};

// --- Static export (backwards-compatible, for non-component code) ---
// Screens/components should prefer useTypography().
export const Typography = {
  displayLarge: { ...BASE.displayLarge, ...META.displayLarge },
  display: { ...BASE.display, ...META.display },
  h1: { ...BASE.h1, ...META.h1 },
  h2: { ...BASE.h2, ...META.h2 },
  h3: { ...BASE.h3, ...META.h3 },
  bodyLarge: { ...BASE.bodyLarge, ...META.bodyLarge },
  body: { ...BASE.body, ...META.body },
  bodySmall: { ...BASE.bodySmall, ...META.bodySmall },
  caption: { ...BASE.caption, ...META.caption },
  overline: { ...BASE.overline, ...META.overline },
  button: { ...BASE.button, ...META.button },
  buttonSmall: { ...BASE.buttonSmall, ...META.buttonSmall },
  amountLarge: { ...BASE.amountLarge, ...META.amountLarge },
  amount: { ...BASE.amount, ...META.amount },
  amountSmall: { ...BASE.amountSmall, ...META.amountSmall },
} as const;
