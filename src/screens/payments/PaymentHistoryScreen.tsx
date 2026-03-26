import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MotiView } from '../../utils/MotiCompat';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { PaymentStackParamList } from '../../types/navigation';
import { usePaymentStore } from '../../store/paymentStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

import ScreenWrapper from '../../components/layout/ScreenWrapper';
import AppCard from '../../components/ui/AppCard';
import AppChip from '../../components/ui/AppChip';
import EmptyState from '../../components/feedback/EmptyState';
import MadeByFooter from '../../components/shared/MadeByFooter';

import type { Payment, TransactionType, PaymentStatus } from '../../types/payment';
import { BorderRadius, Spacing } from '../../constants/spacing';

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentHistory'>;

const MONTH_OPTIONS = ['Mar 2026', 'Feb 2026', 'Jan 2026', 'Dec 2025'];

const TYPE_LABELS: Record<TransactionType, string> = {
  emi_payment: 'EMI Payment',
  disbursement: 'Loan Disbursement',
  processing_fee: 'Processing Fee',
  late_fee: 'Late Fee',
  prepayment: 'Prepayment',
};

const TYPE_ICONS: Record<TransactionType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  emi_payment: 'cash-minus',
  disbursement: 'bank-transfer-in',
  processing_fee: 'file-document-outline',
  late_fee: 'clock-alert-outline',
  prepayment: 'cash-fast',
};

interface IconConfig {
  bg: string;
  iconColor: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const getIconConfig = (
  type: TransactionType,
  status: PaymentStatus,
  colors: {
    error: string;
    errorMuted: string;
    success: string;
    successMuted: string;
    warning: string;
    warningMuted: string;
    primaryMuted: string;
    primary: string;
  },
): IconConfig => {
  if (status === 'failed') {
    return {
      bg: colors.errorMuted,
      iconColor: colors.error,
      iconName: 'close-circle-outline',
    };
  }
  if (status === 'processing') {
    return {
      bg: colors.warningMuted,
      iconColor: colors.warning,
      iconName: 'clock-outline',
    };
  }
  if (type === 'disbursement') {
    return {
      bg: colors.successMuted,
      iconColor: colors.success,
      iconName: TYPE_ICONS[type],
    };
  }
  if (type === 'late_fee') {
    return {
      bg: colors.errorMuted,
      iconColor: colors.error,
      iconName: TYPE_ICONS[type],
    };
  }
  return {
    bg: colors.primaryMuted,
    iconColor: colors.primary,
    iconName: TYPE_ICONS[type] ?? 'cash',
  };
};

const getAmountDisplay = (
  type: TransactionType,
  amount: number,
  status: PaymentStatus,
  successColor: string,
  errorColor: string,
  warningColor: string,
): { text: string; color: string } => {
  if (status === 'failed') {
    return { text: `- ${formatCurrency(amount)}`, color: errorColor };
  }
  if (type === 'disbursement') {
    return { text: `+ ${formatCurrency(amount)}`, color: successColor };
  }
  return { text: `- ${formatCurrency(amount)}`, color: errorColor };
};

const getStatusConfig = (
  status: PaymentStatus,
  colors: {
    success: string;
    successMuted: string;
    error: string;
    errorMuted: string;
    warning: string;
    warningMuted: string;
  },
): { label: string; color: string; bg: string } => {
  switch (status) {
    case 'successful':
      return { label: 'Successful', color: colors.success, bg: colors.successMuted };
    case 'failed':
      return { label: 'Failed', color: colors.error, bg: colors.errorMuted };
    case 'processing':
      return { label: 'Processing', color: colors.warning, bg: colors.warningMuted };
  }
};

const getMonthKey = (dateStr: string): string => {
  const d = new Date(dateStr);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const PaymentHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { payments, isLoading, loadPayments } = usePaymentStore();

  const [selectedMonth, setSelectedMonth] = useState('Mar 2026');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (payments.length === 0) {
      loadPayments();
    }
  }, [payments.length, loadPayments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  }, [loadPayments]);

  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => getMonthKey(p.date) === selectedMonth),
    [payments, selectedMonth],
  );

  const sections = useMemo(() => {
    const grouped: Record<string, Payment[]> = {};
    filteredPayments.forEach((p) => {
      const key = getMonthKey(p.date);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    return Object.entries(grouped)
      .map(([title, data]) => ({
        title,
        data: data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.data[0].date).getTime();
        const dateB = new Date(b.data[0].date).getTime();
        return dateB - dateA;
      });
  }, [filteredPayments]);

  const monthlySummary = useMemo(() => {
    const successful = filteredPayments.filter(
      (p) => p.status === 'successful' && p.type !== 'disbursement',
    );
    const totalPaid = successful.reduce((sum, p) => sum + p.amount, 0);
    const totalCount = filteredPayments.length;
    const onTimeCount = filteredPayments.filter(
      (p) => p.status === 'successful',
    ).length;
    const onTimePercent =
      totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 0;

    return { totalPaid, totalCount, onTimePercent };
  }, [filteredPayments]);

  const getOnTimeColor = (percent: number): string => {
    if (percent > 90) return colors.success;
    if (percent > 70) return colors.warning;
    return colors.error;
  };

  const getOnTimeBg = (percent: number): string => {
    if (percent > 90) return colors.successMuted;
    if (percent > 70) return colors.warningMuted;
    return colors.errorMuted;
  };

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <View style={[styles.sectionHeaderBar, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
          {section.title}
        </Text>
      </View>
    ),
    [colors],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Payment; index: number }) => {
      const iconConfig = getIconConfig(item.type, item.status, colors);
      const amountDisplay = getAmountDisplay(
        item.type,
        item.amount,
        item.status,
        colors.success,
        colors.error,
        colors.warning,
      );
      const statusConfig = getStatusConfig(item.status, colors);

      return (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: index * 60 }}
        >
          <View style={[styles.txnCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.txnRow}>
              <View style={[styles.txnIconCircle, { backgroundColor: iconConfig.bg }]}>
                <MaterialCommunityIcons
                  name={iconConfig.iconName}
                  size={20}
                  color={iconConfig.iconColor}
                />
              </View>

              <View style={styles.txnMiddle}>
                <Text
                  style={[styles.txnTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {TYPE_LABELS[item.type]}
                </Text>
                <Text
                  style={[styles.txnMethod, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {item.methodDetail} {'\u2022'} {formatDate(item.date)}
                </Text>
              </View>

              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, { color: amountDisplay.color }]}>
                  {amountDisplay.text}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                  <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.txnFooter, { borderTopColor: colors.border }]}>
              <MaterialCommunityIcons
                name="identifier"
                size={12}
                color={colors.textMuted}
              />
              <Text
                style={[styles.txnId, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {item.transactionId}
              </Text>
            </View>
          </View>
        </MotiView>
      );
    },
    [colors],
  );

  return (
    <ScreenWrapper
      headerTitle="Payment History"
      onBack={() => navigation.goBack()}
      scrollable={false}
    >
      {/* ── Month Pills ── */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthPills}
          style={styles.monthPillsScroll}
        >
          {MONTH_OPTIONS.map((month) => (
            <View key={month} style={styles.monthChipWrapper}>
              <AppChip
                label={month}
                selected={selectedMonth === month}
                onPress={() => setSelectedMonth(month)}
              />
            </View>
          ))}
        </ScrollView>
      </MotiView>

      {/* ── Monthly Summary ── */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 80 }}
      >
        <View style={styles.summaryWrapper}>
          <AppCard style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              {/* Total Paid */}
              <View style={styles.summaryCol}>
                <View style={[styles.summaryIconDot, { backgroundColor: colors.primaryMuted }]}>
                  <MaterialCommunityIcons name="cash-check" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                  Total Paid
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(monthlySummary.totalPaid)}
                </Text>
              </View>

              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

              {/* Count */}
              <View style={styles.summaryCol}>
                <View style={[styles.summaryIconDot, { backgroundColor: colors.infoMuted }]}>
                  <MaterialCommunityIcons name="counter" size={16} color={colors.info} />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                  Payments
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {monthlySummary.totalCount}
                </Text>
              </View>

              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

              {/* On-Time */}
              <View style={styles.summaryCol}>
                <View
                  style={[
                    styles.summaryIconDot,
                    { backgroundColor: getOnTimeBg(monthlySummary.onTimePercent) },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={16}
                    color={getOnTimeColor(monthlySummary.onTimePercent)}
                  />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                  On-Time
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: getOnTimeColor(monthlySummary.onTimePercent) },
                  ]}
                >
                  {monthlySummary.onTimePercent}%
                </Text>
              </View>
            </View>
          </AppCard>
        </View>
      </MotiView>

      {/* ── Transaction List ── */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt"
            title="No Payments Found"
            description={`No payment history for ${selectedMonth}`}
          />
        }
        ListFooterComponent={<MadeByFooter />}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  /* ── Month Pills ── */
  monthPillsScroll: {
    marginBottom: 16,
  },
  monthPills: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
  },
  monthChipWrapper: {
    marginRight: 4,
  },

  /* ── Summary ── */
  summaryWrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryIconDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 48,
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  sectionHeaderBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },

  /* ── Transaction Card ── */
  txnCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnMiddle: {
    flex: 1,
    marginLeft: 12,
  },
  txnTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  txnMethod: {
    fontSize: 12,
    marginTop: 3,
  },
  txnRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  txnFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  txnId: {
    fontSize: 11,
    fontWeight: '400',
    flex: 1,
  },
});

export default PaymentHistoryScreen;
