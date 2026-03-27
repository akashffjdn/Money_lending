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
  ActivityIndicator,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MotiView } from '../../utils/MotiCompat';

import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../utils/responsive';
import { usePaymentStore } from '../../store/paymentStore';
import AppButton from '../ui/AppButton';
import AppCard from '../ui/AppCard';
import { formatCurrency } from '../../utils/formatCurrency';

import type { PaymentMethodInfo } from '../../types/payment';
import { BorderRadius, Spacing } from '../../constants/spacing';


const METHOD_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  upi: 'cellphone',
  bank: 'bank',
  card: 'credit-card',
};

export interface PaymentFlowRef {
  open: (loanId: string, amount: number, loanType?: string) => void;
  close: () => void;
}

type Step = 0 | 1 | 2 | 3;

const PaymentFlowSheet = forwardRef<PaymentFlowRef>((_, ref) => {
  const { colors } = useTheme();
  const { isTablet } = useResponsive();
  const { height: screenHeight } = useWindowDimensions();
  const { paymentMethods, processPayment } = usePaymentStore();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [loanId, setLoanId] = useState('');
  const [amount, setAmount] = useState(0);
  const [loanType, setLoanType] = useState('Personal Loan');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    open: (id: string, amt: number, type?: string) => {
      setLoanId(id);
      setAmount(amt);
      setLoanType(type ?? 'Personal Loan');
      setStep(0);
      setSuccess(false);
      setTransactionId('');
      setSelectedMethodId(
        paymentMethods.find((m) => m.isDefault)?.id ?? paymentMethods[0]?.id ?? '',
      );
      setVisible(true);
      setTimeout(animateIn, 50);
    },
    close: () => {
      handleClose();
    },
  }));

  const handleClose = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    animateOut(() => setVisible(false));
  }, []);

  const handleContinue = useCallback(() => {
    setStep(1);
  }, []);

  const handlePay = useCallback(async () => {
    setStep(2);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await processPayment(loanId, amount, selectedMethodId);
      setSuccess(result.success);
      setTransactionId(result.transactionId);
    } catch {
      setSuccess(false);
      setTransactionId(`TXN${Date.now()}`);
    }

    setStep(3);

    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [loanId, amount, selectedMethodId, processPayment, success]);

  const handleRetry = useCallback(() => {
    setStep(1);
  }, []);

  const handleDone = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const estimatedPrincipal = Math.round(amount * 0.72);
  const estimatedInterest = amount - estimatedPrincipal;

  const renderSummaryStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Payment Summary
      </Text>

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Loan Type</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{loanType}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Loan ID</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{loanId}</Text>
        </View>
        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>EMI Amount</Text>
          <Text style={[styles.summaryValue, styles.amountText, { color: colors.text }]}>
            {formatCurrency(amount)}
          </Text>
        </View>
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Principal</Text>
            <Text style={[styles.breakdownValue, { color: colors.textSecondary }]}>
              {formatCurrency(estimatedPrincipal)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Interest</Text>
            <Text style={[styles.breakdownValue, { color: colors.textSecondary }]}>
              {formatCurrency(estimatedInterest)}
            </Text>
          </View>
        </View>
      </AppCard>

      <View style={styles.actionRow}>
        <AppButton title="Continue" onPress={handleContinue} fullWidth />
      </View>
    </View>
  );

  const renderMethodStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Select Payment Method
      </Text>

      <View style={styles.methodsList}>
        {paymentMethods.map((method) => {
          const isSelected = method.id === selectedMethodId;
          return (
            <Pressable
              key={method.id}
              onPress={() => setSelectedMethodId(method.id)}
              style={[
                styles.methodOption,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                  backgroundColor: isSelected ? `${colors.primary}08` : colors.card,
                },
              ]}
            >
              <View style={[styles.methodIconCircle, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons
                  name={METHOD_ICONS[method.type] ?? 'credit-card'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodName, { color: colors.text }]} numberOfLines={1}>
                  {method.name}
                </Text>
                <Text style={[styles.methodDetail, { color: colors.textMuted }]}>
                  {method.detail}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: isSelected ? colors.primary : colors.border },
                ]}
              >
                {isSelected && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        <AppButton
          title={`Pay ${formatCurrency(amount)}`}
          onPress={handlePay}
          fullWidth
          disabled={!selectedMethodId}
        />
      </View>
    </View>
  );

  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.processingText, { color: colors.textSecondary }]}>
        Processing payment...
      </Text>
      <Text style={[styles.processingHint, { color: colors.textMuted }]}>
        Please do not close or go back
      </Text>
    </View>
  );

  const renderResultStep = () => {
    if (success) {
      return (
        <View style={styles.resultContainer}>
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 120, delay: 100 }}
          >
            <View style={[styles.resultCircle, { backgroundColor: `${colors.success}20` }]}>
              <MaterialCommunityIcons name="check" size={48} color={colors.success} />
            </View>
          </MotiView>
          <Text style={[styles.resultTitle, { color: colors.text }]}>Payment Successful!</Text>
          <Text style={[styles.resultAmount, { color: colors.success }]}>
            {formatCurrency(amount)}
          </Text>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultLabel, { color: colors.textMuted }]}>Transaction ID</Text>
            <Text style={[styles.resultValue, { color: colors.textSecondary }]}>
              {transactionId}
            </Text>
          </View>
          <View style={styles.actionRow}>
            <AppButton title="Done" onPress={handleDone} fullWidth />
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
          <View style={[styles.resultCircle, { backgroundColor: `${colors.error}20` }]}>
            <MaterialCommunityIcons name="close" size={48} color={colors.error} />
          </View>
        </MotiView>
        <Text style={[styles.resultTitle, { color: colors.text }]}>Payment Failed</Text>
        <Text style={[styles.resultSubtext, { color: colors.textSecondary }]}>
          Insufficient funds or network error
        </Text>
        <View style={styles.failedActions}>
          <AppButton title="Retry" onPress={handleRetry} fullWidth />
          <View style={styles.failedSpacer} />
          <AppButton title="Try Another Method" onPress={handleRetry} fullWidth variant="secondary" />
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 0: return renderSummaryStep();
      case 1: return renderMethodStep();
      case 2: return renderProcessingStep();
      case 3: return renderResultStep();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={step !== 2 ? handleClose : undefined}
    >
      <View style={[styles.overlay, isTablet && { alignItems: 'center' as const }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]}>
          <Pressable style={styles.overlayPressable} onPress={step !== 2 ? handleClose : undefined} />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }, isTablet && { maxWidth: 500 }]}
        >
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {step !== 2 && (
            <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          )}

          {renderStepContent()}
        </Animated.View>
      </View>
    </Modal>
  );
});

PaymentFlowSheet.displayName = 'PaymentFlowSheet';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    minHeight: 320,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryCard: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, fontWeight: '400' },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  amountText: { fontSize: 18, fontWeight: '700' },
  rowDivider: { height: 1, marginVertical: 4 },
  breakdownContainer: { paddingLeft: 16, marginTop: 4 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  breakdownLabel: { fontSize: 13 },
  breakdownValue: { fontSize: 13, fontWeight: '500' },
  actionRow: { marginTop: 20, paddingBottom: 8 },
  methodsList: { gap: 10 },
  methodOption: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, padding: 14 },
  methodIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodName: { fontSize: 14, fontWeight: '600' },
  methodDetail: { fontSize: 13, marginTop: 2 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  processingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  processingText: { fontSize: 16, fontWeight: '600', marginTop: 20 },
  processingHint: { fontSize: 13, marginTop: 8 },
  resultContainer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 16 },
  resultCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  resultAmount: { fontSize: 28, fontWeight: '700', marginTop: 8 },
  resultSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  resultInfo: { alignItems: 'center', marginTop: 16 },
  resultLabel: { fontSize: 12 },
  resultValue: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  failedActions: { width: '100%', marginTop: 24, paddingBottom: 8 },
  failedSpacer: { height: 12 },
});

export default memo(PaymentFlowSheet);
