import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type KeyboardTypeOptions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

export interface AppInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  showCharCount?: boolean;
  editable?: boolean;
  multiline?: boolean;
}

const AppInput: React.FC<AppInputProps> = ({
  label,
  value,
  onChangeText,
  onBlur: onBlurProp,
  placeholder,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry,
  maxLength,
  keyboardType,
  autoCapitalize,
  showCharCount = false,
  editable = true,
  multiline = false,
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const labelPosition = useSharedValue(value ? 1 : 0);
  const borderColorProgress = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const prevError = useRef<string | undefined>(undefined);

  useEffect(() => {
    const isActive = isFocused || value.length > 0;
    labelPosition.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isFocused, value, labelPosition]);

  useEffect(() => {
    borderColorProgress.value = withTiming(isFocused ? 1 : 0, {
      duration: 200,
    });
  }, [isFocused, borderColorProgress]);

  useEffect(() => {
    if (error && error !== prevError.current) {
      shakeX.value = withSequence(
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
    prevError.current = error;
  }, [error, shakeX]);

  const animatedLabelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(labelPosition.value, [0, 1], [0, -24]);
    const scale = interpolate(labelPosition.value, [0, 1], [1, 0.75]);

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    if (error) {
      return { borderColor: colors.error };
    }

    const borderColor = interpolateColor(
      borderColorProgress.value,
      [0, 1],
      [colors.inputBorder, colors.primary]
    );

    return { borderColor };
  });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const labelColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.textMuted;

  const inputBgColor = error ? colors.errorMuted : colors.inputBg;

  return (
    <Animated.View style={[styles.wrapper, animatedContainerStyle]}>
      <Animated.View
        style={[
          styles.inputContainer,
          { backgroundColor: inputBgColor },
          animatedBorderStyle,
          multiline && styles.multilineContainer,
          isFocused && {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 2,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <View style={styles.inputWrapper}>
          <Animated.Text
            style={[
              styles.label,
              { color: labelColor },
              animatedLabelStyle,
            ]}
            pointerEvents="none"
          >
            {label}
          </Animated.Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={isFocused ? placeholder : undefined}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={secureTextEntry}
            maxLength={maxLength}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            editable={editable}
            multiline={multiline}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { setIsFocused(false); onBlurProp?.(); }}
            style={[
              styles.textInput,
              { color: colors.text },
              multiline && styles.multilineInput,
            ]}
          />
        </View>

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>

      <View style={styles.bottomRow}>
        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        ) : (
          <View />
        )}
        {showCharCount && maxLength && (
          <Text style={[styles.charCount, { color: colors.textMuted }]}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
  },
  multilineContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.1,
    transformOrigin: 'left center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.1,
    paddingVertical: 0,
    paddingTop: 8,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  leftIcon: {
    marginRight: 10,
    width: 20,
    alignItems: 'center',
  },
  rightIcon: {
    marginLeft: 10,
    width: 20,
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 20,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default AppInput;
