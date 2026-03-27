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
  useWindowDimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView } from '../../utils/MotiCompat';

import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../utils/responsive';
import { usePaymentStore } from '../../store/paymentStore';
import AppButton from '../ui/AppButton';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { openRazorpayCheckout } from '../../utils/razorpay';

import type { UpcomingPayment } from '../../types/payment';
import { BorderRadius } from '../../constants/spacing';

export interface SinglePaymentSheetRef {
  open: (payment: UpcomingPayment) => void;
  close: () => void;
}

type Step = 'summary' | 'result';

const SinglePaymentSheet = forwardRef<SinglePaymentSheetRef>((_, ref) => {
  const { colors } = useTheme();
  const { isTablet } = useResponsive();
  const { height: screenHeight } = useWindowDimensions();
  const { processPayment, paymentMethods } = usePaymentStore();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('summary');
  const [payment, setPayment] = useState<UpcomingPayment | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
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
      Animated.timing(slideAnim, { toValue: screenHeight, duration: 250, useNativeDriver: true }),
    ]).start(cb);
  }, []);

  useImperativeHandle(ref, () => ({
    open: (p: UpcomingPayment) => {
      setPayment(p);
      setStep('summary');
      setSuccess(false);
      setTransactionId('');
      setVisible(true);
      setTimeout(animateIn, 50);
    },
    close: () => handleClose(),
  }));

  const handleClose = useCallback(() => {
    animateOut(() => setVisible(false));
  }, []);

  if (!payment) return null;

  const amount = payment.emiAmount;
  const estimatedPrincipal = Math.round(amount * 0.72);
  const estimatedInterest = amount - estimatedPrincipal;

  const handlePayWithRazorpay = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Close the sheet temporarily so Razorpay can show its UI
    animateOut();

    const result = await openRazorpayCheckout({
      amount,
      description: `EMI Payment - ${payment.loanType} (${payment.loanId})`,
      notes: {
        loanId: payment.loanId,
        loanType: payment.loanType,
        paymentType: 'single_emi',
      },
    });

    if (result.success) {
      setSuccess(true);
      setTransactionId(result.data.razorpay_payment_id);

      // Record in store
      const defaultMethod = paymentMethods.find((m) => m.isDefault);
      await processPayment(payment.loanId, amount, defaultMethod?.id ?? '');

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setSuccess(false);
      setTransactionId('');

      // If user cancelled, just return to summary
      if (result.error.code === 2) {
        animateIn();
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setStep('result');
    animateIn();
  };

  // ── Summary Step ──
  const renderSummaryStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Payment Summary</Text>

      {/* Loan Info Header */}
      <View style={[styles.loanHeader, { backgroundColor: colors.surface }]}>
        <View style={[styles.loanIconCircle, { backgroundColor: colors.primaryMuted }]}>
          <MaterialCommunityIcons name="wallet" size={22} color={colors.primary} />
        </View>
        <View style={styles.loanHeaderInfo}>
          <Text style={[styles.loanHeaderType, { color: colors.text }]}>{payment.loanType}</Text>
          <Text style={[styles.loanHeaderId, { color: colors.textMuted }]}>{payment.loanId}</Text>
        </View>
        {payment.isOverdue && (
          <View style={[styles.overdueTag, { backgroundColor: colors.errorMuted }]}>
            <Text style={[styles.overdueTagText, { color: colors.error }]}>Overdue</Text>
          </View>
        )}
      </View>

      {/* Amount Card */}
      <LinearGradient
        colors={['#0B1426', '#162240']}
        style={styles.amountCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.amountCardLabel}>EMI Amount</Text>
        <Text style={styles.amountCardValue}>{formatCurrency(amount)}</Text>
        <View style={styles.amountCardRow}>
          <View style={styles.amountCardBreakdown}>
            <Text style={styles.breakdownLabel}>Principal</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimatedPrincipal)}</Text>
          </View>
          <View style={[styles.amountDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
          <View style={styles.amountCardBreakdown}>
            <Text style={styles.breakdownLabel}>Interest</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimatedInterest)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Due Date Info */}
      <View style={[styles.dueDateRow, { backgroundColor: payment.isOverdue ? colors.errorMuted : colors.surface }]}>
        <MaterialCommunityIcons
          name="calendar-clock"
          size={18}
          color={payment.isOverdue ? colors.error : colors.primary}
        />
        <Text style={[styles.dueDateText, { color: payment.isOverdue ? colors.error : colors.textSecondary }]}>
          Due: {formatDate(payment.dueDate)}
          {payment.isOverdue
            ? ` (${Math.abs(payment.daysLeft)} days overdue)`
            : ` (${payment.daysLeft} days left)`}
        </Text>
      </View>

      {/* Secure Payment Badge */}
      <View style={[styles.secureBadge, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="shield-check" size={16} color={colors.success} />
        <Text style={[styles.secureBadgeText, { color: colors.textMuted }]}>
          Secured by Razorpay • 256-bit SSL Encrypted
        </Text>
      </View>

      <View style={styles.actionRow}>
        <AppButton
          title={`Pay ${formatCurrency(amount)}`}
          onPress={handlePayWithRazorpay}
          fullWidth
          leftIcon={
            <MaterialCommunityIcons name="lock" size={16} color="#FFFFFF" />
          }
        />
      </View>
    </View>
  );

  // ── Result Step ──
  const renderResultStep = () => {
    if (success) {
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
          <Text style={[styles.resultTitle, { color: colors.text }]}>Payment Successful!</Text>
          <Text style={[styles.resultAmount, { color: colors.success }]}>
            {formatCurrency(amount)}
          </Text>

          <View style={[styles.resultDetails, { backgroundColor: colors.surface }]}>
            <View style={styles.resultDetailRow}>
              <Text style={[styles.resultDetailLabel, { color: colors.textMuted }]}>
                Transaction ID
              </Text>
              <Text style={[styles.resultDetailValue, { color: colors.text }]} numberOfLines={1}>
                {transactionId}
              </Text>
            </View>
            <View style={[styles.resultDetailDivider, { backgroundColor: colors.border }]} />
            <View style={styles.resultDetailRow}>
              <Text style={[styles.resultDetailLabel, { color: colors.textMuted }]}>Loan</Text>
              <Text style={[styles.resultDetailValue, { color: colors.text }]}>
                {payment.loanType}
              </Text>
            </View>
            <View style={[styles.resultDetailDivider, { backgroundColor: colors.border }]} />
            <View style={styles.resultDetailRow}>
              <Text style={[styles.resultDetailLabel, { color: colors.textMuted }]}>
                Paid via
              </Text>
              <Text style={[styles.resultDetailValue, { color: colors.text }]}>Razorpay</Text>
            </View>
          </View>

          <View style={styles.doneActionRow}>
            <AppButton title="Done" onPress={handleClose} fullWidth size="lg" />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.resultContainer}>
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 120, delay: 100 }}
        >
          <View style={[styles.resultCircleFailed, { backgroundColor: `${colors.error}20` }]}>
            <MaterialCommunityIcons name="close" size={42} color={colors.error} />
          </View>
        </MotiView>
        <Text style={[styles.resultTitle, { color: colors.text }]}>Payment Failed</Text>
        <Text style={[styles.resultSubtext, { color: colors.textSecondary }]}>
          The payment could not be processed. Please try again.
        </Text>
        <View style={styles.failedActions}>
          <AppButton title="Retry Payment" onPress={handlePayWithRazorpay} fullWidth />
          <View style={{ height: 12 }} />
          <AppButton title="Cancel" onPress={handleClose} fullWidth variant="secondary" />
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 'summary': return renderSummaryStep();
      case 'result': return renderResultStep();
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
      <View style={[styles.overlay, isTablet && { alignItems: 'center' as const }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]}>
          <Pressable style={styles.overlayPressable} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }, isTablet && { maxWidth: 500 }]}
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
    </Modal>
  );
});

SinglePaymentSheet.displayName = 'SinglePaymentSheet';

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayPressable: { flex: 1 },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    minHeight: 320,
    maxHeight: '88%',
    paddingBottom: 34,
  },
  handleBar: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  stepContent: { paddingHorizontal: 20, paddingTop: 8 },
  stepTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },

  // Loan Header
  loanHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 16 },
  loanIconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  loanHeaderInfo: { flex: 1, marginLeft: 12 },
  loanHeaderType: { fontSize: 15, fontWeight: '600' },
  loanHeaderId: { fontSize: 12, marginTop: 2 },
  overdueTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  overdueTagText: { fontSize: 11, fontWeight: '700' },

  // Amount Card
  amountCard: { borderRadius: 16, padding: 20, marginBottom: 12 },
  amountCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8, fontWeight: '500' },
  amountCardValue: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginTop: 6 },
  amountCardRow: { flexDirection: 'row', marginTop: 16, gap: 16 },
  amountCardBreakdown: { flex: 1 },
  amountDivider: { width: 1 },
  breakdownLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  // Due Date
  dueDateRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 8, marginBottom: 4 },
  dueDateText: { fontSize: 13, fontWeight: '500' },

  // Secure Badge
  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, marginTop: 12, gap: 6 },
  secureBadgeText: { fontSize: 12, fontWeight: '500' },

  actionRow: { marginTop: 20, paddingBottom: 8 },
  doneActionRow: { width: '100%', marginTop: 28, paddingBottom: 8 },

  // Result
  resultContainer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  resultCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  resultCircleFailed: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '700', marginTop: 20 },
  resultAmount: { fontSize: 30, fontWeight: '700', marginTop: 8 },
  resultSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  resultDetails: { width: '100%', borderRadius: 14, padding: 16, marginTop: 24 },
  resultDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  resultDetailLabel: { fontSize: 13 },
  resultDetailValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  resultDetailDivider: { height: 1 },

  failedActions: { width: '100%', marginTop: 28, paddingBottom: 8 },
});

export default memo(SinglePaymentSheet);
