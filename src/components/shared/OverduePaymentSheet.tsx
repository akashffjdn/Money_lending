import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
  useRef,
  useEffect,
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView } from '../../utils/MotiCompat';

import { useTheme } from '../../hooks/useTheme';
import { usePaymentStore } from '../../store/paymentStore';
import AppButton from '../ui/AppButton';
import { formatCurrency } from '../../utils/formatCurrency';
import { openRazorpayCheckout } from '../../utils/razorpay';

import type { UpcomingPayment } from '../../types/payment';
import { BorderRadius } from '../../constants/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface OverduePaymentSheetRef {
  open: (overduePayments: UpcomingPayment[]) => void;
  close: () => void;
}

type Step = 'summary' | 'result';

const OverduePaymentSheet = forwardRef<OverduePaymentSheetRef>((_, ref) => {
  const { colors } = useTheme();
  const { processPayment, paymentMethods } = usePaymentStore();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('summary');
  const [overdueItems, setOverdueItems] = useState<UpcomingPayment[]>([]);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Urgency pulse animation
  useEffect(() => {
    if (visible && step === 'summary') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [visible, step]);

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

  useImperativeHandle(ref, () => ({
    open: (payments: UpcomingPayment[]) => {
      setOverdueItems(payments);
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

  const totalEmi = overdueItems.reduce((sum, p) => sum + p.emiAmount, 0);
  const lateFeePerItem = 500;
  const totalLateFee = overdueItems.length * lateFeePerItem;
  const totalAmount = totalEmi + totalLateFee;
  const maxOverdueDays = Math.max(...overdueItems.map((p) => Math.abs(p.daysLeft)), 0);

  const handlePayWithRazorpay = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const loanIds = overdueItems.map((p) => p.loanId).join(', ');

    // Close sheet temporarily for Razorpay UI
    animateOut();

    const result = await openRazorpayCheckout({
      amount: totalAmount,
      description: `Overdue EMI Payment - ${overdueItems.length} EMI${overdueItems.length > 1 ? 's' : ''} + Late Fees`,
      notes: {
        loanIds,
        paymentType: 'overdue_emi',
        lateFee: String(totalLateFee),
      },
    });

    if (result.success) {
      setSuccess(true);
      setTransactionId(result.data.razorpay_payment_id);

      // Record in store
      const defaultMethod = paymentMethods.find((m) => m.isDefault);
      for (const p of overdueItems) {
        await processPayment(p.loanId, p.emiAmount + lateFeePerItem, defaultMethod?.id ?? '');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setSuccess(false);
      setTransactionId('');

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
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        {/* Urgency Header */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={['#DC2626', '#EF4444']}
            style={styles.urgencyHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.urgencyIconRow}>
              <MaterialCommunityIcons name="alert-circle" size={28} color="#FFFFFF" />
              <View style={styles.urgencyTextWrap}>
                <Text style={styles.urgencyTitle}>Overdue Payment</Text>
                <Text style={styles.urgencySubtitle}>
                  {overdueItems.length} EMI{overdueItems.length > 1 ? 's' : ''} overdue by {maxOverdueDays} days
                </Text>
              </View>
            </View>
            <Text style={styles.urgencyAmount}>{formatCurrency(totalAmount)}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Warning Note */}
        <View style={[styles.warningNote, { backgroundColor: `${colors.warning}12` }]}>
          <MaterialCommunityIcons name="information" size={16} color={colors.warning} />
          <Text style={[styles.warningNoteText, { color: colors.textSecondary }]}>
            Late payments may affect your credit score. Pay now to avoid further penalties.
          </Text>
        </View>

        {/* Breakdown */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Payment Breakdown</Text>

        {overdueItems.map((item, index) => (
          <MotiView
            key={item.loanId}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: index * 60 }}
          >
            <View style={[styles.overdueItem, { backgroundColor: colors.surface }]}>
              <View style={styles.overdueItemTop}>
                <View style={[styles.overdueItemIcon, { backgroundColor: `${colors.error}15` }]}>
                  <MaterialCommunityIcons name="alert" size={16} color={colors.error} />
                </View>
                <View style={styles.overdueItemInfo}>
                  <Text style={[styles.overdueItemLoan, { color: colors.text }]}>
                    {item.loanType}
                  </Text>
                  <Text style={[styles.overdueItemId, { color: colors.textMuted }]}>
                    {item.loanId} • {Math.abs(item.daysLeft)} days overdue
                  </Text>
                </View>
              </View>
              <View style={styles.overdueItemBreakdown}>
                <View style={styles.breakdownLine}>
                  <Text style={[styles.breakdownLineLabel, { color: colors.textSecondary }]}>
                    EMI Amount
                  </Text>
                  <Text style={[styles.breakdownLineValue, { color: colors.text }]}>
                    {formatCurrency(item.emiAmount)}
                  </Text>
                </View>
                <View style={styles.breakdownLine}>
                  <Text style={[styles.breakdownLineLabel, { color: colors.error }]}>
                    Late Fee
                  </Text>
                  <Text style={[styles.breakdownLineValue, { color: colors.error }]}>
                    +{formatCurrency(lateFeePerItem)}
                  </Text>
                </View>
              </View>
            </View>
          </MotiView>
        ))}

        {/* Total */}
        <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
          <View style={styles.totalLine}>
            <Text style={[styles.totalLineLabel, { color: colors.textMuted }]}>Total EMIs</Text>
            <Text style={[styles.totalLineValue, { color: colors.text }]}>{formatCurrency(totalEmi)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={[styles.totalLineLabel, { color: colors.error }]}>Total Late Fees</Text>
            <Text style={[styles.totalLineValue, { color: colors.error }]}>+{formatCurrency(totalLateFee)}</Text>
          </View>
          <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
          <View style={styles.totalLine}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Grand Total</Text>
            <Text style={[styles.grandTotalValue, { color: colors.error }]}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        {/* Secure Badge */}
        <View style={[styles.secureBadge, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="shield-check" size={16} color={colors.success} />
          <Text style={[styles.secureBadgeText, { color: colors.textMuted }]}>
            Secured by Razorpay • 256-bit SSL Encrypted
          </Text>
        </View>

        <View style={styles.actionRow}>
          <AppButton
            title={`Pay ${formatCurrency(totalAmount)} Now`}
            onPress={handlePayWithRazorpay}
            fullWidth
            variant="danger"
            leftIcon={<MaterialCommunityIcons name="lock" size={16} color="#FFFFFF" />}
          />
        </View>
      </View>
    </ScrollView>
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
          <Text style={[styles.resultTitle, { color: colors.text }]}>Overdue Cleared!</Text>
          <Text style={[styles.resultAmount, { color: colors.success }]}>
            {formatCurrency(totalAmount)}
          </Text>
          <Text style={[styles.resultSubtext, { color: colors.textSecondary }]}>
            Your account is now up to date
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
              <Text style={[styles.resultDetailLabel, { color: colors.textMuted }]}>
                EMIs Cleared
              </Text>
              <Text style={[styles.resultDetailValue, { color: colors.text }]}>
                {overdueItems.length}
              </Text>
            </View>
            <View style={[styles.resultDetailDivider, { backgroundColor: colors.border }]} />
            <View style={styles.resultDetailRow}>
              <Text style={[styles.resultDetailLabel, { color: colors.textMuted }]}>Paid via</Text>
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
          Please try again or use a different payment method.
        </Text>
        <View style={styles.failedActions}>
          <AppButton title="Retry Payment" onPress={handlePayWithRazorpay} fullWidth variant="danger" />
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
    </Modal>
  );
});

OverduePaymentSheet.displayName = 'OverduePaymentSheet';

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
  scrollContent: { maxHeight: SCREEN_HEIGHT * 0.76 },
  stepContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },

  // Urgency Header
  urgencyHeader: { borderRadius: 16, padding: 20, marginBottom: 16 },
  urgencyIconRow: { flexDirection: 'row', alignItems: 'center' },
  urgencyTextWrap: { marginLeft: 12, flex: 1 },
  urgencyTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  urgencySubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  urgencyAmount: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginTop: 12 },

  // Warning
  warningNote: { flexDirection: 'row', padding: 12, borderRadius: 10, gap: 8, marginBottom: 20, alignItems: 'flex-start' },
  warningNoteText: { fontSize: 12, flex: 1, lineHeight: 18 },

  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  // Overdue Item
  overdueItem: { borderRadius: 12, padding: 14, marginBottom: 10 },
  overdueItemTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  overdueItemIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  overdueItemInfo: { flex: 1, marginLeft: 10 },
  overdueItemLoan: { fontSize: 14, fontWeight: '600' },
  overdueItemId: { fontSize: 12, marginTop: 2 },
  overdueItemBreakdown: { paddingLeft: 42 },
  breakdownLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  breakdownLineLabel: { fontSize: 13 },
  breakdownLineValue: { fontSize: 13, fontWeight: '600' },

  // Total
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 4, marginBottom: 4 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLineLabel: { fontSize: 14 },
  totalLineValue: { fontSize: 14, fontWeight: '600' },
  totalDivider: { height: 1, marginVertical: 6 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700' },
  grandTotalValue: { fontSize: 20, fontWeight: '700' },

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

export default memo(OverduePaymentSheet);
