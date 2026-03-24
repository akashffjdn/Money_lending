import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  bgColor,
  children,
}) => {
  const { colors } = useTheme();

  const strokeColor = color ?? colors.primary;
  const bgStrokeColor = bgColor ?? colors.border;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 2000,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const offset = circumference * (1 - animatedProgress.value / 100);
    return {
      strokeDashoffset: offset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={bgStrokeColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      {children && (
        <View style={styles.centerContent}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProgressRing;
