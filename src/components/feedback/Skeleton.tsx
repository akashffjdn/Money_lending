import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  const { mode } = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 750 }),
        withTiming(0.3, { duration: 750 })
      ),
      -1
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const backgroundColor = mode === 'dark' ? '#2D3748' : '#E5E7EB';

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor,
          overflow: 'hidden',
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const SkeletonCard: React.FC = () => {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton width="100%" height={20} />
      <View style={skeletonStyles.gap} />
      <Skeleton width="60%" height={16} />
      <View style={skeletonStyles.gap} />
      <Skeleton width="40%" height={16} />
    </View>
  );
};

const SkeletonList: React.FC = () => {
  return (
    <View>
      {[0, 1, 2, 3].map((index) => (
        <View key={index} style={index > 0 ? skeletonStyles.listGap : undefined}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
};

const SkeletonAvatar: React.FC = () => {
  return <Skeleton width={48} height={48} borderRadius={24} />;
};

const skeletonStyles = StyleSheet.create({
  card: {
    padding: 16,
  },
  gap: {
    height: 8,
  },
  listGap: {
    marginTop: 12,
  },
});

export { Skeleton, SkeletonCard, SkeletonList, SkeletonAvatar };
export default Skeleton;
