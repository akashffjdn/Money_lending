import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from '../../utils/MotiCompat';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import MadeByFooter from '../../components/shared/MadeByFooter';
import { useResponsive } from '../../utils/responsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

const OTP_LENGTH = 6;
const COUNTDOWN = 30;

const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone } = route.params;
  const { colors } = useTheme();
  const { s, isTablet, width } = useResponsive();
  const { verifyOTP, sendOTP } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [successState, setSuccessState] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shakeX = useRef(new Animated.Value(0)).current;
  const boxScales = useRef(Array.from({ length: OTP_LENGTH }, () => new Animated.Value(1))).current;

  const maskedPhone = phone.length > 5
    ? `+91 ${phone.slice(0, 5)} XXXXX`
    : `+91 ${phone}`;

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeX]);

  const handleVerify = useCallback(
    async (otpString: string) => {
      if (loading || successState) return;
      setLoading(true);
      setErrorState(false);

      try {
        const result = await verifyOTP(phone, otpString);

        setSuccessState(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
          if (result?.isNewUser) {
            navigation.replace('PersonalInfo');
          }
        }, 800);
      } catch {
        setErrorState(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        triggerShake();

        setTimeout(() => {
          setErrorState(false);
          setOtp(Array(OTP_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        }, 1000);
      } finally {
        setLoading(false);
      }
    },
    [loading, successState, verifyOTP, phone, navigation, triggerShake],
  );

  const handleDigitChange = useCallback(
    (text: string, index: number) => {
      const digit = text.replace(/\D/g, '').slice(-1);

      setOtp((prev) => {
        const updated = [...prev];
        updated[index] = digit;

        if (digit && updated.every((d) => d !== '')) {
          const otpString = updated.join('');
          setTimeout(() => handleVerify(otpString), 100);
        }

        return updated;
      });

      if (digit) {
        Animated.sequence([
          Animated.spring(boxScales[index], { toValue: 1.15, damping: 6, useNativeDriver: true }),
          Animated.spring(boxScales[index], { toValue: 1.0, useNativeDriver: true }),
        ]).start();
      }

      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [boxScales, handleVerify],
  );

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
        setOtp((prev) => {
          const updated = [...prev];
          updated[index - 1] = '';
          return updated;
        });
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const handleResend = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendOTP(phone);
      setSecondsLeft(COUNTDOWN);
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // silently fail
    }
  }, [phone, sendOTP]);

  const shakeAnimatedStyle = {
    transform: [{ translateX: shakeX }],
  };

  const getBorderColor = (index: number): string => {
    if (successState) return colors.success;
    if (errorState) return colors.error;
    if (otp[index] !== '') return colors.primary;
    return colors.inputBorder;
  };

  const getBoxBg = (index: number): string => {
    if (successState) return 'rgba(34,197,94,0.08)';
    if (errorState) return 'rgba(239,68,68,0.06)';
    if (otp[index] !== '') return colors.primaryMuted;
    return colors.inputBg;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dark header */}
      <LinearGradient
        colors={['#0B1426', '#162240']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={({ pressed }) => [
                styles.backButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing' as const, duration: 450 }}
            style={styles.headerContent}
          >
            <View style={styles.headerIconRow}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="message-lock" size={28} color="#E8A830" />
              </View>
            </View>
            <Text style={styles.headerTitle}>Verify your{'\n'}phone number</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.headerSubtitle}>
                Code sent to{' '}
                <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
              </Text>
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={8}
              >
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
            </View>
          </MotiView>
        </SafeAreaView>

        <View style={styles.headerDecor} />
      </LinearGradient>

      {/* OTP Form */}
      <View style={styles.formArea}>
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing' as const, duration: 400, delay: 150 }}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Enter 6-digit OTP
          </Text>

          <Animated.View style={[styles.otpContainer, shakeAnimatedStyle]}>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => {
              const scaleStyle = {
                transform: [{ scale: boxScales[index] }],
              };

              return (
                <Animated.View key={index} style={[styles.otpBoxWrapper, scaleStyle]}>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpBox,
                      {
                        borderColor: getBorderColor(index),
                        backgroundColor: getBoxBg(index),
                        color: successState
                          ? colors.success
                          : errorState
                            ? colors.error
                            : colors.text,
                      },
                    ]}
                    value={otp[index]}
                    onChangeText={(text) => handleDigitChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                    editable={!loading && !successState}
                  />
                  {/* Success check */}
                  {successState && otp[index] !== '' && (
                    <MotiView
                      from={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: 'spring' as const,
                        delay: index * 60,
                      }}
                      style={styles.checkOverlay}
                    >
                      <View style={styles.checkCircle}>
                        <MaterialCommunityIcons
                          name="check"
                          size={10}
                          color="#FFFFFF"
                        />
                      </View>
                    </MotiView>
                  )}
                </Animated.View>
              );
            })}
          </Animated.View>
        </MotiView>

        {/* Loading state */}
        {loading && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing' as const, duration: 200 }}
            style={styles.loadingRow}
          >
            <View style={[styles.loadingDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Verifying...
            </Text>
          </MotiView>
        )}

        {/* Error message */}
        {errorState && (
          <MotiView
            from={{ opacity: 0, translateY: -4 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing' as const, duration: 200 }}
            style={styles.errorRow}
          >
            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              Invalid OTP. Please try again.
            </Text>
          </MotiView>
        )}

        {/* Timer / Resend */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing' as const, duration: 400, delay: 300 }}
          style={styles.timerSection}
        >
          {secondsLeft > 0 ? (
            <View style={styles.timerRow}>
              <Text style={[styles.timerLabel, { color: colors.textMuted }]}>
                Resend code in
              </Text>
              <View style={[styles.timerBadge, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.timerValue, { color: colors.primary }]}>
                  0:{secondsLeft.toString().padStart(2, '0')}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.resendRow}>
              <Text style={[styles.timerLabel, { color: colors.textMuted }]}>
                Didn't receive the code?
              </Text>
              <Pressable onPress={handleResend} hitSlop={8}>
                <Text style={[styles.resendText, { color: colors.primary }]}>
                  Resend OTP
                </Text>
              </Pressable>
            </View>
          )}
        </MotiView>

        <MadeByFooter />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Header */
  headerGradient: {
    paddingBottom: 28,
    overflow: 'hidden',
  },
  headerSafe: {
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    marginTop: 20,
    paddingBottom: 4,
  },
  headerIconRow: {
    marginBottom: 14,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(232,168,48,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  phoneHighlight: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editLink: {
    color: '#E8A830',
    fontSize: 14,
    fontWeight: '600',
  },
  headerDecor: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(200,133,10,0.04)',
    top: -30,
    right: -50,
  },

  /* Form */
  formArea: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 18,
    textTransform: 'uppercase',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  otpBoxWrapper: {
    position: 'relative',
  },
  otpBox: {
    width: 50,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    outlineStyle: 'none',
  } as any,
  checkOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Loading */
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* Error */
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* Timer */
  timerSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerLabel: {
    fontSize: 14,
  },
  timerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default OTPScreen;
