import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
  style?: StyleProp<TextStyle>;
}

const formatIndian = (num: number, decimalPlaces: number): string => {
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const fixed = absNum.toFixed(decimalPlaces);
  const [intPart, decPart] = fixed.split('.');

  if (intPart.length <= 3) {
    const formatted = decPart ? `${intPart}.${decPart}` : intPart;
    return isNegative ? `-${formatted}` : formatted;
  }

  const lastThree = intPart.slice(-3);
  const remaining = intPart.slice(0, -3);

  const grouped = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const result = `${grouped},${lastThree}`;
  const formatted = decPart ? `${result}.${decPart}` : result;

  return isNegative ? `-${formatted}` : formatted;
};

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimalPlaces = 0,
  style,
}) => {
  const { colors } = useTheme();
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useAnimatedReaction(
    () => {
      if (decimalPlaces > 0) {
        const factor = Math.pow(10, decimalPlaces);
        return Math.round(animatedValue.value * factor) / factor;
      }
      return Math.round(animatedValue.value);
    },
    (current) => {
      runOnJS(setDisplayValue)(current);
    },
  );

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration]);

  const formattedValue = formatIndian(displayValue, decimalPlaces);

  return (
    <Text style={[styles.text, { color: colors.text }, style]}>
      {prefix}
      {formattedValue}
      {suffix}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 24,
    fontWeight: '700',
  },
});

export default AnimatedCounter;
