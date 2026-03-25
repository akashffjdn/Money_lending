import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
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
