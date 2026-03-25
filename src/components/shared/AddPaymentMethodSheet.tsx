import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView } from '../../utils/MotiCompat';

import { useTheme } from '../../hooks/useTheme';
import { usePaymentStore } from '../../store/paymentStore';
import AppButton from '../ui/AppButton';
import { BorderRadius } from '../../constants/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type MethodType = 'upi' | 'bank' | 'card';
type Step = 'select_type' | 'form' | 'otp' | 'success';

export interface AddPaymentMethodSheetRef {
  open: () => void;
  close: () => void;
}

const METHOD_OPTIONS: Array<{
  type: MethodType;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  gradient: [string, string];
}> = [
  {
    type: 'upi',
    label: 'UPI',
    description: 'Google Pay, PhonePe, Paytm, BHIM',
    icon: 'cellphone',
    color: '#8B5CF6',
    gradient: ['#7C3AED', '#8B5CF6'],
  },
  {
    type: 'bank',
    label: 'Bank Account',
    description: 'Net Banking / Direct Debit',
    icon: 'bank',
    color: '#3B82F6',
    gradient: ['#2563EB', '#3B82F6'],
  },
  {
    type: 'card',
    label: 'Debit / Credit Card',
    description: 'Visa, Mastercard, RuPay',
    icon: 'credit-card',
    color: '#0EA5E9',
    gradient: ['#0284C7', '#0EA5E9'],
  },
];

const AddPaymentMethodSheet = forwardRef<AddPaymentMethodSheetRef>((_, ref) => {
  const { colors } = useTheme();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('select_type');
  const [methodType, setMethodType] = useState<MethodType>('upi');
  const [loading, setLoading] = useState(false);

  // UPI
  const [upiId, setUpiId] = useState('');

  // Bank
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  // Card
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 140, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateOut = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(cb);
  }, []);

  const resetForm = () => {
    setUpiId('');
    setAccountHolder('');
    setAccountNumber('');
    setIfscCode('');
    setBankName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setOtp(['', '', '', '', '', '']);
  };

  useImperativeHandle(ref, () => ({
    open: () => {
      setStep('select_type');
      resetForm();
      setLoading(false);
      setVisible(true);
      setTimeout(animateIn, 50);
    },
    close: () => handleClose(),
  }));

  const handleClose = useCallback(() => {
    animateOut(() => setVisible(false));
  }, []);

  const selectType = (type: MethodType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMethodType(type);
    resetForm();
    setStep('form');
  };

  const isFormValid = (): boolean => {
    switch (methodType) {
      case 'upi':
        return upiId.includes('@') && upiId.length >= 5;
      case 'bank':
        return accountHolder.length >= 3 && accountNumber.length >= 8 && ifscCode.length >= 11;
      case 'card':
        return cardNumber.replace(/\s/g, '').length >= 15 && cardExpiry.length >= 5 && cardCvv.length >= 3 && cardName.length >= 3;
      default:
        return false;
    }
  };

  const handleSubmitForm = async () => {
    if (!isFormValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('otp');
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) return;

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate OTP verification
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Add to store
    const { paymentMethods } = usePaymentStore.getState();
    const newMethod = {
      id: `PM${Date.now()}`,
      type: methodType,
      name: methodType === 'upi'
        ? upiId.split('@')[1]?.toUpperCase() ?? 'UPI'
        : methodType === 'bank'
          ? bankName || 'Bank Account'
          : `Card •••• ${cardNumber.slice(-4)}`,
      detail: methodType === 'upi'
        ? upiId
        : methodType === 'bank'
          ? `XXXX${accountNumber.slice(-4)}`
          : `XXXX${cardNumber.replace(/\s/g, '').slice(-4)}`,
      icon: methodType === 'upi' ? 'cellphone' : methodType === 'bank' ? 'bank' : 'credit-card',
      isDefault: paymentMethods.length === 0,
    };

    usePaymentStore.setState((state) => ({
      paymentMethods: [...state.paymentMethods, newMethod],
    }));

    setLoading(false);
    setStep('success');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  // ── Select Type Step ──
  const renderSelectTypeStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Add Payment Method</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Choose how you'd like to pay
      </Text>

      {METHOD_OPTIONS.map((option, index) => (
        <MotiView
          key={option.type}
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: index * 80 }}
        >
          <Pressable
            onPress={() => selectType(option.type)}
            style={({ pressed }) => [
              styles.typeCard,
              { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <LinearGradient
              colors={option.gradient}
              style={styles.typeIconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name={option.icon} size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.typeInfo}>
              <Text style={[styles.typeLabel, { color: colors.text }]}>{option.label}</Text>
              <Text style={[styles.typeDesc, { color: colors.textMuted }]}>{option.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        </MotiView>
      ))}

      {/* Security note */}
      <View style={[styles.securityNote, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="shield-lock" size={16} color={colors.success} />
        <Text style={[styles.securityNoteText, { color: colors.textMuted }]}>
          Your payment information is encrypted and securely stored as per RBI guidelines
        </Text>
      </View>
    </View>
  );

  // ── Form Step ──
  const renderFormStep = () => {
    const selectedOption = METHOD_OPTIONS.find((o) => o.type === methodType)!;

    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.stepContent}>
          {/* Header */}
          <View style={styles.formHeader}>
            <LinearGradient
              colors={selectedOption.gradient}
              style={styles.formHeaderIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name={selectedOption.icon} size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.formHeaderTitle, { color: colors.text }]}>
              Add {selectedOption.label}
            </Text>
          </View>

          {/* UPI Form */}
          {methodType === 'upi' && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>UPI ID</Text>
                <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                  <MaterialCommunityIcons name="at" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="yourname@upi"
                    placeholderTextColor={colors.textMuted}
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <Text style={[styles.inputHint, { color: colors.textMuted }]}>
                  Enter your UPI ID (e.g., username@ybl, username@paytm)
                </Text>
              </View>

              {/* Popular UPI Apps */}
              <Text style={[styles.popularLabel, { color: colors.textMuted }]}>Popular UPI Apps</Text>
              <View style={styles.upiAppsRow}>
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <Pressable
                    key={app}
                    onPress={() => {
                      const suffixes: Record<string, string> = { GPay: '@okicici', PhonePe: '@ybl', Paytm: '@paytm', BHIM: '@upi' };
                      if (!upiId.includes('@')) setUpiId(upiId + (suffixes[app] ?? '@upi'));
                    }}
                    style={[styles.upiAppChip, { backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.upiAppText, { color: colors.primary }]}>{app}</Text>
                  </Pressable>
                ))}
              </View>
            </MotiView>
          )}

          {/* Bank Form */}
          {methodType === 'bank' && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Account Holder Name</Text>
                <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                  <MaterialCommunityIcons name="account" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Full name as per bank"
                    placeholderTextColor={colors.textMuted}
                    value={accountHolder}
                    onChangeText={setAccountHolder}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Account Number</Text>
                <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                  <MaterialCommunityIcons name="numeric" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Enter account number"
                    placeholderTextColor={colors.textMuted}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroupRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>IFSC Code</Text>
                  <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="e.g., SBIN0001234"
                      placeholderTextColor={colors.textMuted}
                      value={ifscCode}
                      onChangeText={(t) => setIfscCode(t.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={11}
                    />
                  </View>
                </View>
                <View style={{ width: 12 }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bank Name</Text>
                  <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="e.g., SBI"
                      placeholderTextColor={colors.textMuted}
                      value={bankName}
                      onChangeText={setBankName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>
            </MotiView>
          )}

          {/* Card Form */}
          {methodType === 'card' && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Card Number</Text>
                <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                  <MaterialCommunityIcons name="credit-card-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.textMuted}
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cardholder Name</Text>
                <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                  <MaterialCommunityIcons name="account" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Name on card"
                    placeholderTextColor={colors.textMuted}
                    value={cardName}
                    onChangeText={setCardName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroupRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Expiry Date</Text>
                  <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textMuted}
                      value={cardExpiry}
                      onChangeText={formatExpiry}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>
                <View style={{ width: 12 }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CVV</Text>
                  <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="•••"
                      placeholderTextColor={colors.textMuted}
                      value={cardCvv}
                      onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').slice(0, 4))}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>
            </MotiView>
          )}

          <View style={styles.actionRow}>
            <AppButton
              title="Verify & Add"
              onPress={handleSubmitForm}
              fullWidth
              disabled={!isFormValid()}
            />
          </View>
          <Pressable onPress={() => setStep('select_type')} style={styles.backLink}>
            <MaterialCommunityIcons name="chevron-left" size={18} color={colors.textMuted} />
            <Text style={[styles.backLinkText, { color: colors.textMuted }]}>Change method type</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  // ── OTP Step ──
  const renderOtpStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.otpHeader}>
        <View style={[styles.otpIconCircle, { backgroundColor: colors.primaryMuted }]}>
          <MaterialCommunityIcons name="message-lock" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.otpTitle, { color: colors.text }]}>Verify OTP</Text>
        <Text style={[styles.otpSubtitle, { color: colors.textSecondary }]}>
          We've sent a 6-digit code to your registered mobile number
        </Text>
      </View>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => { otpRefs.current[index] = el; }}
            style={[
              styles.otpInput,
              {
                borderColor: digit ? colors.primary : colors.inputBorder,
                backgroundColor: colors.inputBg,
                color: colors.text,
              },
            ]}
            value={digit}
            onChangeText={(v) => handleOtpChange(v.replace(/\D/g, '').slice(0, 1), index)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>

      <Pressable style={styles.resendRow}>
        <Text style={[styles.resendText, { color: colors.textMuted }]}>
          Didn't receive the code?{' '}
        </Text>
        <Text style={[styles.resendLink, { color: colors.primary }]}>Resend OTP</Text>
      </Pressable>

      <View style={styles.actionRow}>
        <AppButton
          title="Verify"
          onPress={handleVerifyOtp}
          fullWidth
          loading={loading}
          disabled={otp.join('').length < 6}
        />
      </View>
      <Pressable onPress={() => setStep('form')} style={styles.backLink}>
        <MaterialCommunityIcons name="chevron-left" size={18} color={colors.textMuted} />
        <Text style={[styles.backLinkText, { color: colors.textMuted }]}>Back to form</Text>
      </Pressable>
    </View>
  );

  // ── Success Step ──
  const renderSuccessStep = () => {
    const selectedOption = METHOD_OPTIONS.find((o) => o.type === methodType)!;

    return (
      <View style={styles.resultContainer}>
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 120, delay: 100 }}
        >
          <LinearGradient
            colors={['#16A34A', '#22C55E']}
            style={styles.resultCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="check" size={42} color="#FFFFFF" />
          </LinearGradient>
        </MotiView>
        <Text style={[styles.resultTitle, { color: colors.text }]}>Method Added!</Text>
        <Text style={[styles.resultSubtext, { color: colors.textSecondary }]}>
          Your {selectedOption.label.toLowerCase()} has been verified and added successfully
        </Text>

        <View style={[styles.addedMethodCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={selectedOption.gradient}
            style={styles.addedMethodIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name={selectedOption.icon} size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.addedMethodInfo}>
            <Text style={[styles.addedMethodName, { color: colors.text }]}>
              {methodType === 'upi'
                ? upiId
                : methodType === 'bank'
                  ? bankName || 'Bank Account'
                  : `Card •••• ${cardNumber.slice(-4)}`}
            </Text>
            <Text style={[styles.addedMethodDetail, { color: colors.textMuted }]}>
              {selectedOption.label}
            </Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
        </View>

        <View style={styles.actionRow}>
          <AppButton title="Done" onPress={handleClose} fullWidth />
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 'select_type': return renderSelectTypeStep();
      case 'form': return renderFormStep();
      case 'otp': return renderOtpStep();
      case 'success': return renderSuccessStep();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]}>
            <Pressable style={styles.overlayPressable} onPress={handleClose} />
          </Animated.View>

          <Animated.View
            style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.handleBar}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
            </Pressable>

            {renderStepContent()}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

AddPaymentMethodSheet.displayName = 'AddPaymentMethodSheet';

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayPressable: { flex: 1 },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: 34,
  },
  handleBar: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  scrollContent: { maxHeight: SCREEN_HEIGHT * 0.72 },
  stepContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  stepTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  stepSubtitle: { fontSize: 14, marginBottom: 20 },

  // Type Cards
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  typeIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  typeInfo: { flex: 1, marginLeft: 14 },
  typeLabel: { fontSize: 15, fontWeight: '600' },
  typeDesc: { fontSize: 12, marginTop: 2 },

  securityNote: { flexDirection: 'row', padding: 12, borderRadius: 10, gap: 8, marginTop: 8, alignItems: 'flex-start' },
  securityNoteText: { fontSize: 12, flex: 1, lineHeight: 18 },

  // Form
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  formHeaderIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  formHeaderTitle: { fontSize: 18, fontWeight: '700', marginLeft: 12 },

  inputGroup: { marginBottom: 16 },
  inputGroupRow: { flexDirection: 'row' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, height: 48, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, fontWeight: '500', padding: 0 },
  inputHint: { fontSize: 12, marginTop: 6 },

  popularLabel: { fontSize: 12, fontWeight: '600', marginTop: 4, marginBottom: 10 },
  upiAppsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  upiAppChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  upiAppText: { fontSize: 13, fontWeight: '600' },

  actionRow: { marginTop: 24, paddingBottom: 8 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14 },

  // OTP
  otpHeader: { alignItems: 'center', marginBottom: 24 },
  otpIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  otpTitle: { fontSize: 20, fontWeight: '700' },
  otpSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  otpInput: { width: 44, height: 52, borderRadius: 12, borderWidth: 1.5, fontSize: 20, fontWeight: '700' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  resendText: { fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: '600' },

  // Result
  resultContainer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  resultCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  resultSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  addedMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 24,
    width: '100%',
  },
  addedMethodIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addedMethodInfo: { flex: 1, marginLeft: 12 },
  addedMethodName: { fontSize: 14, fontWeight: '600' },
  addedMethodDetail: { fontSize: 12, marginTop: 2 },
});

export default memo(AddPaymentMethodSheet);
