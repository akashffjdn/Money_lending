import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MotiView } from '../../utils/MotiCompat';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { PaymentStackParamList } from '../../types/navigation';
import { usePaymentStore } from '../../store/paymentStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

import ScreenWrapper from '../../components/layout/ScreenWrapper';
import Section from '../../components/layout/Section';
import Divider from '../../components/layout/Divider';
import AppCard from '../../components/ui/AppCard';
import AppBadge from '../../components/ui/AppBadge';
import AppButton from '../../components/ui/AppButton';
import AppSwitch from '../../components/ui/AppSwitch';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import BulkPaymentSheet, { BulkPaymentSheetRef } from '../../components/shared/BulkPaymentSheet';
import SinglePaymentSheet, { SinglePaymentSheetRef } from '../../components/shared/SinglePaymentSheet';
import OverduePaymentSheet, { OverduePaymentSheetRef } from '../../components/shared/OverduePaymentSheet';
import AddPaymentMethodSheet, { AddPaymentMethodSheetRef } from '../../components/shared/AddPaymentMethodSheet';

import type { UpcomingPayment, PaymentMethodInfo } from '../../types/payment';
import { BorderRadius, Spacing } from '../../constants/spacing';

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentDashboard'>;

const METHOD_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  upi: 'cellphone',
  bank: 'bank',
  card: 'credit-card',
};

const LOAN_TYPE_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  Personal: 'account-cash',
  Home: 'home-city',
  Vehicle: 'car',
  Education: 'school',
  Business: 'briefcase',
  Gold: 'gold',
};

const PaymentDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    upcomingPayments,
    paymentMethods,
    isLoading,
    loadPayments,
  } = usePaymentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);

  const bulkPaymentRef = useRef<BulkPaymentSheetRef>(null);
  const singlePaymentRef = useRef<SinglePaymentSheetRef>(null);
  const overduePaymentRef = useRef<OverduePaymentSheetRef>(null);
  const addMethodRef = useRef<AddPaymentMethodSheetRef>(null);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  }, [loadPayments]);

  const sortedPayments = useMemo(
    () =>
      [...upcomingPayments].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      ),
    [upcomingPayments],
  );

  const totalDue = useMemo(
    () => sortedPayments.reduce((sum, p) => sum + p.emiAmount, 0),
    [sortedPayments],
  );

  const overduePayments = useMemo(
    () => sortedPayments.filter((p) => p.isOverdue),
    [sortedPayments],
  );

  const overdueTotalAmount = useMemo(
    () => overduePayments.reduce((sum, p) => sum + p.emiAmount, 0),
    [overduePayments],
  );

  const nextDueDate = useMemo(() => {
    const nonOverdue = sortedPayments.filter((p) => !p.isOverdue);
    return nonOverdue.length > 0 ? nonOverdue[0].dueDate : null;
  }, [sortedPayments]);

  const daysRemaining = useMemo(() => {
    if (!nextDueDate) {
      return overduePayments.length > 0 ? overduePayments[0].daysLeft : 0;
    }
    const diff = Math.ceil(
      (new Date(nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  }, [nextDueDate, overduePayments]);

  const handlePayAll = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bulkPaymentRef.current?.open();
  }, []);

  const handlePaySingleItem = useCallback(async (item: UpcomingPayment) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    singlePaymentRef.current?.open(item);
  }, []);

  const handlePayOverdue = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    overduePaymentRef.current?.open(overduePayments);
  }, [overduePayments]);

  const handleAddPaymentMethod = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addMethodRef.current?.open();
  }, []);

  const getLoanIcon = (loanType: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
    const key = Object.keys(LOAN_TYPE_ICONS).find((k) =>
      loanType.toLowerCase().includes(k.toLowerCase()),
    );
    return key ? LOAN_TYPE_ICONS[key] : 'cash';
  };

  const renderUpcomingItem = useCallback(
    ({ item, index }: { item: UpcomingPayment; index: number }) => {
      const isOverdue = item.isOverdue;

      return (
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: index * 80 }}
        >
          <Pressable
            style={({ pressed }) => [
              styles.upcomingCard,
              {
                backgroundColor: isOverdue
                  ? colors.errorMuted
                  : colors.card,
                borderColor: isOverdue ? colors.error : colors.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
            onPress={() => handlePaySingleItem(item)}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isOverdue
                    ? colors.errorMuted
                    : colors.primaryMuted,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isOverdue ? 'alert' : getLoanIcon(item.loanType)}
                size={20}
                color={isOverdue ? colors.error : colors.primary}
              />
            </View>

            <View style={styles.upcomingMiddle}>
              <Text
                style={[styles.upcomingTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.loanType}
              </Text>
              <Text
                style={[styles.upcomingSubtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.loanId} {'\u2022'} Due {formatDate(item.dueDate)}
              </Text>
            </View>

            <View style={styles.upcomingRight}>
              <Text
                style={[
                  styles.upcomingAmount,
                  { color: isOverdue ? colors.error : colors.text },
                ]}
              >
                {formatCurrency(item.emiAmount)}
              </Text>
              <View
                style={[
                  styles.payPill,
                  {
                    backgroundColor: isOverdue
                      ? colors.error
                      : colors.primaryMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.payPillText,
                    { color: isOverdue ? '#FFFFFF' : colors.primary },
                  ]}
                >
                  Pay
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={14}
                  color={isOverdue ? '#FFFFFF' : colors.primary}
                />
              </View>
            </View>
          </Pressable>
        </MotiView>
      );
    },
    [colors, handlePaySingleItem],
  );

  const renderPaymentMethod = useCallback(
    (method: PaymentMethodInfo, index: number, isLast: boolean) => (
      <View key={method.id}>
        <MotiView
          from={{ opacity: 0, translateX: -12 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 350, delay: index * 70 }}
        >
          <View style={styles.methodItem}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <MaterialCommunityIcons
                name={METHOD_ICONS[method.type] ?? 'credit-card'}
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.methodMiddle}>
              <Text
                style={[styles.methodName, { color: colors.text }]}
                numberOfLines={1}
              >
                {method.name}
              </Text>
              <Text style={[styles.methodDetail, { color: colors.textMuted }]}>
                {method.detail}
              </Text>
            </View>

            {method.isDefault && (
              <View
                style={[
                  styles.defaultBadge,
                  { backgroundColor: colors.successMuted },
                ]}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={12}
                  color={colors.success}
                />
                <Text style={[styles.defaultBadgeText, { color: colors.success }]}>
                  Default
                </Text>
              </View>
            )}
          </View>
        </MotiView>
        {!isLast && (
          <View style={styles.methodDividerWrapper}>
            <Divider style={{ marginLeft: 52 }} />
          </View>
        )}
      </View>
    ),
    [colors],
  );

  if (isLoading && upcomingPayments.length === 0) {
    return (
      <ScreenWrapper headerTitle="Payments">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerTitle="Payments"
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightAction={
        <Pressable
          onPress={() => navigation.navigate('PaymentHistory')}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="history"
            size={24}
            color={colors.text}
          />
        </Pressable>
      }
    >
      {/* ── Hero Card ── */}
      <MotiView
        from={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500 }}
      >
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={['#0B1426', '#162240']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Decorative accent line */}
            <View style={styles.heroAccentLine} />

            <Text style={styles.heroOverline}>TOTAL DUE THIS MONTH</Text>

            <AnimatedCounter
              value={totalDue}
              prefix="₹"
              style={styles.heroAmount}
            />

            <View style={styles.heroMeta}>
              <View style={styles.heroDateRow}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={styles.heroDueText}>
                  {nextDueDate
                    ? `Next due: ${formatDate(nextDueDate)}`
                    : 'No upcoming EMIs'}
                </Text>
              </View>

              {daysRemaining > 0 ? (
                <View style={styles.heroDaysBadge}>
                  <Text style={styles.heroDaysBadgeText}>
                    {daysRemaining}d left
                  </Text>
                </View>
              ) : (
                <View style={[styles.heroDaysBadge, styles.heroDaysBadgeOverdue]}>
                  <Text style={[styles.heroDaysBadgeText, { color: '#EF4444' }]}>
                    {Math.abs(daysRemaining)}d overdue
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.payAllButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handlePayAll}
            >
              <Text style={styles.payAllText}>Pay All EMIs</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color="#0B1426"
              />
            </Pressable>
          </LinearGradient>
        </View>
      </MotiView>

      {/* ── Overdue Alert ── */}
      {overduePayments.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          <Pressable
            onPress={handlePayOverdue}
            style={({ pressed }) => [
              styles.overdueCard,
              {
                backgroundColor: colors.errorMuted,
                borderColor: `${colors.error}30`,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.overdueIconCircle, { backgroundColor: `${colors.error}20` }]}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color={colors.error}
              />
            </View>
            <View style={styles.overdueInfo}>
              <Text style={[styles.overdueTitle, { color: colors.error }]}>
                {overduePayments.length} Overdue EMI{overduePayments.length > 1 ? 's' : ''}
              </Text>
              <Text style={[styles.overdueSubtitle, { color: colors.textSecondary }]}>
                Total: {formatCurrency(overdueTotalAmount)}
              </Text>
            </View>
            <View style={[styles.payNowPill, { backgroundColor: colors.error }]}>
              <Text style={styles.payNowPillText}>Pay Now</Text>
            </View>
          </Pressable>
        </MotiView>
      )}

      {/* ── Upcoming Payments ── */}
      <Section
        title="Upcoming Payments"
        style={styles.section}
        rightAction={
          <Pressable
            onPress={() => navigation.navigate('PaymentHistory')}
            hitSlop={8}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </Pressable>
        }
      >
        <FlatList
          data={sortedPayments}
          keyExtractor={(item) => item.loanId}
          renderItem={renderUpcomingItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyUpcoming}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={40}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No upcoming payments
              </Text>
            </View>
          }
        />
      </Section>

      {/* ── Payment Methods ── */}
      <Section title="Payment Methods" style={styles.section}>
        <AppCard style={[styles.methodsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {paymentMethods.map((method, index) =>
            renderPaymentMethod(method, index, index === paymentMethods.length - 1),
          )}

          <Divider style={{ marginTop: 4 }} />

          <Pressable
            style={({ pressed }) => [
              styles.addMethodRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleAddPaymentMethod}
          >
            <View
              style={[
                styles.addMethodIconCircle,
                { borderColor: colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name="plus"
                size={16}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.addMethodText, { color: colors.primary }]}>
              Add Payment Method
            </Text>
          </Pressable>
        </AppCard>
      </Section>

      {/* ── Auto-Debit ── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 300 }}
      >
        <View style={styles.autoDebitWrapper}>
          <AppCard
            style={[
              styles.autoDebitCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.autoDebitHeader}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <MaterialCommunityIcons
                  name="refresh-auto"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.autoDebitInfo}>
                <Text style={[styles.autoDebitTitle, { color: colors.text }]}>
                  e-NACH Auto-Debit
                </Text>
                <Text
                  style={[styles.autoDebitSubtitle, { color: colors.textSecondary }]}
                >
                  SBI XXXX1234 {'\u2022'} {formatCurrency(12500)}/month
                </Text>
              </View>
              <AppSwitch
                value={autoDebitEnabled}
                onValueChange={setAutoDebitEnabled}
              />
            </View>

            <View style={[styles.autoDebitFooter, { borderTopColor: colors.border }]}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={14}
                color={colors.textMuted}
              />
              <Text style={[styles.autoDebitNext, { color: colors.textMuted }]}>
                Next debit: 5 Apr 2026
              </Text>
            </View>
          </AppCard>
        </View>
      </MotiView>

      <View style={styles.bottomSpacer} />

      {/* Payment Flow Sheets */}
      <BulkPaymentSheet ref={bulkPaymentRef} />
      <SinglePaymentSheet ref={singlePaymentRef} />
      <OverduePaymentSheet ref={overduePaymentRef} />
      <AddPaymentMethodSheet ref={addMethodRef} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },

  /* ── Hero ── */
  heroWrapper: {
    marginTop: 8,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  heroAccentLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C8850A',
  },
  heroOverline: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDueText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
  heroDaysBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroDaysBadgeOverdue: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  heroDaysBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  payAllButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  payAllText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1426',
  },

  /* ── Overdue Alert ── */
  overdueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  overdueIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueInfo: {
    flex: 1,
    marginLeft: 12,
  },
  overdueTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  overdueSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  payNowPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  payNowPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Upcoming ── */
  section: {
    marginTop: 24,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingMiddle: {
    flex: 1,
    marginLeft: 12,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  upcomingSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  upcomingRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  upcomingAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  payPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  payPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyUpcoming: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* ── Methods ── */
  methodsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  methodMiddle: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
  },
  methodDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  methodDividerWrapper: {
    paddingVertical: 0,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  addMethodIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMethodText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* ── Auto-Debit ── */
  autoDebitWrapper: {
    marginTop: 24,
  },
  autoDebitCard: {
    borderRadius: 16,
    borderWidth: 1,
  },
  autoDebitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoDebitInfo: {
    flex: 1,
    marginLeft: 12,
  },
  autoDebitTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  autoDebitSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  autoDebitFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  autoDebitNext: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* ── Misc ── */
  bottomSpacer: {
    height: 40,
  },
});

export default PaymentDashboardScreen;
