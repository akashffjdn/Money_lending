import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
  useRef,
  useMemo,
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
import { formatDate } from '../../utils/formatDate';
import { openRazorpayCheckout } from '../../utils/razorpay';

import { BorderRadius } from '../../constants/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LOAN_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  Personal: 'account-cash',
  Home: 'home-city',
  Vehicle: 'car',
  Education: 'school',
  Business: 'briefcase',
  Gold: 'gold',
  Medical: 'medical-bag',
};

export interface BulkPaymentSheetRef {
  open: () => void;
  close: () => void;
}

type Step = 'select' | 'summary' | 'result';

const BulkPaymentSheet = forwardRef<BulkPaymentSheetRef>((_, ref) => {
  const { colors } = useTheme();
  const { upcomingPayments, processPayment, paymentMethods } = usePaymentStore();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('select');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

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

  useImperativeHandle(ref, () => ({
    open: () => {
      const allIds = new Set(upcomingPayments.map((p) => p.loanId));
      setSelectedIds(allIds);
      setStep('select');
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

  const selectedPayments = useMemo(
    () => upcomingPayments.filter((p) => selectedIds.has(p.loanId)),
    [upcomingPayments, selectedIds],
  );

  const totalAmount = useMemo(
    () => selectedPayments.reduce((sum, p) => sum + p.emiAmount, 0),
    [selectedPayments],
  );

  const toggleSelect = (loanId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(loanId)) next.delete(loanId);
      else next.add(loanId);
      return next;
    });
  };

  const toggleAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedIds.size === upcomingPayments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(upcomingPayments.map((p) => p.loanId)));
    }
  };

  const getLoanIcon = (loanType: string) => {
    const key = Object.keys(LOAN_ICONS).find((k) =>
      loanType.toLowerCase().includes(k.toLowerCase()),
    );
    return LOAN_ICONS[key ?? ''] ?? 'cash';
  };

  const handleProceed = () => {
    if (selectedIds.size === 0) return;
    setStep('summary');
  };

  const handlePayWithRazorpay = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const loanIds = selectedPayments.map((p) => p.loanId).join(', ');

    // Close sheet temporarily for Razorpay UI
    animateOut();

    const result = await openRazorpayCheckout({
      amount: totalAmount,
      description: `Bulk EMI Payment - ${selectedPayments.length} EMIs`,
      notes: {
        loanIds,
        paymentType: 'bulk_emi',
        emiCount: String(selectedPayments.length),
      },
    });

    if (result.success) {
      setSuccess(true);
      setTransactionId(result.data.razorpay_payment_id);

      // Record each payment in store
      const defaultMethod = paymentMethods.find((m) => m.isDefault);
      for (const p of selectedPayments) {
        await processPayment(p.loanId, p.emiAmount, defaultMethod?.id ?? '');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setSuccess(false);
      setTransactionId('');

      // User cancelled — go back to summary
      if (result.error.code === 2) {
        animateIn();
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setStep('result');
    animateIn();
  };

  // ── Step: Select EMIs ──
  const renderSelectStep = () => (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Pay All EMIs</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Select the EMIs you want to pay
        </Text>

        {/* Select All */}
        <Pressable
          onPress={toggleAll}
          style={[styles.selectAllRow, { borderColor: colors.border }]}
        >
          <View
            style={[
              styles.checkbox,
              selectedIds.size === upcomingPayments.length
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { borderColor: colors.border },
            ]}
          >
            {selectedIds.size === upcomingPayments.length && (
              <MaterialCommunityIcons name="check" size={14} color="#FFF" />
            )}
          </View>
          <Text style={[styles.selectAllText, { color: colors.text }]}>
            Select All ({upcomingPayments.length} EMIs)
          </Text>
        </Pressable>

        {/* EMI List */}
        {upcomingPayments.map((payment, index) => {
          const isSelected = selectedIds.has(payment.loanId);
          return (
            <MotiView
              key={payment.loanId}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 60 }}
            >
              <Pressable
                onPress={() => toggleSelect(payment.loanId)}
                style={[
                  styles.emiCard,
                  {
                    backgroundColor: isSelected ? `${colors.primary}08` : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { borderColor: colors.border },
                  ]}
                >
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                  )}
                </View>

                <View
                  style={[
                    styles.emiIconCircle,
                    {
                      backgroundColor: payment.isOverdue
                        ? colors.errorMuted
                        : colors.primaryMuted,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={payment.isOverdue ? 'alert' : getLoanIcon(payment.loanType)}
                    size={18}
                    color={payment.isOverdue ? colors.error : colors.primary}
                  />
                </View>

                <View style={styles.emiInfo}>
                  <Text style={[styles.emiLoanType, { color: colors.text }]}>
                    {payment.loanType}
                  </Text>
                  <Text style={[styles.emiLoanId, { color: colors.textMuted }]}>
                    {payment.loanId} • Due {formatDate(payment.dueDate)}
                  </Text>
                </View>

                <View style={styles.emiRight}>
                  <Text
                    style={[
                      styles.emiAmount,
                      { color: payment.isOverdue ? colors.error : colors.text },
                    ]}
                  >
                    {formatCurrency(payment.emiAmount)}
                  </Text>
                  {payment.isOverdue && (
                    <View style={[styles.overdueBadge, { backgroundColor: colors.errorMuted }]}>
                      <Text style={[styles.overdueBadgeText, { color: colors.error }]}>
                        Overdue
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </MotiView>
          );
        })}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ── Step: Summary → Razorpay ──
  const renderSummaryStep = () => (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Payment Summary</Text>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>EMIs Selected</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {selectedPayments.length}
            </Text>
          </View>
          {selectedPayments.map((p) => (
            <View key={p.loanId} style={styles.summaryItemRow}>
              <Text style={[styles.summaryItemLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {p.loanType}
              </Text>
              <Text style={[styles.summaryItemValue, { color: colors.textSecondary }]}>
                {formatCurrency(p.emiAmount)}
              </Text>
            </View>
          ))}
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.summaryTotalValue, { color: colors.primary }]}>
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
            title={`Pay ${formatCurrency(totalAmount)}`}
            onPress={handlePayWithRazorpay}
            fullWidth
            leftIcon={<MaterialCommunityIcons name="lock" size={16} color="#FFFFFF" />}
          />
        </View>
        <Pressable onPress={() => setStep('select')} style={styles.backLink}>
          <MaterialCommunityIcons name="chevron-left" size={18} color={colors.textMuted} />
          <Text style={[styles.backLinkText, { color: colors.textMuted }]}>Change selection</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  // ── Step: Result ──
  const renderResultStep = () => {
    if (success) {
      return (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                <MaterialCommunityIcons name="check-all" size={42} color="#FFFFFF" />
              </LinearGradient>
            </MotiView>

            <Text style={[styles.resultTitle, { color: colors.text }]}>
              All Payments Successful!
            </Text>
            <Text style={[styles.resultAmount, { color: colors.success }]}>
              {formatCurrency(totalAmount)}
            </Text>

            {/* Details Card */}
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
                  EMIs Paid
                </Text>
                <Text style={[styles.resultDetailValue, { color: colors.text }]}>
                  {selectedPayments.length}
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

            {/* Individual items */}
            <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 20 }]}>
              EMIs Cleared
            </Text>

            {selectedPayments.map((p, index) => (
              <MotiView
                key={p.loanId}
                from={{ opacity: 0, translateX: -12 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 300, delay: index * 80 }}
              >
                <View
                  style={[
                    styles.resultItem,
                    { backgroundColor: `${colors.success}08`, borderColor: `${colors.success}30` },
                  ]}
                >
                  <View style={[styles.resultItemIcon, { backgroundColor: `${colors.success}20` }]}>
                    <MaterialCommunityIcons name="check" size={16} color={colors.success} />
                  </View>
                  <View style={styles.resultItemInfo}>
                    <Text style={[styles.resultItemLoan, { color: colors.text }]}>
                      {p.loanType}
                    </Text>
                    <Text style={[styles.resultItemId, { color: colors.textMuted }]}>
                      {p.loanId}
                    </Text>
                  </View>
                  <Text style={[styles.resultItemAmount, { color: colors.success }]}>
                    {formatCurrency(p.emiAmount)}
                  </Text>
                </View>
              </MotiView>
            ))}

            <View style={styles.doneActionRow}>
              <AppButton title="Done" onPress={handleClose} fullWidth size="lg" />
            </View>
          </View>
        </ScrollView>
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
      case 'select': return renderSelectStep();
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

          {/* Floating Bottom Bar for Select Step */}
          {step === 'select' && selectedIds.size > 0 && (
            <View style={[styles.floatingBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <View style={styles.floatingBarInfo}>
                <Text style={[styles.floatingBarCount, { color: colors.text }]}>
                  {selectedIds.size} EMI{selectedIds.size > 1 ? 's' : ''} selected
                </Text>
                <Text style={[styles.floatingBarAmount, { color: colors.primary }]}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
              <AppButton title="Proceed" onPress={handleProceed} size="sm" />
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
});

BulkPaymentSheet.displayName = 'BulkPaymentSheet';

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
  stepSubtitle: { fontSize: 14, marginBottom: 16 },

  // Select All
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectAllText: { fontSize: 14, fontWeight: '600', marginLeft: 12 },

  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // EMI Card
  emiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  emiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emiInfo: { flex: 1, marginLeft: 12 },
  emiLoanType: { fontSize: 14, fontWeight: '600' },
  emiLoanId: { fontSize: 12, marginTop: 2 },
  emiRight: { alignItems: 'flex-end' },
  emiAmount: { fontSize: 15, fontWeight: '700' },
  overdueBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  overdueBadgeText: { fontSize: 10, fontWeight: '600' },

  // Summary
  summaryCard: { borderRadius: 14, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingLeft: 8 },
  summaryItemLabel: { fontSize: 13, flex: 1 },
  summaryItemValue: { fontSize: 13, fontWeight: '500' },
  summaryDivider: { height: 1, marginVertical: 8 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700' },
  summaryTotalValue: { fontSize: 18, fontWeight: '700' },

  // Section Label
  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  // Secure Badge
  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, gap: 6 },
  secureBadgeText: { fontSize: 12, fontWeight: '500' },

  actionRow: { marginTop: 20, paddingBottom: 8 },
  doneActionRow: { width: '100%', marginTop: 28, paddingBottom: 8 },

  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14 },

  // Results
  resultContainer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
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

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    width: '100%',
  },
  resultItemIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  resultItemInfo: { flex: 1, marginLeft: 12 },
  resultItemLoan: { fontSize: 14, fontWeight: '600' },
  resultItemId: { fontSize: 11, marginTop: 2 },
  resultItemAmount: { fontSize: 15, fontWeight: '700' },

  failedActions: { width: '100%', marginTop: 28, paddingBottom: 8 },

  // Floating Bar
  floatingBar: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  floatingBarInfo: {},
  floatingBarCount: { fontSize: 13, fontWeight: '500' },
  floatingBarAmount: { fontSize: 18, fontWeight: '700', marginTop: 2 },
});

export default memo(BulkPaymentSheet);
