import { useEffect } from 'react';
import { useSharedValue, withTiming, withDelay, Easing } from 'react-native-reanimated';

export const useAnimatedEntry = (delay: number = 0, duration: number = 400) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  return { opacity, translateY };
};
