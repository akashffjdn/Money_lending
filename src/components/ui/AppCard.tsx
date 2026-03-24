import React from 'react';
import { Pressable, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Shadows } from '../../constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'elevated' | 'outlined' | 'flat';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  topStrip?: boolean;
}

const SPRING_CONFIG = { damping: 15, stiffness: 200 };

const AppCard: React.FC<AppCardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  style,
  topStrip = false,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.card,
          borderRadius: 16,
          ...Shadows.medium,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.surface,
          borderRadius: 16,
        };
      default:
        return {};
    }
  };

  const cardStyle = getCardStyle();

  const content = (
    <>
      {topStrip && (
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topStrip}
        />
      )}
      <View style={styles.content}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, cardStyle, topStrip && styles.cardWithStrip, animatedStyle, style]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[styles.card, cardStyle, topStrip && styles.cardWithStrip, animatedStyle, style]}
    >
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardWithStrip: {
    paddingTop: 0,
  },
  topStrip: {
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    padding: 20,
  },
});

export default AppCard;
