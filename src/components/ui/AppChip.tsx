import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';

interface AppChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
}

const AppChip: React.FC<AppChipProps> = ({
  label,
  selected = false,
  onPress,
  leftIcon,
}) => {
  const { colors } = useTheme();

  const handlePress = async () => {
    if (!onPress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => pressed && { transform: [{ scale: 0.95 }] }}
    >
      <View
        style={[
          styles.chip,
          selected
            ? {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                borderWidth: 1.5,
                shadowColor: '#C8850A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
              }
            : {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <Text
          style={[
            styles.label,
            { color: selected ? '#FFFFFF' : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 18,
    gap: 6,
  },
  leftIcon: {
    marginRight: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default AppChip;
