import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
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

interface RadioItemProps {
  option: RadioOption;
  isSelected: boolean;
  onPress: () => void;
  colors: {
    primary: string;
    text: string;
    border: string;
    inputBorder: string;
  };
}

const RadioItem: React.FC<RadioItemProps> = ({
  option,
  isSelected,
  onPress,
  colors,
}) => {
  const innerScale = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(isSelected ? 1 : 0, {
          damping: 15,
          stiffness: 200,
        }),
      },
    ],
    opacity: withSpring(isSelected ? 1 : 0),
  }));

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.option}>
      <View
        style={[
          styles.outerCircle,
          {
            borderColor: isSelected ? colors.primary : colors.inputBorder,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.innerCircle,
            { backgroundColor: colors.primary },
            innerScale,
          ]}
        />
      </View>
      <Text style={[styles.label, { color: colors.text }]}>
        {option.label}
      </Text>
    </Pressable>
  );
};

const AppRadio: React.FC<AppRadioProps> = ({
  options,
  selectedValue,
  onSelect,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <RadioItem
          key={option.value}
          option={option}
          isSelected={selectedValue === option.value}
          onPress={() => onSelect(option.value)}
          colors={colors}
        />
      ))}
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
