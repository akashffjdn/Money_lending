import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants/spacing';

interface RadioOption {
  label: string;
  value: string;
}

interface AppRadioProps {
  options: RadioOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const AppRadio: React.FC<AppRadioProps> = ({
  options,
  selectedValue,
  onSelect,
}) => {
  const { colors } = useTheme();

  const handlePress = async (value: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(value);
  };

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            style={styles.option}
          >
            <View
              style={[
                styles.outerCircle,
                { borderColor: isSelected ? colors.primary : colors.inputBorder },
              ]}
            >
              {isSelected && (
                <View
                  style={[styles.innerCircle, { backgroundColor: colors.primary }]}
                />
              )}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  outerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 12,
  },
});

export default AppRadio;
