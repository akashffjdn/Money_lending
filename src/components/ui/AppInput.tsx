import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  type KeyboardTypeOptions,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AppInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
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
  onFocus: onFocusProp,
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
  const { colors, mode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const prevError = useRef<string | undefined>(undefined);

  const hasValue = value.length > 0;
  const isFloated = isFocused || hasValue;

  // Float label
  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFloated ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [isFloated, labelAnim]);

  // Focus border highlight
  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, borderAnim]);

  // Error shake
  useEffect(() => {
    if (error && error !== prevError.current) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
    prevError.current = error;
  }, [error, shakeAnim]);

  // Label interpolations
  const labelTranslateY = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -11],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.75],
  });

  const labelOpacity = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  // Animated border color
  const animatedBorderColor = error
    ? colors.error
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
          mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          colors.primary,
        ],
      });

  // Background
  const fillBg = !editable
    ? colors.surface
    : error
    ? colors.errorMuted
    : mode === 'dark'
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(0,0,0,0.02)';

  // Label color
  const labelColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.textMuted;

  // Icon color
  const iconColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.textMuted;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocusProp?.();
  }, [onFocusProp]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlurProp?.();
  }, [onBlurProp]);

  const handleContainerPress = useCallback(() => {
    if (editable) {
      inputRef.current?.focus();
    }
  }, [editable]);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateX: shakeAnim }] }]}>
      <Pressable onPress={handleContainerPress}>
        <Animated.View
          style={[
            styles.inputContainer,
            {
              backgroundColor: fillBg,
              borderColor: animatedBorderColor,
              borderWidth: isFocused ? 1.5 : 1,
            },
            multiline && styles.multilineContainer,
            isFocused && {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 2,
            },
          ]}
        >
          {leftIcon && (
            <View style={styles.leftIcon}>
              {React.isValidElement(leftIcon)
                ? React.cloneElement(leftIcon as React.ReactElement<any>, {
                    color: iconColor,
                    size: 20,
                  })
                : leftIcon}
            </View>
          )}

          <View style={[styles.inputWrapper, multiline && { alignSelf: 'stretch' }]}>
            {label ? (
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: labelColor,
                    opacity: labelOpacity,
                    transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
                    top: multiline ? 16 : undefined,
                  },
                ]}
                pointerEvents="none"
                numberOfLines={1}
              >
                {label}
              </Animated.Text>
            ) : null}

            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder={isFloated || !label ? placeholder : undefined}
              placeholderTextColor={colors.textMuted + '60'}
              secureTextEntry={secureTextEntry}
              maxLength={maxLength}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              editable={editable}
              multiline={multiline}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={[
                styles.textInput,
                {
                  color: editable ? colors.text : colors.textSecondary,
                },
                label ? { paddingTop: 10 } : { paddingTop: 0 },
                multiline && styles.multilineInput,
              ]}
              selectionColor={colors.primary + '60'}
              cursorColor={colors.primary}
            />
          </View>

          {rightIcon && (
            <View style={styles.rightIcon}>
              {React.isValidElement(rightIcon)
                ? React.cloneElement(rightIcon as React.ReactElement<any>, {
                    color: iconColor,
                    size: 20,
                  })
                : rightIcon}
            </View>
          )}
        </Animated.View>
      </Pressable>

      {(error || (showCharCount && maxLength)) && (
        <View style={styles.bottomRow}>
          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          ) : (
            <View />
          )}
          {showCharCount && maxLength && (
            <Text
              style={[
                styles.charCount,
                {
                  color: value.length >= maxLength ? colors.error : colors.textMuted,
                },
              ]}
            >
              {value.length}/{maxLength}
            </Text>
          )}
        </View>
      )}
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
    borderRadius: 14,
    height: 54,
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
    height: '100%',
  },
  label: {
    position: 'absolute',
    left: 0,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as any,
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 18,
  },
  leftIcon: {
    marginRight: 12,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcon: {
    marginLeft: 12,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 4,
    minHeight: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    flex: 1,
  },
  charCount: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default AppInput;
