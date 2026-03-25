import React from 'react';
import { Pressable, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Shadows } from '../../constants/spacing';

type CardVariant = 'elevated' | 'outlined' | 'flat';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  topStrip?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  style,
  topStrip = false,
}) => {
  const { colors } = useTheme();

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
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          cardStyle,
          topStrip && styles.cardWithStrip,
          style,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.card, cardStyle, topStrip && styles.cardWithStrip, style]}
    >
      {content}
    </View>
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
