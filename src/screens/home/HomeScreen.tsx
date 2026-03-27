import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MotiView } from '../../utils/MotiCompat';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../hooks/useTheme';
import { HomeStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { useLoanStore } from '../../store/loanStore';
import { usePaymentStore } from '../../store/paymentStore';
import { useNotificationStore, useUnreadCount } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';
import { getGreeting, formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

import MadeByFooter from '../../components/shared/MadeByFooter';
import AppCard from '../../components/ui/AppCard';
import AppBadge from '../../components/ui/AppBadge';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import ProgressRing from '../../components/shared/ProgressRing';
import CreditScoreGauge from '../../components/shared/CreditScoreGauge';
import EmptyState from '../../components/feedback/EmptyState';
import { Skeleton } from '../../components/feedback/Skeleton';

import type { Loan } from '../../types/loan';
import type { Payment, TransactionType } from '../../types/payment';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;


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
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseScale]);

  const pulseStyle = {
    transform: [{ scale: pulseScale }],
  };

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
  const scale = useRef(new Animated.Value(1)).current;

  const animatedStyle = {
    transform: [{ scale }],
  };

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.9, damping: 15, stiffness: 200, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }).start();
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
  const { s, rv, width, isTablet, deviceType } = useResponsive();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  const LOAN_CARD_WIDTH = rv({ compact: 240, phone: 280, tablet: 340, desktop: 380 });
  const LOAN_CARD_GAP = s(12);
  const PROMO_CARD_WIDTH = width - s(40);
  const QUICK_ACTION_SIZE = s(56);

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

  // Scroll animation (scrollY tracked but not used for animated styles)
  const scrollY = useRef(new Animated.Value(0)).current;

  // Data
  const creditScore = user?.creditScore;
  const hasCreditScore = creditScore !== null && creditScore !== undefined;
  const creditLabel = hasCreditScore ? getCreditLabel(creditScore) : '';
  const creditColor = hasCreditScore ? getCreditColor(creditScore) : '#E8A830';
  const creditProgress = hasCreditScore ? (creditScore / 900) * 100 : 0;
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
  const navigateToTab = (tab: string, params?: object) => {
    if (params) {
      (navigation.getParent()?.navigate as any)(tab, params);
    } else {
      navigation.getParent()?.navigate(tab as never);
    }
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
      onPress: () => navigateToTab('ProfileTab', { screen: 'KYC' }),
    },
    {
      icon: 'calculator' as const,
      label: 'Calculator',
      color: '#8B5CF6',
      index: 3,
      onPress: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate('EMICalculator');
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
            navigateToTab('LoansTab', { screen: 'LoanDetail', params: { loanId: item.id } });
          }}
          style={({ pressed }) => [
            styles.loanCard,
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
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

  const HEADER_HEIGHT = insets.top + 72;

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
          colors={['#0A1220', '#0F1D35', '#132544']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.headerInner}>
          {/* Left: Avatar + Greeting */}
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => navigateToTab('ProfileTab')}
              hitSlop={4}
            >
              <View style={styles.headerAvatarRing}>
                <LinearGradient
                  colors={['#C8850A', '#E8A830']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.headerAvatar}
                >
                  <Text style={styles.headerAvatarText}>{firstInitial}</Text>
                </LinearGradient>
              </View>
            </Pressable>
            <View style={styles.headerGreetingBlock}>
              <Text style={styles.headerGreetingLabel}>{getGreeting()}</Text>
              <Text style={styles.headerName}>{firstName}</Text>
            </View>
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
          </View>
        </View>
      </View>

      {/* ---- SCROLLABLE CONTENT ---- */}
      {loansLoading && loans.length === 0 ? (
        renderSkeleton()
      ) : (
        <ScrollView
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
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
            style={styles.creditCardOuter}
          >
            <LinearGradient
              colors={['#0C1528', '#101E38', '#0A1424']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.creditCard}
            >
              {hasCreditScore ? (
                <>
                  {/* Top row: label + updated */}
                  <View style={styles.creditTopRow}>
                    <View style={styles.creditLabelRow}>
                      <MaterialCommunityIcons name="shield-check-outline" size={14} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.creditScoreLabel}>CREDIT SCORE</Text>
                    </View>
                    <Text style={styles.creditUpdated}>Updated 15 Mar 2026</Text>
                  </View>

                  {/* Center: gauge */}
                  <View style={styles.creditGaugeWrap}>
                    <CreditScoreGauge
                      score={creditScore}
                      size={125}
                      strokeWidth={8}
                      label={creditLabel}
                      color={creditColor}
                    />
                  </View>

                  {/* Bottom: score breakdown hints */}
                  <View style={styles.creditBottomRow}>
                    <View style={styles.creditStat}>
                      <Text style={styles.creditStatValue}>98%</Text>
                      <Text style={styles.creditStatLabel}>On-time</Text>
                    </View>
                    <View style={styles.creditStatDivider} />
                    <View style={styles.creditStat}>
                      <Text style={styles.creditStatValue}>3</Text>
                      <Text style={styles.creditStatLabel}>Active Loans</Text>
                    </View>
                    <View style={styles.creditStatDivider} />
                    <View style={styles.creditStat}>
                      <Text style={styles.creditStatValue}>Low</Text>
                      <Text style={styles.creditStatLabel}>Utilization</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Fresh user — teaser CTA */}
                  <View style={styles.creditTeaserRow}>
                    {/* Simple locked ring placeholder */}
                    <View style={styles.creditTeaserGauge}>
                      <View style={styles.creditTeaserRing}>
                        <MaterialCommunityIcons name="lock-outline" size={20} color="rgba(255,255,255,0.35)" />
                      </View>
                      <Text style={styles.creditTeaserQuestion}>???</Text>
                    </View>

                    {/* Info + CTA */}
                    <View style={styles.creditTeaserInfo}>
                      <Text style={styles.creditTeaserTitle}>Know Your Credit Score</Text>
                      <Text style={styles.creditTeaserDesc}>
                        Free CIBIL score instantly. No impact on your score.
                      </Text>
                      <Pressable
                        onPress={() => navigateToTab('ProfileTab', { screen: 'KYC' })}
                        style={({ pressed }) => [
                          styles.creditTeaserBtn,
                          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                        ]}
                      >
                        <Text style={styles.creditTeaserBtnText}>Check Free Score</Text>
                        <MaterialCommunityIcons name="arrow-right" size={14} color="#0A1220" />
                      </Pressable>
                    </View>
                  </View>

                  {/* Trust badges */}
                  <View style={styles.creditTeaserTrust}>
                    <MaterialCommunityIcons name="shield-check" size={10} color="rgba(255,255,255,0.25)" />
                    <Text style={styles.creditTeaserTrustText}>Soft inquiry only</Text>
                    <View style={styles.creditTeaserTrustDot} />
                    <MaterialCommunityIcons name="lock" size={10} color="rgba(255,255,255,0.25)" />
                    <Text style={styles.creditTeaserTrustText}>256-bit encrypted</Text>
                  </View>
                </>
              )}
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
                <View style={{ width: width - s(40) }}>
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

          <MadeByFooter />
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 16,
  },
  headerAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(232,168,48,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  headerGreetingBlock: {
    flexShrink: 1,
  },
  headerGreetingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 12,
  },
  creditCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  creditTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  creditLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditScoreLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  creditUpdated: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.2,
  },
  creditGaugeWrap: {
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 4,
  },
  creditBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  creditStat: {
    alignItems: 'center',
    flex: 1,
  },
  creditStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  creditStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  creditStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Credit Teaser (fresh user)
  creditTeaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 6,
  },
  creditTeaserGauge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditTeaserRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  creditTeaserQuestion: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.2)',
    marginTop: 4,
    letterSpacing: 1,
  },
  creditTeaserInfo: {
    flex: 1,
  },
  creditTeaserTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  creditTeaserDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 17,
    marginBottom: 12,
  },
  creditTeaserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8A830',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  creditTeaserBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A1220',
  },
  creditTeaserTrust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 5,
  },
  creditTeaserTrustText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  creditTeaserTrustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 3,
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
