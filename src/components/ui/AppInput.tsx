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
  hint?: string;
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
  hint,
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const prevError = useRef<string | undefined>(undefined);

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

  // Colors
  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.inputBorder;

  const labelColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.textSecondary;

  const iconColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.textMuted;

  const bgColor = !editable
    ? colors.surface
    : error
    ? colors.errorMuted
    : colors.inputBg;

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
      {/* Static label above input */}
      {label ? (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      ) : null}

      {/* Input row */}
      <Pressable onPress={handleContainerPress}>
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: bgColor,
              borderColor,
              borderWidth: isFocused ? 1.5 : 1,
            },
            multiline && styles.multilineContainer,
          ]}
        >
          {leftIcon && (
            <View style={styles.leftIcon}>
              {React.isValidElement(leftIcon)
                ? React.cloneElement(leftIcon as React.ReactElement<any>, {
                    color: iconColor,
                    size: 18,
                  })
                : leftIcon}
            </View>
          )}

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
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
              multiline && styles.multilineInput,
            ]}
            selectionColor={colors.primary + '60'}
            cursorColor={colors.primary}
          />

          {rightIcon && (
            <View style={styles.rightIcon}>
              {React.isValidElement(rightIcon)
                ? React.cloneElement(rightIcon as React.ReactElement<any>, {
                    color: iconColor,
                    size: 18,
                  })
                : rightIcon}
            </View>
          )}
        </View>
      </Pressable>

      {/* Hint text */}
      {hint && !error ? (
        <Text style={[styles.hintText, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}

      {/* Error / char count row */}
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
  },
  multilineContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
    outlineStyle: 'none',
  } as any,
  multilineInput: {
    textAlignVertical: 'top',
    height: '100%',
  },
  leftIcon: {
    marginRight: 10,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcon: {
    marginLeft: 10,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 12,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 2,
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
