import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AppChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
}

const SPRING_CONFIG = { damping: 15, stiffness: 200 };

const AppChip: React.FC<AppChipProps> = ({
  label,
  selected = false,
  onPress,
  leftIcon,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const handlePress = async () => {
    if (!onPress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      <View
        style={[
          styles.chip,
          selected
            ? { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1 }
            : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <Animated.Text
          style={[
            styles.label,
            { color: selected ? '#FFFFFF' : colors.textSecondary },
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    height: 36,
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default AppChip;
