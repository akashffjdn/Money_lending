import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const sendOTP = useAuthStore((state) => state.sendOTP);

  const [phone, setPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rawDigits = phone.replace(/\s/g, '');
  const isValid = rawDigits.length === 10 && /^[6-9]/.test(rawDigits);

  const formatPhone = useCallback((text: string): string => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return digits;
  }, []);

  const handlePhoneChange = useCallback(
    (text: string) => {
      setError('');
      setPhone(formatPhone(text));
    },
    [formatPhone],
  );

  const handleClear = useCallback(() => {
    setPhone('');
    setError('');
  }, []);

  const handleSendOTP = useCallback(async () => {
    if (!isValid) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');

    try {
      await sendOTP(rawDigits);
      navigation.navigate('OTP', { phone: rawDigits });
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isValid, rawDigits, sendOTP, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dark header area */}
      <LinearGradient
        colors={['#0B1426', '#162240']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          {/* Back button */}
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

          {/* Header content */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing' as const, duration: 500 }}
            style={styles.headerContent}
          >
            <View style={styles.headerIconRow}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="cellphone" size={28} color="#E8A830" />
              </View>
            </View>
            <Text style={styles.headerTitle}>What's your{'\n'}phone number?</Text>
            <Text style={styles.headerSubtitle}>
              We'll send you a verification code
            </Text>
          </MotiView>
        </SafeAreaView>

        {/* Decorative circle */}
        <View style={styles.headerDecor} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.formArea}>
          {/* Phone Input */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing' as const, duration: 450, delay: 200 }}
          >
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Mobile Number
            </Text>

            <View
              style={[
                styles.phoneInputContainer,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: error
                    ? colors.error
                    : isFocused
                      ? colors.primary
                      : colors.inputBorder,
                },
              ]}
            >
              {/* Country Code */}
              <Pressable
                style={[styles.countryCode, { borderRightColor: colors.border }]}
              >
                <Text style={styles.flag}>&#127470;&#127475;</Text>
                <Text style={[styles.dialCode, { color: colors.text }]}>+91</Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>

              {/* Phone TextInput */}
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                value={phone}
                onChangeText={handlePhoneChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="98765 43210"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={11}
                autoFocus
              />

              {/* Clear / Valid indicator */}
              {rawDigits.length > 0 && (
                <Pressable onPress={handleClear} style={styles.clearButton} hitSlop={8}>
                  {isValid ? (
                    <View style={styles.validIcon}>
                      <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                    </View>
                  ) : (
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color={colors.textMuted}
                    />
                  )}
                </Pressable>
              )}
            </View>

            {/* Error */}
            {error.length > 0 && (
              <MotiView
                from={{ opacity: 0, translateY: -4 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing' as const, duration: 200 }}
                style={styles.errorRow}
              >
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </MotiView>
            )}
          </MotiView>

          {/* Send OTP Button */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing' as const, duration: 450, delay: 350 }}
          >
            <Pressable
              onPress={handleSendOTP}
              disabled={!isValid || loading}
              style={({ pressed }) => [
                styles.sendOtpButton,
                { opacity: !isValid || loading ? 0.45 : pressed ? 0.9 : 1 },
              ]}
            >
              <LinearGradient
                colors={['#C8850A', '#E8A830']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendOtpGradient}
              >
                {loading ? (
                  <MotiView
                    from={{ rotate: '0deg' }}
                    animate={{ rotate: '360deg' }}
                    transition={{ loop: true, type: 'timing' as const, duration: 800 }}
                  >
                    <MaterialCommunityIcons name="loading" size={22} color="#FFFFFF" />
                  </MotiView>
                ) : (
                  <View style={styles.sendOtpContent}>
                    <Text style={styles.sendOtpText}>Continue</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </MotiView>
        </View>

        {/* Bottom section */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing' as const, duration: 500, delay: 500 }}
          style={styles.bottomSection}
        >
          {/* Trust indicator */}
          <View style={styles.trustRow}>
            <MaterialCommunityIcons name="lock" size={13} color={colors.textMuted} />
            <Text style={[styles.trustText, { color: colors.textMuted }]}>
              Your data is protected with bank-grade encryption
            </Text>
          </View>

          {/* Terms */}
          <Text style={[styles.termsText, { color: colors.textMuted }]}>
            By continuing, you agree to our{' '}
            <Text style={[styles.termsLink, { color: colors.primary }]}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={[styles.termsLink, { color: colors.primary }]}>
              Privacy Policy
            </Text>
          </Text>
        </MotiView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Header */
  headerGradient: {
    paddingBottom: 32,
    overflow: 'hidden',
  },
  headerSafe: {
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  headerContent: {
    marginTop: 24,
    paddingBottom: 8,
  },
  headerIconRow: {
    marginBottom: 16,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  headerDecor: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(200,133,10,0.05)',
    top: -40,
    right: -60,
  },

  /* Form */
  keyboardView: {
    flex: 1,
  },
  formArea: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 56,
    paddingLeft: 4,
    paddingRight: 14,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    height: 32,
    gap: 4,
  },
  flag: {
    fontSize: 20,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingLeft: 14,
    paddingRight: 8,
    fontSize: 20,
    letterSpacing: 1.5,
    fontWeight: '600',
    height: '100%',
    outlineStyle: 'none',
  } as any,
  clearButton: {
    flexShrink: 0,
    marginLeft: 4,
  },
  validIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingLeft: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* Send OTP */
  sendOtpButton: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#C8850A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  sendOtpGradient: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOtpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendOtpText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Bottom */
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  trustText: {
    fontSize: 12,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: '600',
  },
});

export default LoginScreen;
