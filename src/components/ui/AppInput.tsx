import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
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
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;
  const prevError = useRef<string | undefined>(undefined);

  const hasValue = value.length > 0;
  const isFloated = isFocused || hasValue;

  // Float label animation
  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFloated ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isFloated, labelAnim]);

  // Focus glow animation
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  // Error shake
  useEffect(() => {
    if (error && error !== prevError.current) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    prevError.current = error;
  }, [error, shakeAnim]);

  // Label interpolations
  const labelTranslateY = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.73],
  });

  // Colors
  const labelColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.textMuted;

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.inputBorder;

  const inputBgColor = !editable
    ? colors.surface
    : error
    ? colors.errorMuted
    : colors.inputBg;

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
      <TouchableWithoutFeedback onPress={handleContainerPress}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: inputBgColor,
              borderColor,
              borderWidth: isFocused ? 1.5 : 1,
            },
            multiline && styles.multilineContainer,
            isFocused && {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 2,
            },
          ]}
        >
          {leftIcon && (
            <View style={styles.leftIcon}>
              {React.isValidElement(leftIcon)
                ? React.cloneElement(leftIcon as React.ReactElement<any>, {
                    color: iconColor,
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
                    transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
                    top: multiline ? 14 : undefined,
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
              placeholderTextColor={colors.textMuted + '80'}
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
            />
          </View>

          {rightIcon && (
            <View style={styles.rightIcon}>
              {React.isValidElement(rightIcon)
                ? React.cloneElement(rightIcon as React.ReactElement<any>, {
                    color: iconColor,
                  })
                : rightIcon}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

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
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 14,
  },
  multilineContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  label: {
    position: 'absolute',
    left: 0,
    fontWeight: '500',
    letterSpacing: 0.1,
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
    paddingTop: 16,
  },
  leftIcon: {
    marginRight: 12,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcon: {
    marginLeft: 10,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
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
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AppInput;
