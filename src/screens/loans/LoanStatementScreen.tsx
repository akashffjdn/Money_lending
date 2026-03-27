import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Animated,
  useWindowDimensions,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../hooks/useTheme';
import { useLoanStore } from '../../store/loanStore';
import { usePaymentStore } from '../../store/paymentStore';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import ProgressRing from '../../components/shared/ProgressRing';
import { MotiView } from '../../utils/MotiCompat';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { LoanStackParamList } from '../../types/navigation';
import type { Loan, RepaymentEntry } from '../../types/loan';
import type { Payment } from '../../types/payment';

type Props = NativeStackScreenProps<LoanStackParamList, 'LoanStatement'>;

/* ── Filter presets ── */
type DateFilter = 'all' | '3m' | '6m' | '1y';
type StatusFilter = 'all' | 'paid' | 'upcoming' | 'overdue';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: '3m', label: '3 Months' },
  { key: '6m', label: '6 Months' },
  { key: '1y', label: '1 Year' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'format-list-bulleted' },
  { key: 'paid', label: 'Paid', icon: 'check-circle' },
  { key: 'upcoming', label: 'Upcoming', icon: 'clock-outline' },
  { key: 'overdue', label: 'Overdue', icon: 'alert-circle' },
];

/* ── Status badge colors ── */
const getStatusConfig = (status: string, colors: any) => {
  switch (status) {
    case 'paid':
      return { bg: colors.successMuted, color: colors.success, icon: 'check-circle', label: 'Paid' };
    case 'current':
      return { bg: colors.primaryMuted, color: colors.primary, icon: 'clock-outline', label: 'Current' };
    case 'upcoming':
      return { bg: colors.surface, color: colors.textMuted, icon: 'calendar-clock', label: 'Upcoming' };
    case 'overdue':
      return { bg: colors.errorMuted, color: colors.error, icon: 'alert-circle', label: 'Overdue' };
    default:
      return { bg: colors.surface, color: colors.textMuted, icon: 'circle', label: status };
  }
};

/* ── Month grouping helper ── */
const getMonthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthHeader = (key: string) => {
  const [year, month] = key.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
};

/* ------------------------------------------------------------------ */
/*  EMI Statement Row                                                  */
/* ------------------------------------------------------------------ */

interface EMIRowProps {
  entry: RepaymentEntry;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  matchingPayment?: Payment;
  colors: any;
}

const EMIRow = memo<EMIRowProps>(({ entry, index, isExpanded, onToggle, matchingPayment, colors }) => {
  const status = getStatusConfig(entry.status, colors);
  const principalPercent = Math.round((entry.principal / entry.amount) * 100);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: Math.min(index * 50, 400) }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={({ pressed }) => [
          styles.emiCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && { opacity: 0.95 },
        ]}
      >
        {/* Main Row */}
        <View style={styles.emiMainRow}>
          {/* Left — EMI # and date */}
          <View style={[styles.emiNumCircle, { backgroundColor: status.bg }]}>
            <Text style={[styles.emiNumText, { color: status.color }]}>{entry.month}</Text>
          </View>
          <View style={styles.emiInfoBlock}>
            <Text style={[styles.emiTitle, { color: colors.text }]}>EMI {entry.month}</Text>
            <Text style={[styles.emiDate, { color: colors.textMuted }]}>
              {formatDate(entry.dueDate)}
            </Text>
          </View>

          {/* Right — amount and status */}
          <View style={styles.emiRightBlock}>
            <Text style={[styles.emiAmount, { color: colors.text }]}>{formatCurrency(entry.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <MaterialCommunityIcons name={status.icon as any} size={10} color={status.color} />
              <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {/* Expanded Detail */}
        {isExpanded && (
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 250 }}
          >
            <View style={[styles.emiDivider, { backgroundColor: colors.border }]} />

            {/* Breakdown */}
            <View style={styles.breakdownGrid}>
              <View style={[styles.breakdownItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Principal</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  {formatCurrency(entry.principal)}
                </Text>
              </View>
              <View style={[styles.breakdownItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Interest</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  {formatCurrency(entry.interest)}
                </Text>
              </View>
              <View style={[styles.breakdownItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Balance After</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  {formatCurrency(entry.balance)}
                </Text>
              </View>
            </View>

            {/* Principal/Interest bar */}
            <View style={styles.splitBarRow}>
              <Text style={[styles.splitBarLabel, { color: colors.textMuted }]}>Principal vs Interest</Text>
              <View style={[styles.splitBar, { backgroundColor: colors.surface }]}>
                <View style={[styles.splitBarFill, { width: `${principalPercent}%`, backgroundColor: colors.primary }]} />
              </View>
              <View style={styles.splitBarLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>{principalPercent}% Principal</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.surface }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>{100 - principalPercent}% Interest</Text>
                </View>
              </View>
            </View>

            {/* Payment info */}
            {matchingPayment && (
              <View style={[styles.paymentInfo, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="receipt" size={14} color={colors.primary} />
                <View style={styles.paymentInfoText}>
                  <Text style={[styles.paymentInfoLabel, { color: colors.textMuted }]}>
                    Paid via {matchingPayment.methodDetail} • {formatDate(matchingPayment.date)}
                  </Text>
                  <Text style={[styles.paymentInfoRef, { color: colors.textMuted }]}>
                    Ref: {matchingPayment.transactionId}
                  </Text>
                </View>
              </View>
            )}
          </MotiView>
        )}

        {/* Expand indicator */}
        <View style={styles.expandIndicator}>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </View>
      </Pressable>
    </MotiView>
  );
});

/* ------------------------------------------------------------------ */
/*  Month Section Header                                               */
/* ------------------------------------------------------------------ */

interface MonthHeaderProps {
  title: string;
  total: number;
  count: number;
  colors: any;
}

const MonthHeader = memo<MonthHeaderProps>(({ title, total, count, colors }) => (
  <View style={[styles.monthHeader, { backgroundColor: colors.background }]}>
    <View style={styles.monthHeaderLeft}>
      <View style={[styles.monthDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.monthHeaderTitle, { color: colors.text }]}>{title}</Text>
    </View>
    <View style={styles.monthHeaderRight}>
      <Text style={[styles.monthHeaderTotal, { color: colors.textSecondary }]}>
        {count} EMI{count > 1 ? 's' : ''} • {formatCurrency(total)}
      </Text>
    </View>
  </View>
));

/* ------------------------------------------------------------------ */
/*  LoanStatementScreen                                                */
/* ------------------------------------------------------------------ */

const LoanStatementScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, mode } = useTheme();
  const { s, isTablet } = useResponsive();
  const { width } = useWindowDimensions();
  const loanStore = useLoanStore();
  const paymentStore = usePaymentStore();
  const isDark = mode === 'dark';

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(route.params?.loanId ?? null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedEmi, setExpandedEmi] = useState<number | null>(null);

  useEffect(() => {
    if (loanStore.loans.length === 0) loanStore.loadLoans();
    if (paymentStore.payments.length === 0) paymentStore.loadPayments();
  }, []);

  // Get active loans with repayment schedules
  const activeLoans = useMemo(
    () => loanStore.loans.filter((l) => l.repaymentSchedule.length > 0),
    [loanStore.loans],
  );

  // Auto-select first loan if none selected
  useEffect(() => {
    if (!selectedLoanId && activeLoans.length > 0) {
      setSelectedLoanId(activeLoans[0].id);
    }
  }, [activeLoans, selectedLoanId]);

  const selectedLoan = useMemo(
    () => activeLoans.find((l) => l.id === selectedLoanId),
    [activeLoans, selectedLoanId],
  );

  // Filter schedule entries
  const filteredSchedule = useMemo(() => {
    if (!selectedLoan) return [];
    let entries = [...selectedLoan.repaymentSchedule];

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const months = dateFilter === '3m' ? 3 : dateFilter === '6m' ? 6 : 12;
      const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
      entries = entries.filter((e) => new Date(e.dueDate) >= cutoff);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'paid') {
        entries = entries.filter((e) => e.status === 'paid');
      } else if (statusFilter === 'upcoming') {
        entries = entries.filter((e) => e.status === 'upcoming' || e.status === 'current');
      } else if (statusFilter === 'overdue') {
        entries = entries.filter((e) => e.status === 'overdue');
      }
    }

    return entries;
  }, [selectedLoan, dateFilter, statusFilter]);

  // Group by month
  const groupedSections = useMemo(() => {
    const groups: { title: string; data: RepaymentEntry[]; total: number }[] = [];
    const map = new Map<string, RepaymentEntry[]>();

    for (const entry of filteredSchedule) {
      const key = getMonthKey(entry.dueDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }

    // Sort months descending (newest first)
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    for (const key of sortedKeys) {
      const data = map.get(key)!;
      groups.push({
        title: formatMonthHeader(key),
        data,
        total: data.reduce((sum, e) => sum + e.amount, 0),
      });
    }

    return groups;
  }, [filteredSchedule]);

  // Match payments to EMIs
  const getMatchingPayment = useCallback(
    (entry: RepaymentEntry) => {
      if (!selectedLoan || entry.status !== 'paid') return undefined;
      return paymentStore.payments.find(
        (p) =>
          p.loanId === selectedLoan.id &&
          p.type === 'emi_payment' &&
          p.status === 'successful' &&
          Math.abs(p.amount - entry.amount) < 100 &&
          getMonthKey(p.date) === getMonthKey(entry.dueDate),
      );
    },
    [selectedLoan, paymentStore.payments],
  );

  // Summary calculations
  const summary = useMemo(() => {
    if (!selectedLoan) return null;
    const schedule = selectedLoan.repaymentSchedule;
    const paidEntries = schedule.filter((e) => e.status === 'paid');
    const totalPrincipalPaid = paidEntries.reduce((s, e) => s + e.principal, 0);
    const totalInterestPaid = paidEntries.reduce((s, e) => s + e.interest, 0);
    const totalAmountPaid = paidEntries.reduce((s, e) => s + e.amount, 0);
    const progress = Math.round((selectedLoan.emiPaid / selectedLoan.totalEmis) * 100);

    return {
      totalAmountPaid,
      totalPrincipalPaid,
      totalInterestPaid,
      progress,
      paidCount: paidEntries.length,
    };
  }, [selectedLoan]);

  const handleShare = useCallback(async () => {
    if (!selectedLoan || !summary) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        title: `Loan Statement - ${selectedLoan.typeLabel}`,
        message: `LendEase Loan Statement\n\nLoan: ${selectedLoan.typeLabel} (${selectedLoan.id})\nLoan Amount: ${formatCurrency(selectedLoan.sanctionedAmount)}\nEMIs Paid: ${selectedLoan.emiPaid} of ${selectedLoan.totalEmis}\nTotal Paid: ${formatCurrency(summary.totalAmountPaid)}\nOutstanding: ${formatCurrency(selectedLoan.outstandingAmount)}\nInterest Rate: ${selectedLoan.interestRate}% p.a.\n\nGenerated by LendEase`,
      });
    } catch (_) {}
  }, [selectedLoan, summary]);

  const handleDownload = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Statement Downloaded',
      `PDF statement for ${selectedLoan?.typeLabel} has been saved to your device.`,
      [{ text: 'OK' }],
    );
  }, [selectedLoan]);

  // Build flat list data with section headers
  const listData = useMemo(() => {
    const items: { type: 'header' | 'item'; data: any }[] = [];
    for (const section of groupedSections) {
      items.push({
        type: 'header',
        data: { title: section.title, total: section.total, count: section.data.length },
      });
      for (const entry of section.data) {
        items.push({ type: 'item', data: entry });
      }
    }
    return items;
  }, [groupedSections]);

  if (!selectedLoan || !summary) {
    return (
      <ScreenWrapper headerTitle="Loan Statements" onBack={() => navigation.goBack()} scrollable>
        <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
            <MaterialCommunityIcons name="file-document-outline" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Statements Available</Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            Loan statements will appear once you have an active loan with repayment history.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerTitle="Loan Statement"
      onBack={() => navigation.goBack()}
      scrollable={false}
      rightAction={
        <View style={styles.headerActions}>
          <Pressable onPress={handleShare} hitSlop={8} style={styles.headerBtn}>
            <MaterialCommunityIcons name="share-variant" size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={handleDownload} hitSlop={8} style={styles.headerBtn}>
            <MaterialCommunityIcons name="download" size={20} color={colors.text} />
          </Pressable>
        </View>
      }
    >
      <FlatList
        data={listData}
        keyExtractor={(item, idx) => `${item.type}-${idx}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            {/* ── Loan Selector (if multiple active loans) ── */}
            {activeLoans.length > 1 && (
              <View style={styles.loanSelectorRow}>
                {activeLoans.map((loan) => (
                  <Pressable
                    key={loan.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedLoanId(loan.id);
                      setExpandedEmi(null);
                    }}
                    style={[
                      styles.loanSelectorChip,
                      {
                        backgroundColor:
                          loan.id === selectedLoanId ? colors.primary : colors.surface,
                        borderColor:
                          loan.id === selectedLoanId ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.loanSelectorText,
                        { color: loan.id === selectedLoanId ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {loan.typeLabel}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* ── Summary Hero Card ── */}
            <LinearGradient
              colors={['#0B1426', '#132042', '#1A2D5A']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Decorative glow */}
              <View style={styles.summaryGlow} />

              <View style={styles.summaryTopRow}>
                {/* Progress Ring */}
                <View style={styles.progressArea}>
                  <ProgressRing
                    progress={summary.progress}
                    size={90}
                    strokeWidth={8}
                    color="#C8850A"
                    bgColor="rgba(255,255,255,0.08)"
                  >
                    <Text style={styles.progressPercent}>{summary.progress}%</Text>
                    <Text style={styles.progressLabel}>Paid</Text>
                  </ProgressRing>
                </View>

                {/* Loan details */}
                <View style={styles.summaryInfoBlock}>
                  <Text style={styles.summaryLoanType}>{selectedLoan.typeLabel}</Text>
                  <Text style={styles.summaryLoanId}>{selectedLoan.id}</Text>
                  <View style={styles.summaryEmiRow}>
                    <Text style={styles.summaryEmiPaid}>
                      {selectedLoan.emiPaid} <Text style={styles.summaryEmiOf}>of</Text> {selectedLoan.totalEmis}
                    </Text>
                    <Text style={styles.summaryEmiLabel}>EMIs Paid</Text>
                  </View>
                </View>
              </View>

              {/* Stats pills */}
              <View style={styles.summaryStatsRow}>
                <View style={styles.summaryStatPill}>
                  <Text style={styles.summaryStatLabel}>Total Paid</Text>
                  <Text style={styles.summaryStatValue}>{formatCurrency(summary.totalAmountPaid)}</Text>
                </View>
                <View style={styles.summaryStatPill}>
                  <Text style={styles.summaryStatLabel}>Outstanding</Text>
                  <Text style={[styles.summaryStatValue, { color: '#F87171' }]}>
                    {formatCurrency(selectedLoan.outstandingAmount)}
                  </Text>
                </View>
              </View>

              {/* Principal vs Interest summary */}
              <View style={styles.piSummaryRow}>
                <View style={styles.piItem}>
                  <View style={[styles.piDot, { backgroundColor: '#C8850A' }]} />
                  <Text style={styles.piLabel}>Principal</Text>
                  <Text style={styles.piValue}>{formatCurrency(summary.totalPrincipalPaid)}</Text>
                </View>
                <View style={[styles.piDivider, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                <View style={styles.piItem}>
                  <View style={[styles.piDot, { backgroundColor: '#60A5FA' }]} />
                  <Text style={styles.piLabel}>Interest</Text>
                  <Text style={styles.piValue}>{formatCurrency(summary.totalInterestPaid)}</Text>
                </View>
                <View style={[styles.piDivider, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                <View style={styles.piItem}>
                  <View style={[styles.piDot, { backgroundColor: '#22C55E' }]} />
                  <Text style={styles.piLabel}>Rate</Text>
                  <Text style={styles.piValue}>{selectedLoan.interestRate}%</Text>
                </View>
              </View>
            </LinearGradient>

            {/* ── Quick Action Bar ── */}
            <View style={styles.quickActionsRow}>
              <Pressable
                onPress={handleDownload}
                style={({ pressed }) => [
                  styles.quickAction,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryMuted }]}>
                  <MaterialCommunityIcons name="file-pdf-box" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>Download{'\n'}PDF</Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.quickAction,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF620' }]}>
                  <MaterialCommunityIcons name="share-variant" size={18} color="#8B5CF6" />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>Share{'\n'}Statement</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Email Statement', 'Monthly statement will be sent to your registered email.');
                }}
                style={({ pressed }) => [
                  styles.quickAction,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#22C55E20' }]}>
                  <MaterialCommunityIcons name="email-outline" size={18} color="#22C55E" />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>Email{'\n'}Statement</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Interest Certificate', 'Your interest certificate for FY 2025-26 will be available after March 31.');
                }}
                style={({ pressed }) => [
                  styles.quickAction,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B20' }]}>
                  <MaterialCommunityIcons name="certificate" size={18} color="#F59E0B" />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>Tax{'\n'}Certificate</Text>
              </Pressable>
            </View>

            {/* ── Date Filter Chips ── */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.textMuted }]}>PERIOD</Text>
              <View style={styles.filterChipsRow}>
                {DATE_FILTERS.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDateFilter(f.key);
                    }}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: dateFilter === f.key ? colors.primary : colors.surface,
                        borderColor: dateFilter === f.key ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: dateFilter === f.key ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Status Filter Chips ── */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.textMuted }]}>STATUS</Text>
              <View style={styles.filterChipsRow}>
                {STATUS_FILTERS.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStatusFilter(f.key);
                    }}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: statusFilter === f.key ? colors.primary : colors.surface,
                        borderColor: statusFilter === f.key ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={f.icon as any}
                      size={12}
                      color={statusFilter === f.key ? '#FFFFFF' : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: statusFilter === f.key ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Schedule Title ── */}
            <View style={styles.scheduleHeader}>
              <Text style={[styles.scheduleTitle, { color: colors.text }]}>Repayment Schedule</Text>
              <Text style={[styles.scheduleCount, { color: colors.textMuted }]}>
                {filteredSchedule.length} entries
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <MonthHeader
                title={item.data.title}
                total={item.data.total}
                count={item.data.count}
                colors={colors}
              />
            );
          }
          const entry = item.data as RepaymentEntry;
          return (
            <EMIRow
              entry={entry}
              index={entry.month}
              isExpanded={expandedEmi === entry.month}
              onToggle={() => setExpandedEmi(expandedEmi === entry.month ? null : entry.month)}
              matchingPayment={getMatchingPayment(entry)}
              colors={colors}
            />
          );
        }}
        ListEmptyComponent={
          <View style={[styles.noResults, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="filter-off" size={32} color={colors.textMuted} />
            <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
              No entries match your filters
            </Text>
            <Pressable
              onPress={() => {
                setDateFilter('all');
                setStatusFilter('all');
              }}
            >
              <Text style={[styles.clearFilters, { color: colors.primary }]}>Clear Filters</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={[styles.footerNote, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="information" size={14} color={colors.primary} />
              <Text style={[styles.footerNoteText, { color: colors.textMuted }]}>
                This statement is system-generated. For official statements, download the PDF version.
              </Text>
            </View>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

export default LoanStatementScreen;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },

  /* Header Actions */
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 4 },

  /* Loan Selector */
  loanSelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  loanSelectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  loanSelectorText: { fontSize: 13, fontWeight: '600' },

  /* Summary Card */
  summaryCard: { borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden', position: 'relative' },
  summaryGlow: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(200,133,10,0.1)' },
  summaryTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  progressArea: { marginRight: 18 },
  progressPercent: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  progressLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginTop: 1 },
  summaryInfoBlock: { flex: 1 },
  summaryLoanType: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  summaryLoanId: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 0.5 },
  summaryEmiRow: { marginTop: 10 },
  summaryEmiPaid: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  summaryEmiOf: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.4)' },
  summaryEmiLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500', marginTop: 2 },

  summaryStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryStatPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500', letterSpacing: 0.3 },
  summaryStatValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginTop: 4 },

  piSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  piItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  piDot: { width: 6, height: 6, borderRadius: 3 },
  piLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  piValue: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  piDivider: { width: 1, height: 24 },

  /* Quick Actions */
  quickActionsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickActionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickActionLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 14 },

  /* Filters */
  filterSection: { marginBottom: 14 },
  filterSectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  filterChipsRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  /* Schedule Header */
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 6 },
  scheduleTitle: { fontSize: 16, fontWeight: '700' },
  scheduleCount: { fontSize: 12, fontWeight: '500' },

  /* Month Header */
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, marginTop: 4 },
  monthHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthDot: { width: 6, height: 6, borderRadius: 3 },
  monthHeaderTitle: { fontSize: 14, fontWeight: '700' },
  monthHeaderRight: {},
  monthHeaderTotal: { fontSize: 12, fontWeight: '500' },

  /* EMI Card */
  emiCard: { borderRadius: 14, borderWidth: 1, marginBottom: 8, padding: 14 },
  emiMainRow: { flexDirection: 'row', alignItems: 'center' },
  emiNumCircle: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emiNumText: { fontSize: 13, fontWeight: '800' },
  emiInfoBlock: { flex: 1, marginLeft: 10 },
  emiTitle: { fontSize: 14, fontWeight: '600' },
  emiDate: { fontSize: 12, marginTop: 2 },
  emiRightBlock: { alignItems: 'flex-end' },
  emiAmount: { fontSize: 15, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  /* EMI Expanded */
  emiDivider: { height: 1, marginVertical: 12 },
  breakdownGrid: { flexDirection: 'row', gap: 8 },
  breakdownItem: { flex: 1, padding: 10, borderRadius: 10 },
  breakdownLabel: { fontSize: 10, fontWeight: '500', letterSpacing: 0.3 },
  breakdownValue: { fontSize: 13, fontWeight: '700', marginTop: 4 },

  splitBarRow: { marginTop: 12 },
  splitBarLabel: { fontSize: 10, fontWeight: '500', marginBottom: 6, letterSpacing: 0.3 },
  splitBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  splitBarFill: { height: 6, borderRadius: 3 },
  splitBarLegend: { flexDirection: 'row', gap: 16, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '500' },

  paymentInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginTop: 10 },
  paymentInfoText: { flex: 1 },
  paymentInfoLabel: { fontSize: 11, lineHeight: 15 },
  paymentInfoRef: { fontSize: 10, marginTop: 2, letterSpacing: 0.3 },

  expandIndicator: { alignItems: 'center', marginTop: 6 },

  /* Empty State */
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 16, borderWidth: 1, marginTop: 20 },
  emptyIcon: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtext: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  /* No Results */
  noResults: { alignItems: 'center', padding: 24, borderRadius: 14, marginTop: 8 },
  noResultsText: { fontSize: 14, fontWeight: '500', marginTop: 8 },
  clearFilters: { fontSize: 14, fontWeight: '600', marginTop: 10 },

  /* Footer */
  footer: { marginTop: 16, marginBottom: 20 },
  footerNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10 },
  footerNoteText: { fontSize: 11, flex: 1, lineHeight: 16 },
});
