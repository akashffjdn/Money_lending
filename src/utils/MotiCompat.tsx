/**
 * Drop-in replacement for MotiView and MotiText that uses
 * plain Reanimated Animated components. Works in Expo Go without
 * native module issues.
 *
 * Supports the basic from/animate/transition props that moti uses.
 */
import React, { useEffect } from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  type WithTimingConfig,
  type SharedValue,
} from 'react-native-reanimated';

interface AnimateProps {
  opacity?: number;
  scale?: number;
  translateY?: number;
  translateX?: number;
}

interface TransitionProps {
  type?: 'timing' | 'spring';
  duration?: number;
  delay?: number;
}

interface MotiCompatProps {
  from?: AnimateProps;
  animate?: AnimateProps;
  transition?: TransitionProps;
  delay?: number;
  style?: any;
  children?: React.ReactNode;
  [key: string]: any;
}

function useMotion(from?: AnimateProps, animate?: AnimateProps, transition?: TransitionProps) {
  const opacity = useSharedValue(from?.opacity ?? 1);
  const scale = useSharedValue(from?.scale ?? 1);
  const translateY = useSharedValue(from?.translateY ?? 0);
  const translateX = useSharedValue(from?.translateX ?? 0);

  useEffect(() => {
    const config: WithTimingConfig = { duration: transition?.duration ?? 350 };
    const delay = transition?.delay ?? 0;
    const anim = (target: number, sv: SharedValue<number>) => {
      const fn = transition?.type === 'spring'
        ? () => withSpring(target)
        : () => withTiming(target, config);
      sv.value = delay > 0 ? withDelay(delay, fn()) : fn();
    };

    if (animate?.opacity !== undefined) anim(animate.opacity, opacity);
    if (animate?.scale !== undefined) anim(animate.scale, scale);
    if (animate?.translateY !== undefined) anim(animate.translateY, translateY);
    if (animate?.translateX !== undefined) anim(animate.translateX, translateX);
  }, [animate, transition]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return animatedStyle;
}

export const MotiView = React.forwardRef<any, MotiCompatProps>(
  ({ from, animate, transition, delay, style, children, ...rest }, ref) => {
    const trans = delay ? { ...transition, delay } : transition;
    const animatedStyle = useMotion(from, animate, trans);
    return (
      <Animated.View ref={ref} style={[animatedStyle, style]} {...rest}>
        {children}
      </Animated.View>
    );
  }
);

export const MotiText = React.forwardRef<any, MotiCompatProps>(
  ({ from, animate, transition, delay, style, children, ...rest }, ref) => {
    const trans = delay ? { ...transition, delay } : transition;
    const animatedStyle = useMotion(from, animate, trans);
    return (
      <Animated.Text ref={ref} style={[animatedStyle, style]} {...rest}>
        {children}
      </Animated.Text>
    );
  }
);
