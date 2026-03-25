import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MotiView } from '../../utils/MotiCompat';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { LoanStackParamList } from '../../types/navigation';
import { useLoanStore } from '../../store/loanStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

import ScreenWrapper from '../../components/layout/ScreenWrapper';
import AppChip from '../../components/ui/AppChip';
import AppBadge from '../../components/ui/AppBadge';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import EmptyState from '../../components/feedback/EmptyState';
import { Skeleton } from '../../components/feedback/Skeleton';

import type { Loan, LoanType, LoanStatus } from '../../types/loan';

type Props = NativeStackScreenProps<LoanStackParamList, 'LoanList'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// --- Helpers ---

type FilterOption = 'all' | 'active' | 'closed' | 'pending' | 'overdue';

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
];

const LOAN_TYPE_ICONS: Record<
  LoanType,
  {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
    bg: string;
  }
> = {
  personal: { icon: 'wallet', color: '#C8850A', bg: 'rgba(200,133,10,0.12)' },
  business: { icon: 'briefcase', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  education: { icon: 'school', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  medical: { icon: 'hospital-box', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  home_renovation: { icon: 'home', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  vehicle: { icon: 'car', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
};

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

// --- Loan Row Component ---

interface LoanRowProps {
  item: Loan;
  index: number;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

const LoanRow: React.FC<LoanRowProps> = ({ item, index, onPress, colors }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animatedStyle = {
    transform: [{ scale }],
  };

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, damping: 15, stiffness: 200, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }).start();
  };

  const loanMeta = LOAN_TYPE_ICONS[item.type];
  const badgeVariant = STATUS_BADGE_VARIANT[item.status];
  const repaidPercent =
    item.totalEmis > 0
      ? Math.round((item.emiPaid / item.totalEmis) * 100)
      : 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 450, delay: index * 80 }}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.loanPressable, animatedStyle]}
      >
        <View
          style={[
            styles.loanCard,
            {
              backgroundColor: colors.card,
              shadowColor: '#000',
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Row: Icon + Type + Badge */}
          <View style={styles.topRow}>
            <View style={styles.topRowLeft}>
              <View
                style={[styles.typeCircle, { backgroundColor: loanMeta.bg }]}
              >
                <MaterialCommunityIcons
                  name={loanMeta.icon}
                  size={20}
                  color={loanMeta.color}
                />
              </View>
              <View style={styles.typeColumn}>
                <Text style={[styles.typeLabel, { color: colors.text }]}>
                  {item.typeLabel}
                </Text>
                <Text style={[styles.loanId, { color: colors.textMuted }]}>
                  {item.id}
                </Text>
              </View>
            </View>
            <AppBadge
              label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              variant={badgeVariant}
            />
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Amount Section */}
          <View style={styles.amountSection}>
            <View style={styles.amountCol}>
              <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                Outstanding
              </Text>
              <Text style={[styles.outstandingText, { color: colors.text }]}>
                {formatCurrency(item.outstandingAmount)}
              </Text>
            </View>
            <View style={[styles.amountCol, { alignItems: 'flex-end' }]}>
              <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                Sanctioned
              </Text>
              <Text style={[styles.sanctionedText, { color: colors.textSecondary }]}>
                {formatCurrency(item.sanctionedAmount)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressTrack, { backgroundColor: colors.surface }]}
            >
              <LinearGradient
                colors={[loanMeta.color, loanMeta.color + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${repaidPercent}%` }]}
              />
            </View>
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                {repaidPercent}% repaid
              </Text>
              <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                {item.emiPaid}/{item.totalEmis} EMIs
              </Text>
            </View>
          </View>

          {/* EMI Info Row */}
          {item.emiAmount > 0 && (
            <View style={[styles.emiRow, { backgroundColor: colors.surface }]}>
              <View style={styles.emiItem}>
                <MaterialCommunityIcons
                  name="cash-clock"
                  size={15}
                  color={colors.primary}
                />
                <Text style={[styles.emiText, { color: colors.text }]}>
                  {formatCurrency(item.emiAmount)}
                  <Text style={{ color: colors.textMuted, fontWeight: '400' }}>/mo</Text>
                </Text>
              </View>
              {item.nextEmiDate && (
                <View style={styles.emiItem}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={15}
                    color={item.status === 'overdue' ? '#EF4444' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.emiText,
                      { color: item.status === 'overdue' ? '#EF4444' : colors.text },
                    ]}
                  >
                    {formatDate(item.nextEmiDate, 'DD MMM')}
                  </Text>
                </View>
              )}
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.textMuted}
              />
            </View>
          )}
        </View>
      </AnimatedPressable>
    </MotiView>
  );
};

// --- Loading Skeleton ---

const LoadingSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    <Skeleton width="100%" height={180} borderRadius={20} style={{ marginHorizontal: 20, marginTop: 12 }} />
    <View style={styles.filterSkeletonRow}>
      <Skeleton width={56} height={36} borderRadius={18} style={{ marginRight: 8 }} />
      <Skeleton width={68} height={36} borderRadius={18} style={{ marginRight: 8 }} />
      <Skeleton width={68} height={36} borderRadius={18} style={{ marginRight: 8 }} />
      <Skeleton width={76} height={36} borderRadius={18} />
    </View>
    {[0, 1, 2].map((i) => (
      <View key={i} style={styles.skeletonCardWrapper}>
        <Skeleton width="100%" height={200} borderRadius={16} />
      </View>
    ))}
  </View>
);

// --- Main Screen ---

const LoanListScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const loans = useLoanStore((s) => s.loans);
  const isLoading = useLoanStore((s) => s.isLoading);
  const loadLoans = useLoanStore((s) => s.loadLoans);

  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLoans();
    setRefreshing(false);
  }, [loadLoans]);

  const filteredLoans = useMemo(() => {
    if (selectedFilter === 'all') return loans;
    return loans.filter((loan) => loan.status === selectedFilter);
  }, [loans, selectedFilter]);

  const totalOutstanding = useMemo(
    () => loans.reduce((sum, l) => sum + l.outstandingAmount, 0),
    [loans],
  );

  const totalSanctioned = useMemo(
    () => loans.reduce((sum, l) => sum + l.sanctionedAmount, 0),
    [loans],
  );

  const activeCount = useMemo(
    () => loans.filter((l) => l.status === 'active' || l.status === 'overdue').length,
    [loans],
  );

  const nextEmi = useMemo(() => {
    const activeLoans = loans.filter(
      (l) => l.nextEmiDate && (l.status === 'active' || l.status === 'overdue'),
    );
    if (activeLoans.length === 0) return null;
    activeLoans.sort(
      (a, b) =>
        new Date(a.nextEmiDate).getTime() - new Date(b.nextEmiDate).getTime(),
    );
    return activeLoans[0];
  }, [loans]);

  const handleFilterPress = useCallback(
    async (filter: FilterOption) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedFilter(filter);
    },
    [],
  );

  const renderLoanItem = useCallback(
    ({ item, index }: { item: Loan; index: number }) => (
      <LoanRow
        item={item}
        index={index}
        onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })}
        colors={colors}
      />
    ),
    [colors, navigation],
  );

  const keyExtractor = useCallback((item: Loan) => item.id, []);

  if (isLoading && loans.length === 0) {
    return (
      <ScreenWrapper headerTitle="My Loans" scrollable={false}>
        <LoadingSkeleton />
      </ScreenWrapper>
    );
  }

  const overallRepaid = totalSanctioned > 0
    ? Math.round(((totalSanctioned - totalOutstanding) / totalSanctioned) * 100)
    : 0;

  return (
    <ScreenWrapper headerTitle="My Loans" scrollable={false}>
      <FlatList
        data={filteredLoans}
        keyExtractor={keyExtractor}
        renderItem={renderLoanItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* ---- HERO SUMMARY CARD ---- */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
              style={styles.heroCardOuter}
            >
              <LinearGradient
                colors={['#0B1426', '#1A2744']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                {/* Decorative elements */}
                <View style={styles.heroDecor1} />
                <View style={styles.heroDecor2} />

                {/* Top: Total Outstanding */}
                <View style={styles.heroTop}>
                  <Text style={styles.heroLabel}>Total Outstanding</Text>
                  <AnimatedCounter
                    value={totalOutstanding}
                    prefix={'\u20B9'}
                    style={styles.heroAmount}
                  />
                  <View style={styles.heroMeta}>
                    <View style={styles.heroMetaItem}>
                      <View style={[styles.heroMetaDot, { backgroundColor: '#C8850A' }]} />
                      <Text style={styles.heroMetaText}>
                        {activeCount} active {activeCount === 1 ? 'loan' : 'loans'}
                      </Text>
                    </View>
                    <View style={styles.heroMetaDivider} />
                    <View style={styles.heroMetaItem}>
                      <View style={[styles.heroMetaDot, { backgroundColor: '#22C55E' }]} />
                      <Text style={styles.heroMetaText}>{overallRepaid}% repaid</Text>
                    </View>
                  </View>
                </View>

                {/* Bottom: Next EMI strip */}
                {nextEmi && (
                  <View style={styles.heroEmiStrip}>
                    <View style={styles.heroEmiLeft}>
                      <MaterialCommunityIcons
                        name="calendar-clock"
                        size={16}
                        color="#C8850A"
                      />
                      <Text style={styles.heroEmiLabel}>Next EMI</Text>
                    </View>
                    <View style={styles.heroEmiRight}>
                      <Text style={styles.heroEmiAmount}>
                        {formatCurrency(nextEmi.emiAmount)}
                      </Text>
                      <Text style={styles.heroEmiDate}>
                        {formatDate(nextEmi.nextEmiDate, 'DD MMM')}
                      </Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </MotiView>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {FILTER_OPTIONS.map((option) => (
                <View key={option.key} style={styles.chipWrapper}>
                  <AppChip
                    label={option.label}
                    selected={selectedFilter === option.key}
                    onPress={() => handleFilterPress(option.key)}
                  />
                </View>
              ))}
            </ScrollView>

            {/* Section title */}
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Loans
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {filteredLoans.length} {filteredLoans.length === 1 ? 'loan' : 'loans'}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="cash-remove"
            title="No loans found"
            description="No loans match the selected filter"
          />
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 120,
  },

  // Hero Summary Card
  heroCardOuter: {
    marginHorizontal: 20,
    marginTop: 12,
    shadowColor: '#C8850A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecor1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(200,133,10,0.08)',
  },
  heroDecor2: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroTop: {
    zIndex: 1,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  heroMetaDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
  },
  heroEmiStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    zIndex: 1,
  },
  heroEmiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroEmiLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  heroEmiRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroEmiAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E8A830',
  },
  heroEmiDate: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },

  // Filter chips
  filterRow: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 8,
    flexDirection: 'row',
  },
  chipWrapper: {
    marginRight: 0,
  },

  // Section title
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Loan row
  loanPressable: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  loanCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  typeCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeColumn: {
    marginLeft: 12,
    flex: 1,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  loanId: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },

  // Amount
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountCol: {},
  amountLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  outstandingText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sanctionedText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Progress
  progressContainer: {
    marginTop: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  // EMI row
  emiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emiText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Skeleton
  skeletonContainer: {
    flex: 1,
    paddingTop: 12,
  },
  filterSkeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  skeletonCardWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
  },
});

export default LoanListScreen;
