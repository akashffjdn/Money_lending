import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MotiView } from '../../utils/MotiCompat';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../hooks/useTheme';
import { LoanStackParamList } from '../../types/navigation';
import { useLoanStore } from '../../store/loanStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

import ScreenWrapper from '../../components/layout/ScreenWrapper';
import AppCard from '../../components/ui/AppCard';
import AppBadge from '../../components/ui/AppBadge';
import AppButton from '../../components/ui/AppButton';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import Section from '../../components/layout/Section';
import EmptyState from '../../components/feedback/EmptyState';

import type { Loan, LoanStatus, RepaymentEntry } from '../../types/loan';

type Props = NativeStackScreenProps<LoanStackParamList, 'LoanDetail'>;

const INITIAL_SCHEDULE_COUNT = 6;

// --- Helpers ---

const STATUS_BADGE_VARIANT: Record<
  LoanStatus,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  active: 'success',
  pending: 'warning',
  overdue: 'error',
  closed: 'neutral',
  approved: 'info',
  rejected: 'error',
};

const STATUS_GRADIENT: Record<LoanStatus, [string, string]> = {
  active: ['#0B1426', '#162240'],
  overdue: ['#991B1B', '#DC2626'],
  closed: ['#065F46', '#10B981'],
  pending: ['#A06D08', '#C8850A'],
  approved: ['#1E40AF', '#3B82F6'],
  rejected: ['#7F1D1D', '#EF4444'],
};

const LOAN_TYPE_ICONS: Record<
  string,
  React.ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  personal: 'wallet',
  business: 'briefcase',
  education: 'school',
  medical: 'hospital-box',
  home_renovation: 'home',
  vehicle: 'car',
};

const SCHEDULE_STATUS_CONFIG: Record<
  RepaymentEntry['status'],
  {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
    bg: string;
    label: string;
  }
> = {
  paid: { icon: 'check-circle', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', label: 'Paid' },
  current: { icon: 'clock-outline', color: '#C8850A', bg: 'rgba(200,133,10,0.12)', label: 'Current' },
  upcoming: { icon: 'minus', color: '#9CA3AF', bg: 'rgba(156,163,175,0.08)', label: 'Upcoming' },
  overdue: { icon: 'alert-circle', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Overdue' },
};

// --- Info Row Component ---

interface InfoRowProps {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, colors }) => (
  <View style={styles.infoCell}>
    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
  </View>
);

// --- Main Screen ---

const LoanDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { loanId } = route.params;

  const loan = useLoanStore((s) => s.getLoanById(loanId));

  const [showAllSchedule, setShowAllSchedule] = useState(false);

  const repaidPercent = useMemo(() => {
    if (!loan || loan.totalEmis === 0) return 0;
    return Math.round((loan.emiPaid / loan.totalEmis) * 100);
  }, [loan]);

  const visibleSchedule = useMemo(() => {
    if (!loan) return [];
    if (showAllSchedule) return loan.repaymentSchedule;
    return loan.repaymentSchedule.slice(0, INITIAL_SCHEDULE_COUNT);
  }, [loan, showAllSchedule]);

  const handlePayNow = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Toast.show({
      type: 'info',
      text1: 'Payment',
      text2: 'Payment flow opening...',
    });
  }, []);

  const handlePrepay = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({
      type: 'info',
      text1: 'Prepayment',
      text2: 'Prepayment flow opening...',
    });
  }, []);

  const handleDownloadStatement = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({
      type: 'success',
      text1: 'Download',
      text2: 'Statement download starting...',
    });
  }, []);

  if (!loan) {
    return (
      <ScreenWrapper
        headerTitle="Loan Details"
        onBack={() => navigation.goBack()}
      >
        <EmptyState
          icon="file-document-remove"
          title="Loan not found"
          description="The loan you are looking for could not be found"
        />
      </ScreenWrapper>
    );
  }

  const gradient = STATUS_GRADIENT[loan.status];
  const badgeVariant = STATUS_BADGE_VARIANT[loan.status];
  const loanIcon = LOAN_TYPE_ICONS[loan.type] || 'cash';

  return (
    <ScreenWrapper
      headerTitle={`${loan.typeLabel} Details`}
      onBack={() => navigation.goBack()}
      scrollable={false}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Decorative circle */}
            <View style={styles.heroDecorCircle} />

            <View style={styles.heroTopRow}>
              <View style={styles.heroTypeRow}>
                <View style={styles.heroIconCircle}>
                  <MaterialCommunityIcons
                    name={loanIcon}
                    size={22}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.heroTypeCol}>
                  <Text style={styles.heroTypeLabel}>{loan.typeLabel}</Text>
                  <Text style={styles.heroId}>{loan.id}</Text>
                </View>
              </View>
              <AppBadge
                label={
                  loan.status.charAt(0).toUpperCase() + loan.status.slice(1)
                }
                variant={badgeVariant}
              />
            </View>

            <View style={styles.heroAmountSection}>
              <Text style={styles.heroAmountLabel}>Outstanding Amount</Text>
              <AnimatedCounter
                value={loan.outstandingAmount}
                prefix={'\u20B9'}
                style={styles.heroAmount}
              />
              <Text style={styles.heroSanctioned}>
                of {formatCurrency(loan.sanctionedAmount)} sanctioned
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.heroProgressContainer}>
              <View style={styles.heroProgressMeta}>
                <Text style={styles.heroProgressLabel}>Repayment Progress</Text>
                <Text style={styles.heroProgressPercent}>{repaidPercent}%</Text>
              </View>
              <View style={styles.heroProgressTrack}>
                <View
                  style={[
                    styles.heroProgressFill,
                    { width: `${repaidPercent}%` },
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* Loan Details Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.sectionWrapper}
        >
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardTitleIcon, { backgroundColor: 'rgba(200,133,10,0.12)' }]}>
                <MaterialCommunityIcons name="file-document-outline" size={16} color="#C8850A" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Loan Details
              </Text>
            </View>
            <View style={styles.infoGrid}>
              <InfoRow
                label="Disbursement Date"
                value={
                  loan.disbursementDate
                    ? formatDate(loan.disbursementDate)
                    : '--'
                }
                colors={colors}
              />
              <InfoRow
                label="Tenure"
                value={`${loan.tenure} months`}
                colors={colors}
              />
              <InfoRow
                label="Interest Rate"
                value={`${loan.interestRate}% p.a.`}
                colors={colors}
              />
              <InfoRow
                label="Processing Fee"
                value={formatCurrency(loan.processingFee)}
                colors={colors}
              />
              <InfoRow
                label="Total Interest"
                value={formatCurrency(loan.totalInterest)}
                colors={colors}
              />
              <InfoRow
                label="Total Payable"
                value={formatCurrency(loan.totalPayable)}
                colors={colors}
              />
            </View>
          </View>
        </Animated.View>

        {/* EMI Details Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.sectionWrapper}
        >
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardTitleIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                <MaterialCommunityIcons name="cash-clock" size={16} color="#22C55E" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                EMI Details
              </Text>
            </View>

            {/* EMI Highlight */}
            <View style={[styles.emiHighlight, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emiHighlightLabel, { color: colors.textMuted }]}>
                Monthly EMI
              </Text>
              <AnimatedCounter
                value={loan.emiAmount}
                prefix={'\u20B9'}
                style={[styles.emiHighlightValue, { color: colors.primary }]}
              />
            </View>

            <View style={styles.infoGrid}>
              <InfoRow
                label="Next Due Date"
                value={
                  loan.nextEmiDate
                    ? formatDate(loan.nextEmiDate)
                    : 'N/A'
                }
                colors={colors}
              />
              <InfoRow
                label="EMIs Paid"
                value={`${loan.emiPaid} of ${loan.totalEmis}`}
                colors={colors}
              />
            </View>
            <View style={[styles.autoDebitRow, { borderTopColor: colors.border }]}>
              <View style={styles.autoDebitLeft}>
                <MaterialCommunityIcons
                  name="bank-transfer"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={[styles.autoDebitLabel, { color: colors.textSecondary }]}>
                  Auto-Debit
                </Text>
              </View>
              <AppBadge
                label={loan.autoDebit ? 'Active' : 'Inactive'}
                variant={loan.autoDebit ? 'success' : 'neutral'}
              />
            </View>
          </View>
        </Animated.View>

        {/* Bank Details Card */}
        {loan.bankName ? (
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.sectionWrapper}
          >
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardTitleIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                  <MaterialCommunityIcons name="bank" size={16} color="#3B82F6" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Bank Details
                </Text>
              </View>
              <View style={[styles.bankRow, { backgroundColor: colors.surface }]}>
                <View style={styles.bankIconCircle}>
                  <MaterialCommunityIcons
                    name="bank"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.bankInfo}>
                  <Text style={[styles.bankName, { color: colors.text }]}>
                    {loan.bankName}
                  </Text>
                  <Text style={[styles.bankAccount, { color: colors.textMuted }]}>
                    Account {loan.accountNumber}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* Repayment Schedule */}
        {loan.repaymentSchedule.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Section title="Repayment Schedule">
              <View style={[styles.scheduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header Row */}
                <View style={[styles.scheduleHeader, { borderBottomColor: colors.border }]}>
                  <Text
                    style={[styles.scheduleHeaderText, { color: colors.textMuted, flex: 0.5 }]}
                  >
                    #
                  </Text>
                  <Text
                    style={[styles.scheduleHeaderText, { color: colors.textMuted, flex: 1.2 }]}
                  >
                    Due Date
                  </Text>
                  <Text
                    style={[styles.scheduleHeaderText, { color: colors.textMuted, flex: 1 }]}
                  >
                    Amount
                  </Text>
                  <Text
                    style={[
                      styles.scheduleHeaderText,
                      { color: colors.textMuted, flex: 1, textAlign: 'right' },
                    ]}
                  >
                    Status
                  </Text>
                </View>

                {/* Schedule Rows */}
                {visibleSchedule.map((entry) => {
                  const statusConfig = SCHEDULE_STATUS_CONFIG[entry.status];
                  const isCurrentRow = entry.status === 'current';
                  const isOverdue = entry.status === 'overdue';

                  return (
                    <View
                      key={entry.month}
                      style={[
                        styles.scheduleRow,
                        { borderBottomColor: colors.border },
                        isCurrentRow && {
                          backgroundColor: 'rgba(200,133,10,0.08)',
                          borderRadius: 10,
                          marginHorizontal: -8,
                          paddingHorizontal: 8,
                          borderLeftWidth: 3,
                          borderLeftColor: '#C8850A',
                        },
                        isOverdue && {
                          backgroundColor: 'rgba(239,68,68,0.06)',
                          borderRadius: 10,
                          marginHorizontal: -8,
                          paddingHorizontal: 8,
                          borderLeftWidth: 3,
                          borderLeftColor: '#EF4444',
                        },
                      ]}
                    >
                      <Text
                        style={[styles.scheduleCell, { color: colors.textSecondary, flex: 0.5 }]}
                      >
                        {entry.month}
                      </Text>
                      <Text
                        style={[styles.scheduleCell, { color: colors.text, flex: 1.2 }]}
                      >
                        {formatDate(entry.dueDate, 'DD MMM')}
                      </Text>
                      <Text
                        style={[styles.scheduleCell, { color: colors.text, fontWeight: '600', flex: 1 }]}
                      >
                        {formatCurrency(entry.amount)}
                      </Text>
                      <View
                        style={[styles.scheduleStatusCell, { flex: 1 }]}
                      >
                        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                          <MaterialCommunityIcons
                            name={statusConfig.icon}
                            size={13}
                            color={statusConfig.color}
                          />
                          <Text
                            style={[
                              styles.scheduleStatusText,
                              { color: statusConfig.color },
                            ]}
                          >
                            {statusConfig.label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Show More / Show Less */}
                {loan.repaymentSchedule.length > INITIAL_SCHEDULE_COUNT && (
                  <Pressable
                    onPress={() => setShowAllSchedule((prev) => !prev)}
                    style={[styles.showMoreBtn, { borderTopColor: colors.border }]}
                    hitSlop={8}
                  >
                    <Text style={[styles.showMoreText, { color: colors.primary }]}>
                      {showAllSchedule
                        ? 'Show Less'
                        : `View All ${loan.repaymentSchedule.length} EMIs`}
                    </Text>
                    <MaterialCommunityIcons
                      name={showAllSchedule ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.primary}
                    />
                  </Pressable>
                )}
              </View>
            </Section>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons */}
      {loan.status !== 'closed' && loan.status !== 'rejected' && (
        <View
          style={[
            styles.bottomActions,
            {
              paddingBottom: insets.bottom + 16,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.bottomPrimaryRow}>
            <View style={styles.payNowWrapper}>
              <LinearGradient
                colors={['#C8850A', '#E8A830']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payNowGradient}
              >
                <Pressable
                  onPress={handlePayNow}
                  style={styles.payNowInner}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  <MaterialCommunityIcons name="cash-fast" size={18} color="#FFFFFF" />
                  <Text style={styles.payNowText}>Pay Now</Text>
                </Pressable>
              </LinearGradient>
            </View>
            <View style={styles.prepayWrapper}>
              <Pressable
                onPress={handlePrepay}
                style={[styles.prepayBtn, { borderColor: colors.primary }]}
              >
                <Text style={[styles.prepayText, { color: colors.primary }]}>Prepay</Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            onPress={handleDownloadStatement}
            style={styles.downloadBtn}
          >
            <MaterialCommunityIcons
              name="download"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.downloadText, { color: colors.primary }]}>
              Download Statement
            </Text>
          </Pressable>
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },

  // Hero
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  heroDecorCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTypeCol: {
    marginLeft: 12,
  },
  heroTypeLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
    fontWeight: '500',
  },
  heroAmountSection: {
    marginTop: 24,
  },
  heroAmountLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSanctioned: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: '400',
  },
  heroProgressContainer: {
    marginTop: 20,
  },
  heroProgressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroProgressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  heroProgressPercent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  // Info Cards
  sectionWrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoCell: {
    width: '50%',
    marginBottom: 18,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },

  // EMI
  emiHighlight: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  emiHighlightLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  emiHighlightValue: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  autoDebitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  autoDebitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoDebitLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Bank
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  bankIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(200,133,10,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInfo: {
    marginLeft: 12,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600',
  },
  bankAccount: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '400',
  },

  // Schedule
  scheduleCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scheduleHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scheduleCell: {
    fontSize: 13,
    fontWeight: '500',
  },
  scheduleStatusCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scheduleStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomPrimaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  payNowWrapper: {
    flex: 1,
  },
  payNowGradient: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  payNowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  payNowText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prepayWrapper: {
    flex: 0.5,
  },
  prepayBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  prepayText: {
    fontSize: 15,
    fontWeight: '600',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 6,
    gap: 6,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoanDetailScreen;
