export const Colors = {
  // Primary: Rich gold — trust, wealth, premium
  primary: '#C8850A',
  primaryLight: '#E8A830',
  primaryDark: '#A06D08',
  primaryMuted: 'rgba(200, 133, 10, 0.12)',

  // Secondary: Deep navy
  secondary: '#0B1426',
  secondaryLight: '#162240',

  // Accent
  accent: '#0EA5E9',
  accentLight: '#38BDF8',

  // Semantic
  success: '#22C55E',
  successMuted: 'rgba(34, 197, 94, 0.12)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.12)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.12)',
  purple: '#8B5CF6',
  purpleMuted: 'rgba(139, 92, 246, 0.12)',

  // Gradient pairs
  gradientGold: ['#C8850A', '#E8A830'] as [string, string],
  gradientNavy: ['#0B1426', '#162240'] as [string, string],
  gradientSuccess: ['#16A34A', '#22C55E'] as [string, string],
  gradientBlue: ['#2563EB', '#3B82F6'] as [string, string],
  gradientPurple: ['#7C3AED', '#8B5CF6'] as [string, string],

  light: {
    background: '#F8F9FC',
    card: '#FFFFFF',
    surface: '#F1F3F8',
    surfaceHover: '#E8EBF2',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    inputBorder: '#CBD5E1',
    inputBg: '#F8FAFC',
    overlay: 'rgba(15, 23, 42, 0.5)',
  },
  dark: {
    background: '#060B14',
    card: '#111827',
    surface: '#1E293B',
    surfaceHover: '#334155',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    border: '#1E293B',
    inputBorder: '#334155',
    inputBg: '#0F172A',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
} as const;
