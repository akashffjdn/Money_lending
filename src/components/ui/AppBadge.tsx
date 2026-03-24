import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface AppBadgeProps {
  label?: string;
  variant: BadgeVariant;
  dot?: boolean;
}

const AppBadge: React.FC<AppBadgeProps> = ({ label, variant, dot = false }) => {
  const { colors } = useTheme();

  const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: colors.successMuted, text: colors.success },
    warning: { bg: colors.warningMuted, text: colors.warning },
    error: { bg: colors.errorMuted, text: colors.error },
    info: { bg: colors.infoMuted, text: colors.info },
    neutral: { bg: colors.surface, text: colors.textSecondary },
  };

  const { bg, text } = variantColors[variant];

  if (dot) {
    return <View style={[styles.dot, { backgroundColor: text }]} />;
  }

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pill: {
    borderRadius: 9999,
    height: 24,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default AppBadge;
