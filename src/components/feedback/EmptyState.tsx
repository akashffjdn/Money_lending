import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import AppButton from '../ui/AppButton';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1
    );
  }, [translateY]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={iconAnimatedStyle}>
        <MaterialCommunityIcons
          name={icon}
          size={64}
          color={colors.textMuted}
        />
      </Animated.View>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <AppButton
            title={actionLabel}
            onPress={onAction}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  actionContainer: {
    marginTop: 24,
  },
});

export default EmptyState;
