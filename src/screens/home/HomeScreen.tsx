import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedScrollHandler,
  withRepeat,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { MotiView } from '../../utils/MotiCompat';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { HomeStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { useLoanStore } from '../../store/loanStore';
import { usePaymentStore } from '../../store/paymentStore';
import { useNotificationStore, useUnreadCount } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';
import { getGreeting, formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

import AppCard from '../../components/ui/AppCard';
import AppBadge from '../../components/ui/AppBadge';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import ProgressRing from '../../components/shared/ProgressRing';
import EmptyState from '../../components/feedback/EmptyState';
import { Skeleton } from '../../components/feedback/Skeleton';

import type { Loan } from '../../types/loan';
import type { Payment, TransactionType } from '../../types/payment';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOAN_CARD_WIDTH = 280;
const LOAN_CARD_GAP = 12;
const QUICK_ACTION_SIZE = 56;
const PROMO_CARD_WIDTH = SCREEN_WIDTH - 40;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// --- Credit score helpers ---
const getCreditLabel = (score: number): string => {
  if (score >= 750) return 'Excellent';
  if (score >= 650) return 'Good';
  if (score >= 550) return 'Fair';
  return 'Poor';
};

const getCreditColor = (score: number): string => {
  if (score >= 750) return '#22C55E';
  if (score >= 650) return '#E8A830';
  if (score >= 550) return '#F97316';
  return '#EF4444';
};

// --- Loan type icon map ---
const LOAN_TYPE_ICONS: Record<string, { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string }> = {
  personal: { icon: 'account-cash', color: '#C8850A' },
  business: { icon: 'briefcase', color: '#3B82F6' },
  education: { icon: 'school', color: '#8B5CF6' },
  medical: { icon: 'hospital', color: '#EF4444' },
  home_renovation: { icon: 'home-edit', color: '#22C55E' },
  vehicle: { icon: 'car', color: '#F97316' },
};

// --- Status badge variant map ---
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  active: 'success',
  overdue: 'error',
  pending: 'warning',
  approved: 'info',
  closed: 'neutral',
  rejected: 'error',
};

// --- Transaction helpers ---
const getTransactionLabel = (type: TransactionType): string => {
  switch (type) {
    case 'emi_payment': return 'EMI Payment';
    case 'disbursement': return 'Loan Disbursement';
    case 'processing_fee': return 'Processing Fee';
    case 'late_fee': return 'Late Fee';
    case 'prepayment': return 'Prepayment';
    default: return 'Transaction';
  }
};

const isIncomingTransaction = (type: TransactionType): boolean => {
  return type === 'disbursement';
};

// --- Notification Badge Pulse ---
const NotificationBadge: React.FC = () => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 600 }),
        withTiming(1.0, { duration: 600 }),
      ),
      -1,
    );
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={[styles.notifDot, pulseStyle]} />
  );
};

// --- Quick Action Item ---
interface QuickActionProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  color: string;
  index: number;
  onPress: () => void;
  surfaceBg: string;
  textMuted: string;
}

const QuickActionItem: React.FC<QuickActionProps> = ({ icon, label, color, index, onPress, surfaceBg, textMuted }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 400, delay: 400 + index * 80 }}
      style={styles.quickActionWrapper}
    >
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, styles.quickActionPressable]}
      >
        <View style={[styles.quickActionCircle, { backgroundColor: surfaceBg }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.quickActionLabel, { color: textMuted }]} numberOfLines={1}>
          {label}
        </Text>
      </AnimatedPressable>
    </MotiView>
  );
};

// --- Promo Carousel ---
interface PromoItem {
  id: string;
  title: string;
  subtitle: string;
  gradient: [string, string];
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const PROMOS: PromoItem[] = [
  {
    id: '1',
    title: 'Pre-approved loan up to \u20B95 Lakhs!',
    subtitle: 'Apply now and get instant approval',
    gradient: ['#C8850A', '#E8A830'],
    icon: 'lightning-bolt',
  },
  {
    id: '2',
    title: 'Refer a friend & earn \u20B9500',
    subtitle: 'Per successful referral. No limits!',
    gradient: ['#16A34A', '#22C55E'],
    icon: 'gift-outline',
  },
  {
    id: '3',
    title: 'Complete KYC for instant approval',
    subtitle: 'Verify your identity in under 2 minutes',
    gradient: ['#2563EB', '#3B82F6'],
    icon: 'shield-check-outline',
  },
];

// --- Main Screen ---
const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  // Stores
  const user = useAuthStore((s) => s.user);
  const loans = useLoanStore((s) => s.loans);
  const loansLoading = useLoanStore((s) => s.isLoading);
  const loadLoans = useLoanStore((s) => s.loadLoans);
  const payments = usePaymentStore((s) => s.payments);
  const loadPayments = usePaymentStore((s) => s.loadPayments);
  const loadNotifications = useNotificationStore((s) => s.loadNotifications);
  const unreadCount = useUnreadCount();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);

  // Refs
  const promoListRef = useRef<FlatList<PromoItem>>(null);

  // Scroll animation
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Data
  const creditScore = user?.creditScore ?? 742;
  const creditLabel = getCreditLabel(creditScore);
  const creditColor = getCreditColor(creditScore);
  const creditProgress = (creditScore / 900) * 100;
  const firstName = user?.name?.split(' ')[0] || 'User';
  const firstInitial = firstName.charAt(0).toUpperCase();

  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Load data on mount
  useEffect(() => {
    loadLoans();
    loadPayments();
    loadNotifications();
  }, []);

  // Promo auto-scroll
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => {
        const next = (prev + 1) % PROMOS.length;
        promoListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadLoans(), loadPayments(), loadNotifications()]);
    setRefreshing(false);
  }, [loadLoans, loadPayments, loadNotifications]);

  // Navigation helpers
  const navigateToTab = (tab: string) => {
    navigation.getParent()?.navigate(tab as never);
  };

  // Quick actions data
  const quickActions = [
    {
      icon: 'cash-fast' as const,
      label: 'Apply Loan',
      color: '#C8850A',
      index: 0,
      onPress: () => navigateToTab('ApplyTab'),
    },
    {
      icon: 'credit-card-clock' as const,
      label: 'Pay EMI',
      color: '#22C55E',
      index: 1,
      onPress: () => navigateToTab('PaymentsTab'),
    },
    {
      icon: 'shield-check' as const,
      label: 'KYC',
      color: '#3B82F6',
      index: 2,
      onPress: () => navigateToTab('ProfileTab'),
    },
    {
      icon: 'calculator' as const,
      label: 'Calculator',
      color: '#8B5CF6',
      index: 3,
      onPress: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  ];

  // --- Render Loan Card ---
  const renderLoanCard = ({ item, index }: { item: Loan; index: number }) => {
    const loanMeta = LOAN_TYPE_ICONS[item.type] ?? { icon: 'cash', color: '#6B7280' };
    const repaidPercent = item.totalEmis > 0 ? Math.round((item.emiPaid / item.totalEmis) * 100) : 0;
    const badgeVariant = STATUS_VARIANT[item.status] ?? 'neutral';

    return (
      <MotiView
        from={{ opacity: 0, translateX: 60 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 450, delay: 600 + index * 100 }}
        style={{ width: LOAN_CARD_WIDTH, marginRight: LOAN_CARD_GAP }}
      >
        <Pressable
          onPress={() => {
            navigation.getParent()?.navigate('LoansTab' as never);
          }}
          style={({ pressed }) => [
            styles.loanCard,
            {
              backgroundColor: colors.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
              opacity: pressed ? 0.95 : 1,
            },
          ]}
        >
          {/* Top row: type + status */}
          <View style={styles.loanCardHeader}>
            <View style={styles.loanCardTypeRow}>
              <View style={[styles.loanTypeCircle, { backgroundColor: loanMeta.color + '18' }]}>
                <MaterialCommunityIcons name={loanMeta.icon} size={18} color={loanMeta.color} />
              </View>
              <Text style={[styles.loanTypeLabel, { color: colors.text }]}>{item.typeLabel}</Text>
            </View>
            <AppBadge label={item.status.charAt(0).toUpperCase() + item.status.slice(1)} variant={badgeVariant} />
          </View>

          {/* Outstanding amount */}
          <View style={styles.loanAmountRow}>
            <AnimatedCounter
              value={item.outstandingAmount}
              prefix={'\u20B9'}
              style={{ fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 }}
            />
          </View>

          {/* EMI details */}
          <Text style={[styles.loanEmiText, { color: colors.textSecondary }]}>
            EMI: {formatCurrency(item.emiAmount)}
            {item.nextEmiDate ? `  \u2022  Due ${formatDate(item.nextEmiDate, 'DD MMM')}` : ''}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${repaidPercent}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
              {repaidPercent}% repaid
            </Text>
          </View>
        </Pressable>
      </MotiView>
    );
  };

  // --- Render Transaction Item ---
  const renderTransactionItem = (payment: Payment, index: number) => {
    const isIncoming = isIncomingTransaction(payment.type);
    const circleColor = isIncoming ? '#22C55E' : '#EF4444';
    const circleBg = isIncoming ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    const iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] = isIncoming ? 'arrow-down' : 'arrow-up';
    const amountPrefix = isIncoming ? '+' : '-';
    const amountColor = isIncoming ? '#22C55E' : '#EF4444';

    return (
      <MotiView
        key={payment.id}
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 60 + 800 }}
      >
        <View
          style={[
            styles.txRow,
            index < recentPayments.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={[styles.txCircle, { backgroundColor: circleBg }]}>
            <MaterialCommunityIcons name={iconName} size={18} color={circleColor} />
          </View>
          <View style={styles.txContent}>
            <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>
              {getTransactionLabel(payment.type)}
            </Text>
            <Text style={[styles.txDate, { color: colors.textMuted }]}>
              {payment.loanType}  \u2022  {formatDate(payment.date)}
            </Text>
          </View>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {amountPrefix}{formatCurrency(payment.amount)}
          </Text>
        </View>
      </MotiView>
    );
  };

  // --- Render Promo Card ---
  const renderPromoCard = ({ item }: { item: PromoItem }) => (
    <View style={{ width: PROMO_CARD_WIDTH, paddingHorizontal: 6 }}>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.promoCard}
        >
          {/* Decorative circles */}
          <View style={styles.promoDecor1} />
          <View style={styles.promoDecor2} />

          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>{item.title}</Text>
            <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
            <View style={styles.promoCta}>
              <Text style={styles.promoCtaText}>Learn More</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.promoIconWrap}>
            <View style={styles.promoIconCircle}>
              <MaterialCommunityIcons name={item.icon} size={32} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );

  // --- Loading Skeleton ---
  const renderSkeleton = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 70 }}>
      <Skeleton width="100%" height={160} borderRadius={20} style={{ marginBottom: 24 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 }}>
        <Skeleton width={56} height={56} borderRadius={28} />
        <Skeleton width={56} height={56} borderRadius={28} />
        <Skeleton width={56} height={56} borderRadius={28} />
        <Skeleton width={56} height={56} borderRadius={28} />
      </View>
      <Skeleton width="100%" height={140} borderRadius={16} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={60} borderRadius={12} style={{ marginTop: 12 }} />
      <Skeleton width="100%" height={60} borderRadius={12} style={{ marginTop: 8 }} />
      <Skeleton width="100%" height={60} borderRadius={12} style={{ marginTop: 8 }} />
    </View>
  );

  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const handleToggleTheme = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  }, [toggleTheme]);

  const HEADER_HEIGHT = insets.top + 64;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* ---- PREMIUM DARK HEADER ---- */}
      <View
        style={[
          styles.headerOuter,
          { paddingTop: insets.top, height: HEADER_HEIGHT },
        ]}
      >
        <LinearGradient
          colors={['#0B1426', '#162240']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.headerInner}>
          {/* Left: Greeting */}
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>
              {getGreeting()},{' '}
              <Text style={styles.headerName}>{firstName}</Text>
            </Text>
          </View>

          {/* Right: Actions */}
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleToggleTheme}
              hitSlop={8}
              style={styles.headerIconBtn}
            >
              <MaterialCommunityIcons
                name={mode === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
                size={20}
                color={mode === 'dark' ? '#F59E0B' : 'rgba(255,255,255,0.7)'}
              />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Notifications')}
              hitSlop={8}
              style={styles.headerIconBtn}
            >
              <MaterialCommunityIcons name="bell-outline" size={20} color="rgba(255,255,255,0.85)" />
              {unreadCount > 0 && <NotificationBadge />}
            </Pressable>
            <Pressable
              onPress={() => navigateToTab('ProfileTab')}
              hitSlop={4}
            >
              <LinearGradient
                colors={['#C8850A', '#E8A830']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerAvatar}
              >
                <Text style={styles.headerAvatarText}>{firstInitial}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ---- SCROLLABLE CONTENT ---- */}
      {loansLoading && loans.length === 0 ? (
        renderSkeleton()
      ) : (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: HEADER_HEIGHT + 8,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressViewOffset={HEADER_HEIGHT}
            />
          }
        >
          {/* ---- 1. CREDIT SCORE CARD ---- */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
            style={styles.creditCardOuter}
          >
            <LinearGradient
              colors={['#0B1426', '#162240']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.creditCard}
            >
              <View style={styles.creditRow}>
                <ProgressRing
                  size={100}
                  strokeWidth={8}
                  progress={creditProgress}
                  color={creditColor}
                  bgColor="rgba(255,255,255,0.08)"
                >
                  <AnimatedCounter
                    value={creditScore}
                    prefix=""
                    style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 }}
                  />
                </ProgressRing>

                <View style={styles.creditInfo}>
                  <Text style={styles.creditScoreLabel}>Credit Score</Text>
                  <Text style={[styles.creditStatus, { color: creditColor }]}>
                    {creditLabel}
                  </Text>
                  <View style={styles.creditScoreRange}>
                    <View style={styles.creditRangeBar}>
                      <View style={[styles.creditRangeIndicator, { left: `${creditProgress}%`, backgroundColor: creditColor }]} />
                    </View>
                    <View style={styles.creditRangeLabels}>
                      <Text style={styles.creditRangeText}>300</Text>
                      <Text style={styles.creditRangeText}>900</Text>
                    </View>
                  </View>
                  <Text style={styles.creditUpdated}>Updated 15 Mar 2026</Text>
                </View>
              </View>
            </LinearGradient>
          </MotiView>

          {/* ---- 2. QUICK ACTIONS ---- */}
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsRow}>
              {quickActions.map((action) => (
                <QuickActionItem
                  key={action.label}
                  icon={action.icon}
                  label={action.label}
                  color={action.color}
                  index={action.index}
                  onPress={action.onPress}
                  surfaceBg={colors.surface}
                  textMuted={colors.textSecondary}
                />
              ))}
            </View>
          </View>

          {/* ---- 3. ACTIVE LOANS ---- */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Loans</Text>
              <Pressable onPress={() => navigateToTab('LoansTab')} hitSlop={8}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </Pressable>
            </View>

            <FlatList<Loan>
              data={activeLoans}
              renderItem={renderLoanCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
              snapToInterval={LOAN_CARD_WIDTH + LOAN_CARD_GAP}
              decelerationRate="fast"
              ListEmptyComponent={
                <View style={{ width: SCREEN_WIDTH - 40 }}>
                  <EmptyState
                    icon="cash-remove"
                    title="No active loans"
                    description="Apply for your first loan to get started"
                    actionLabel="Apply Now"
                    onAction={() => navigateToTab('ApplyTab')}
                  />
                </View>
              }
              style={{ marginTop: 12 }}
            />
          </View>

          {/* ---- 4. RECENT TRANSACTIONS ---- */}
          <View style={[styles.sectionContainer, { marginTop: 28 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
              <Pressable onPress={() => navigateToTab('PaymentsTab')} hitSlop={8}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </Pressable>
            </View>

            {recentPayments.length > 0 ? (
              <View style={[styles.txContainer, { backgroundColor: colors.card }]}>
                {recentPayments.map((payment, index) => renderTransactionItem(payment, index))}
              </View>
            ) : (
              <Text style={[styles.emptyTxText, { color: colors.textMuted }]}>
                No recent transactions
              </Text>
            )}
          </View>

          {/* ---- 5. PROMO BANNER ---- */}
          <View style={styles.promoSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>For You</Text>
            </View>
            <FlatList<PromoItem>
              ref={promoListRef}
              data={PROMOS}
              renderItem={renderPromoCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / PROMO_CARD_WIDTH);
                setPromoIndex(idx);
              }}
              getItemLayout={(_, index) => ({
                length: PROMO_CARD_WIDTH,
                offset: PROMO_CARD_WIDTH * index,
                index,
              })}
              contentContainerStyle={{ paddingHorizontal: 14 }}
              snapToInterval={PROMO_CARD_WIDTH}
              decelerationRate="fast"
            />
            {/* Pagination dots */}
            <View style={styles.paginationRow}>
              {PROMOS.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: idx === promoIndex ? colors.primary : colors.border,
                      width: idx === promoIndex ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerGreeting: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.1,
  },
  headerName: {
    fontWeight: '700',
    color: '#E8A830',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0B1426',
  },

  // Credit Score Card
  creditCardOuter: {
    marginHorizontal: 20,
    marginTop: 8,
    shadowColor: '#C8850A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  creditCard: {
    borderRadius: 20,
    padding: 24,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditInfo: {
    flex: 1,
    marginLeft: 20,
  },
  creditScoreLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  creditStatus: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  creditScoreRange: {
    marginBottom: 8,
  },
  creditRangeBar: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  creditRangeIndicator: {
    position: 'absolute',
    top: -2.5,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  creditRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  creditRangeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  creditUpdated: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.1,
  },

  // Quick Actions
  quickActionsSection: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionPressable: {
    alignItems: 'center',
  },
  quickActionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // Sections
  sectionContainer: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Loan Card
  loanCard: {
    borderRadius: 16,
    padding: 18,
  },
  loanCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  loanCardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  loanTypeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
    letterSpacing: -0.1,
  },
  loanAmountRow: {
    marginBottom: 4,
  },
  loanEmiText: {
    fontSize: 12,
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  progressBarContainer: {
    marginTop: 0,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.1,
  },

  // Transactions
  txContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  txCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txContent: {
    flex: 1,
    marginLeft: 12,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  txDate: {
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  emptyTxText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Promos
  promoSection: {
    marginTop: 28,
    marginBottom: 16,
  },
  promoCard: {
    height: 140,
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  promoDecor1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  promoDecor2: {
    position: 'absolute',
    bottom: -40,
    right: 40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  promoContent: {
    flex: 1,
    zIndex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  promoSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.1,
    lineHeight: 17,
    marginBottom: 12,
  },
  promoCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  promoIconWrap: {
    marginLeft: 16,
    zIndex: 1,
  },
  promoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});

export default HomeScreen;
