import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Shadows } from '../../constants/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const SIZE_CONFIG: Record<ButtonSize, { height: number; fontSize: number; paddingH: number }> = {
  sm: { height: 36, fontSize: 13, paddingH: 16 },
  md: { height: 48, fontSize: 15, paddingH: 24 },
  lg: { height: 52, fontSize: 16, paddingH: 28 },
};

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  variant = 'primary',
  size = 'md',
}) => {
  const { colors } = useTheme();

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const { height, fontSize, paddingH } = SIZE_CONFIG[size];

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      height,
      borderRadius: 14,
      paddingHorizontal: paddingH,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    };

    if (fullWidth) {
      base.width = '100%';
    }

    switch (variant) {
      case 'secondary':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: colors.error,
          borderRadius: 14,
        };
      case 'primary':
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize,
      fontWeight: '600',
      letterSpacing: 0.3,
    };

    switch (variant) {
      case 'secondary':
      case 'ghost':
        return { ...base, color: colors.primary };
      case 'danger':
      case 'primary':
      default:
        return { ...base, color: '#FFFFFF' };
    }
  };

  const getIndicatorColor = (): string => {
    return variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : colors.primary;
  };

  const containerStyle = getContainerStyle();
  const textStyle = getTextStyle();

  const renderInner = () => (
    <>
      {loading ? (
        <ActivityIndicator color={getIndicatorColor()} size="small" />
      ) : (
        <>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={textStyle}>{title}</Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </>
      )}
    </>
  );

  const wrapperStyle = fullWidth ? styles.fullWidth : undefined;
  const disabledStyle = disabled ? styles.disabled : undefined;

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          wrapperStyle,
          pressed && !disabled && !loading && { transform: [{ scale: 0.97 }] },
        ]}
      >
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            containerStyle,
            !disabled && Shadows.glow,
            disabledStyle,
          ]}
        >
          {renderInner()}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        wrapperStyle,
        pressed && !disabled && !loading && { transform: [{ scale: 0.97 }] },
      ]}
    >
      {({ pressed }: { pressed: boolean }) => (
        <View
          style={[
            containerStyle,
            disabledStyle,
            variant === 'ghost' && pressed && !disabled && !loading
              ? { backgroundColor: colors.primaryMuted }
              : undefined,
          ]}
        >
          {renderInner()}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.4,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  fullWidth: {
    width: '100%',
  },
});

export default AppButton;
