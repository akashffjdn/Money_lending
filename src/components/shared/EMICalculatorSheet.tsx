import React, {
  useState,
  useMemo,
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
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../hooks/useTheme';
import AppButton from '../ui/AppButton';
import AppChip from '../ui/AppChip';
import AppCard from '../ui/AppCard';
import AnimatedCounter from './AnimatedCounter';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateEMI, generateSchedule, type ScheduleEntry } from '../../utils/emiCalculator';
import { BorderRadius, Spacing, Shadows } from '../../constants/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 1000000;
const AMOUNT_STEP = 10000;

const MIN_RATE = 8;
const MAX_RATE = 36;
const RATE_STEP = 0.5;

const TENURE_OPTIONS = [3, 6, 12, 18, 24, 36, 48, 60];

const INITIAL_VISIBLE_SCHEDULE_ROWS = 6;

export interface EMICalculatorRef {
  open(amount?: number, rate?: number, tenure?: number): void;
  close(): void;
}

interface StepperButtonProps {
  icon: 'minus' | 'plus';
  onPress: () => void;
  disabled?: boolean;
  colors: {
    primary: string;
    border: string;
    textMuted: string;
  };
}

const StepperButton = memo<StepperButtonProps>(
  ({ icon, onPress, disabled = false, colors }) => {
    const handlePress = useCallback(() => {
      if (disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }, [disabled, onPress]);

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.stepperButton,
          {
            borderColor: disabled ? colors.border : colors.primary,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={disabled ? colors.textMuted : colors.primary}
        />
      </Pressable>
    );
  },
);

const ScheduleRow = memo<{
  entry: ScheduleEntry;
  colors: { text: string; textSecondary: string; border: string };
}>(({ entry, colors }) => (
  <View style={[styles.scheduleRow, { borderBottomColor: colors.border }]}>
    <Text style={[styles.scheduleCell, styles.scheduleCellMonth, { color: colors.text }]}>
      {entry.month}
    </Text>
    <Text style={[styles.scheduleCell, { color: colors.text }]}>{formatCurrency(entry.emi)}</Text>
    <Text style={[styles.scheduleCell, { color: colors.text }]}>{formatCurrency(entry.principal)}</Text>
    <Text style={[styles.scheduleCell, { color: colors.text }]}>{formatCurrency(entry.interest)}</Text>
    <Text style={[styles.scheduleCell, { color: colors.textSecondary }]}>{formatCurrency(entry.balance)}</Text>
  </View>
));

const EMICalculatorSheet = memo(
  forwardRef<EMICalculatorRef>((_, ref) => {
    const { colors } = useTheme();

    const [visible, setVisible] = useState(false);
    const [amount, setAmount] = useState(100000);
    const [rate, setRate] = useState(14.5);
    const [tenure, setTenure] = useState(12);
    const [showSchedule, setShowSchedule] = useState(false);
    const [showAllScheduleRows, setShowAllScheduleRows] = useState(false);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    const animateIn = useCallback(() => {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
      ]).start();
    }, []);

    const animateOut = useCallback((cb?: () => void) => {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      ]).start(cb);
    }, []);

    useImperativeHandle(ref, () => ({
      open(initialAmount?: number, initialRate?: number, initialTenure?: number) {
        if (initialAmount !== undefined) setAmount(clampAmount(initialAmount));
        if (initialRate !== undefined) setRate(clampRate(initialRate));
        if (initialTenure !== undefined) setTenure(initialTenure);
        setShowSchedule(false);
        setShowAllScheduleRows(false);
        setVisible(true);
        setTimeout(animateIn, 50);
      },
      close() {
        animateOut(() => setVisible(false));
      },
    }));

    const clampAmount = (val: number): number =>
      Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, val));

    const clampRate = (val: number): number =>
      Math.min(MAX_RATE, Math.max(MIN_RATE, Math.round(val * 10) / 10));

    const emiResult = useMemo(() => calculateEMI(amount, rate, tenure), [amount, rate, tenure]);

    const schedule = useMemo(
      () => (showSchedule ? generateSchedule(amount, rate, tenure) : []),
      [amount, rate, tenure, showSchedule],
    );

    const principalPercent = useMemo(() => {
      if (emiResult.totalPayable === 0) return 0;
      return Math.round((emiResult.principal / emiResult.totalPayable) * 100);
    }, [emiResult]);

    const handleClose = useCallback(() => {
      animateOut(() => setVisible(false));
    }, []);

    const handleAmountDecrease = useCallback(() => setAmount((prev) => clampAmount(prev - AMOUNT_STEP)), []);
    const handleAmountIncrease = useCallback(() => setAmount((prev) => clampAmount(prev + AMOUNT_STEP)), []);
    const handleRateDecrease = useCallback(() => setRate((prev) => clampRate(prev - RATE_STEP)), []);
    const handleRateIncrease = useCallback(() => setRate((prev) => clampRate(prev + RATE_STEP)), []);

    const handleTenureSelect = useCallback((months: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTenure(months);
      setShowAllScheduleRows(false);
    }, []);

    const handleToggleSchedule = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowSchedule((prev) => !prev);
      setShowAllScheduleRows(false);
    }, []);

    const handleShowAllRows = useCallback(() => setShowAllScheduleRows(true), []);

    const handleApply = useCallback(() => {
      animateOut(() => setVisible(false));
      Toast.show({
        type: 'info',
        text1: 'Navigate to Apply tab',
        text2: `Loan amount: ${formatCurrency(amount)} at ${rate}% for ${tenure} months`,
      });
    }, [amount, rate, tenure]);

    const visibleSchedule = showAllScheduleRows ? schedule : schedule.slice(0, INITIAL_VISIBLE_SCHEDULE_ROWS);

    return (
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]}>
            <Pressable style={styles.overlayTouchable} onPress={handleClose} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              { height: SHEET_HEIGHT, backgroundColor: colors.background, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MaterialCommunityIcons name="calculator-variant-outline" size={22} color={colors.primary} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>EMI Calculator</Text>
              </View>
              <Pressable onPress={handleClose} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bounces={false}>
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Loan Amount</Text>
                <Text style={[styles.amountDisplay, { color: colors.text }]}>{formatCurrency(amount)}</Text>
                <View style={styles.stepperRow}>
                  <StepperButton icon="minus" onPress={handleAmountDecrease} disabled={amount <= MIN_AMOUNT} colors={colors} />
                  <Text style={[styles.stepperLabel, { color: colors.textMuted }]}>-10K / +10K</Text>
                  <StepperButton icon="plus" onPress={handleAmountIncrease} disabled={amount >= MAX_AMOUNT} colors={colors} />
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Interest Rate</Text>
                  <Text style={[styles.rateDisplay, { color: colors.primary }]}>{rate.toFixed(1)}% p.a.</Text>
                </View>
                <View style={styles.stepperRow}>
                  <StepperButton icon="minus" onPress={handleRateDecrease} disabled={rate <= MIN_RATE} colors={colors} />
                  <Text style={[styles.stepperLabel, { color: colors.textMuted }]}>-0.5% / +0.5%</Text>
                  <StepperButton icon="plus" onPress={handleRateIncrease} disabled={rate >= MAX_RATE} colors={colors} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Tenure</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tenureRow}>
                  {TENURE_OPTIONS.map((months) => (
                    <View key={months} style={styles.tenureChip}>
                      <AppChip label={`${months} mo`} selected={tenure === months} onPress={() => handleTenureSelect(months)} />
                    </View>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.resultsWrapper}>
                <AppCard>
                  <View style={styles.resultHeader}>
                    <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Monthly EMI</Text>
                    <AnimatedCounter value={emiResult.emi} prefix="₹" style={[styles.emiValue, { color: colors.primary }]} />
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultRowLabel, { color: colors.textSecondary }]}>Principal</Text>
                    <Text style={[styles.resultRowValue, { color: colors.text }]}>{formatCurrency(emiResult.principal)}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultRowLabel, { color: colors.textSecondary }]}>Total Interest</Text>
                    <Text style={[styles.resultRowValue, { color: colors.text }]}>{formatCurrency(emiResult.totalInterest)}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultRowLabel, { color: colors.textSecondary }]}>Total Payable</Text>
                    <Text style={[styles.resultRowValue, { color: colors.text }]}>{formatCurrency(emiResult.totalPayable)}</Text>
                  </View>
                  <View style={styles.barContainer}>
                    <View style={[styles.barPrincipal, { backgroundColor: colors.warning, flex: principalPercent }]} />
                    <View style={[styles.barInterest, { backgroundColor: colors.border, flex: 100 - principalPercent }]} />
                  </View>
                  <View style={styles.barLegendRow}>
                    <View style={styles.barLegendItem}>
                      <View style={[styles.barLegendDot, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.barLegendText, { color: colors.textMuted }]}>Principal ({principalPercent}%)</Text>
                    </View>
                    <View style={styles.barLegendItem}>
                      <View style={[styles.barLegendDot, { backgroundColor: colors.border }]} />
                      <Text style={[styles.barLegendText, { color: colors.textMuted }]}>Interest ({100 - principalPercent}%)</Text>
                    </View>
                  </View>
                </AppCard>
              </View>

              <View style={styles.scheduleSection}>
                <Pressable onPress={handleToggleSchedule} style={styles.scheduleToggle}>
                  <Text style={[styles.scheduleToggleText, { color: colors.primary }]}>View EMI Schedule</Text>
                  <MaterialCommunityIcons name={showSchedule ? 'chevron-up' : 'chevron-down'} size={22} color={colors.primary} />
                </Pressable>
                {showSchedule && schedule.length > 0 && (
                  <View style={styles.scheduleTable}>
                    <View style={[styles.scheduleRow, styles.scheduleHeaderRow, { borderBottomColor: colors.border }]}>
                      {['Mo', 'EMI', 'Principal', 'Interest', 'Balance'].map((h) => (
                        <Text key={h} style={[styles.scheduleCell, h === 'Mo' && styles.scheduleCellMonth, styles.scheduleHeaderCell, { color: colors.textMuted }]}>{h}</Text>
                      ))}
                    </View>
                    {visibleSchedule.map((entry) => (
                      <ScheduleRow key={entry.month} entry={entry} colors={colors} />
                    ))}
                    {!showAllScheduleRows && schedule.length > INITIAL_VISIBLE_SCHEDULE_ROWS && (
                      <Pressable onPress={handleShowAllRows} style={styles.showAllButton}>
                        <Text style={[styles.showAllText, { color: colors.primary }]}>
                          Show All ({schedule.length - INITIAL_VISIBLE_SCHEDULE_ROWS} more)
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.applyButtonWrapper}>
                <AppButton title="Apply for this Loan" onPress={handleApply} variant="primary" fullWidth size="lg" />
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  }),
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayTouchable: { flex: 1 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  handleContainer: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },
  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  amountDisplay: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  stepperButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepperLabel: { fontSize: 13, fontWeight: '500' },
  rateDisplay: { fontSize: 16, fontWeight: '700' },
  tenureRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  tenureChip: { marginRight: 4 },
  resultsWrapper: { marginHorizontal: Spacing.base, marginTop: Spacing.lg },
  resultHeader: { alignItems: 'center', marginBottom: 8 },
  resultLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  emiValue: { fontSize: 28, fontWeight: '700' },
  divider: { height: 1, marginVertical: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  resultRowLabel: { fontSize: 14, fontWeight: '500' },
  resultRowValue: { fontSize: 14, fontWeight: '600' },
  barContainer: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 16 },
  barPrincipal: { height: 8 },
  barInterest: { height: 8 },
  barLegendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  barLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLegendDot: { width: 10, height: 10, borderRadius: 5 },
  barLegendText: { fontSize: 12, fontWeight: '500' },
  scheduleSection: { marginHorizontal: Spacing.base, marginTop: Spacing.lg },
  scheduleToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  scheduleToggleText: { fontSize: 15, fontWeight: '600' },
  scheduleTable: { marginTop: 8 },
  scheduleRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  scheduleHeaderRow: { borderBottomWidth: 1 },
  scheduleCell: { flex: 1, fontSize: 11, textAlign: 'right' },
  scheduleCellMonth: { flex: 0.5, textAlign: 'center' },
  scheduleHeaderCell: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  showAllButton: { alignItems: 'center', paddingVertical: 14 },
  showAllText: { fontSize: 14, fontWeight: '600' },
  applyButtonWrapper: { marginHorizontal: Spacing.base, marginTop: Spacing.base },
});

export default EMICalculatorSheet;
