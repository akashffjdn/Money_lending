import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.message, { color: colors.text }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 140,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
});

export default LoadingOverlay;
