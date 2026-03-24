import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface DividerProps {
  style?: ViewStyle;
}

const Divider: React.FC<DividerProps> = ({ style }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.divider, { backgroundColor: colors.border }, style]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginVertical: 12,
  },
});

export default Divider;
