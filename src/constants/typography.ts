import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const Typography = {
  // Display — hero numbers, balances
  displayLarge: { fontSize: 40, lineHeight: 48, fontWeight: '700' as const, letterSpacing: -1.5, fontFamily },
  display: { fontSize: 34, lineHeight: 42, fontWeight: '700' as const, letterSpacing: -1, fontFamily },

  // Headings
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.5, fontFamily },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const, letterSpacing: -0.3, fontFamily },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: 0, fontFamily },

  // Body
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, letterSpacing: 0.1, fontFamily },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const, letterSpacing: 0.1, fontFamily },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: 0.2, fontFamily },

  // Utility
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.3, fontFamily },
  overline: { fontSize: 11, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily },

  // Interactive
  button: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, letterSpacing: 0.3, fontFamily },
  buttonSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, letterSpacing: 0.3, fontFamily },

  // Financial amounts — tabular nums
  amountLarge: { fontSize: 36, lineHeight: 44, fontWeight: '700' as const, letterSpacing: -1, fontFamily },
  amount: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.5, fontFamily },
  amountSmall: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: 0, fontFamily },
} as const;
