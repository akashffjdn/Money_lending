import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SectionProps {
  title: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

const Section: React.FC<SectionProps> = ({
  title,
  rightAction,
  children,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {rightAction && <View>{rightAction}</View>}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Section;
