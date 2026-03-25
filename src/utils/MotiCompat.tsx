/**
 * Drop-in replacement for MotiView and MotiText that uses
 * plain React Native Animated API. No reanimated dependency.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

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
  damping?: number;
  stiffness?: number;
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
  const opacity = useRef(new Animated.Value(from?.opacity ?? 1)).current;
  const scale = useRef(new Animated.Value(from?.scale ?? 1)).current;
  const translateY = useRef(new Animated.Value(from?.translateY ?? 0)).current;
  const translateX = useRef(new Animated.Value(from?.translateX ?? 0)).current;

  useEffect(() => {
    const delay = transition?.delay ?? 0;
    const duration = transition?.duration ?? 350;
    const anims: Animated.CompositeAnimation[] = [];

    const createAnim = (av: Animated.Value, toValue: number) => {
      if (transition?.type === 'spring') {
        return Animated.spring(av, {
          toValue,
          damping: transition?.damping ?? 15,
          stiffness: transition?.stiffness ?? 150,
          delay,
          useNativeDriver: true,
        });
      }
      return Animated.timing(av, {
        toValue,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    };

    if (animate?.opacity !== undefined) anims.push(createAnim(opacity, animate.opacity));
    if (animate?.scale !== undefined) anims.push(createAnim(scale, animate.scale));
    if (animate?.translateY !== undefined) anims.push(createAnim(translateY, animate.translateY));
    if (animate?.translateX !== undefined) anims.push(createAnim(translateX, animate.translateX));

    if (anims.length > 0) {
      Animated.parallel(anims).start();
    }
  }, [animate?.opacity, animate?.scale, animate?.translateY, animate?.translateX]);

  return {
    opacity,
    transform: [
      { scale },
      { translateY },
      { translateX },
    ],
  };
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
