import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, Animated, Easing, type StyleProp, type TextStyle } from 'react-native';
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
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listenerId = animValue.addListener(({ value: v }) => {
      if (decimalPlaces > 0) {
        const factor = Math.pow(10, decimalPlaces);
        setDisplayValue(Math.round(v * factor) / factor);
      } else {
        setDisplayValue(Math.round(v));
      }
    });

    Animated.timing(animValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animValue.removeListener(listenerId);
    };
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
