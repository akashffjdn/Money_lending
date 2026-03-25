import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, type ViewStyle } from 'react-native';
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
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

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
          opacity,
        },
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
  card: { padding: 16 },
  gap: { height: 8 },
  listGap: { marginTop: 12 },
});

export { Skeleton, SkeletonCard, SkeletonList, SkeletonAvatar };
export default Skeleton;
