import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useLoanStore } from '../../store/loanStore';
import { maskPhone, maskEmail } from '../../utils/formatPhone';
import AppAvatar from '../../components/ui/AppAvatar';
import AppBadge from '../../components/ui/AppBadge';
import AppSwitch from '../../components/ui/AppSwitch';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import MadeByFooter from '../../components/shared/MadeByFooter';
import LanguageSheet, { type LanguageSheetRef } from '../../components/shared/LanguageSheet';
import { ProfileStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

/* ------------------------------------------------------------------ */
/*  MenuItem                                                          */
/* ------------------------------------------------------------------ */

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  isLast?: boolean;
  colors: any;
}

const MenuItem = memo<MenuItemProps>(
  ({ icon, label, subtitle, onPress, rightElement, danger, isLast, colors }) => {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress();
        }}
        style={({ pressed }) => [
          styles.menuItem,
          pressed && { backgroundColor: colors.surfaceHover },
        ]}
      >
        <View
          style={[
            styles.menuIconCircle,
            {
              backgroundColor: danger
                ? colors.errorMuted
                : colors.primaryMuted,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={danger ? colors.error : colors.primary}
          />
        </View>
        <View style={styles.menuTextBlock}>
          <Text
            style={[
              styles.menuLabel,
              { color: danger ? colors.error : colors.text },
            ]}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightElement ?? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textMuted}
          />
        )}
        {!isLast && (
          <View
            style={[
              styles.menuSeparator,
              { backgroundColor: colors.border },
            ]}
          />
        )}
      </Pressable>
    );
  },
);

/* ------------------------------------------------------------------ */
/*  Section Header                                                    */
/* ------------------------------------------------------------------ */

const SectionHeader = memo<{ title: string; colors: any }>(({ title, colors }) => {
  return (
    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
      {title}
    </Text>
  );
});

/* ------------------------------------------------------------------ */
/*  Stat Card                                                         */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  colors: any;
  delay: number;
}

const StatCard = memo<StatCardProps>(({ icon, label, value, valueColor, colors, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.statCardIcon,
          { backgroundColor: colors.primaryMuted },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={colors.primary}
        />
      </View>
      <Text
        style={[
          styles.statCardValue,
          { color: valueColor ?? colors.text },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.statCardLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </Animated.View>
  );
});

/* ------------------------------------------------------------------ */
/*  ProfileScreen                                                     */
/* ------------------------------------------------------------------ */

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, mode } = useTheme();
  const authStore = useAuthStore();
  const themeStore = useThemeStore();
  const loanStore = useLoanStore();

  const user = authStore.user;

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const languageRef = useRef<LanguageSheetRef>(null);

  // Header entry animation
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  /* ---------- KYC badge variant ---------- */
  const kycBadgeVariant = useCallback(() => {
    switch (user?.kycStatus) {
      case 'verified':
        return 'success';
      case 'under_review':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'neutral';
    }
  }, [user?.kycStatus]);

  const kycBadgeLabel = useCallback(() => {
    switch (user?.kycStatus) {
      case 'verified':
        return 'Verified';
      case 'under_review':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  }, [user?.kycStatus]);

  /* ---------- Credit score color ---------- */
  const creditScoreColor = useCallback(() => {
    const score = user?.creditScore ?? 0;
    if (score >= 750) return colors.success;
    if (score >= 650) return colors.warning;
    return colors.error;
  }, [user?.creditScore, colors]);

  /* ---------- Handlers ---------- */
  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          authStore.logout();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        },
      },
    ]);
  }, [authStore]);

  const isDark = mode === 'dark';

  return (
    <ScreenWrapper headerTitle="Profile" scrollable>
      {/* ======== HERO HEADER ======== */}
      <Animated.View
        style={[
          styles.heroHeader,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['#1A1408', '#0D0A04', 'transparent']
              : ['#FEF3E0', '#FFF8ED', 'transparent']
          }
          style={styles.heroGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Avatar with gradient ring */}
        <View style={styles.avatarArea}>
          <LinearGradient
            colors={['#C8850A', '#E8A830', '#C8850A']}
            style={styles.avatarGradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.avatarInnerRing, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              ) : (
                <AppAvatar size={96} name={user?.name ?? 'U'} />
              )}
            </View>
          </LinearGradient>
          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            style={[
              styles.cameraBadge,
              {
                backgroundColor: colors.primary,
                borderColor: isDark ? '#111827' : '#FFFFFF',
              },
            ]}
          >
            <MaterialCommunityIcons name="camera" size={15} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Name & details */}
        <Text style={[styles.heroName, { color: colors.text }]}>
          {user?.name ?? 'User'}
        </Text>
        <Text style={[styles.heroPhone, { color: colors.textSecondary }]}>
          {maskPhone(user?.phone ?? '')}
        </Text>

        {/* KYC Badge */}
        <View style={styles.kycRow}>
          <AppBadge
            variant={kycBadgeVariant()}
            label={kycBadgeLabel()}
          />
        </View>

        {/* Edit Profile */}
        <Pressable
          onPress={() => navigation.navigate('EditProfile')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.editBtn,
            {
              backgroundColor: colors.primaryMuted,
              borderColor: colors.primary + '30',
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={14}
            color={colors.primary}
          />
          <Text style={[styles.editBtnText, { color: colors.primary }]}>
            Edit Profile
          </Text>
        </Pressable>
      </Animated.View>

      {/* ======== STATS CARDS ======== */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="wallet-outline"
          label="Total Loans"
          value={String(loanStore.loans?.length ?? 0)}
          colors={colors}
          delay={100}
        />
        <StatCard
          icon="chart-line"
          label="Credit Score"
          value={String(user?.creditScore ?? '—')}
          valueColor={creditScoreColor()}
          colors={colors}
          delay={200}
        />
        <StatCard
          icon="calendar-check-outline"
          label="Member Since"
          value="Mar 2026"
          colors={colors}
          delay={300}
        />
      </View>

      {/* ======== ACCOUNT SECTION ======== */}
      <SectionHeader title="ACCOUNT" colors={colors} />
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem
          icon="account-outline"
          label="Personal Info"
          subtitle="Name, email, date of birth"
          onPress={() => navigation.navigate('EditProfile')}
          colors={colors}
        />
        <MenuItem
          icon="shield-check-outline"
          label="KYC Documents"
          subtitle="Identity verification"
          onPress={() => navigation.navigate('KYC')}
          rightElement={
            user?.kycStatus === 'verified' ? (
              <View style={styles.verifiedRow}>
                <View style={[styles.verifiedPill, { backgroundColor: colors.successMuted }]}>
                  <MaterialCommunityIcons name="check-circle" size={12} color={colors.success} />
                  <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
                </View>
              </View>
            ) : undefined
          }
          colors={colors}
        />
        <MenuItem
          icon="bank-outline"
          label="Bank Accounts"
          subtitle="Linked accounts"
          onPress={() => navigation.navigate('BankAccounts')}
          colors={colors}
        />
        <MenuItem
          icon="credit-card-outline"
          label="Payment Methods"
          subtitle="Cards & UPI"
          onPress={() => navigation.navigate('PaymentMethods')}
          isLast
          colors={colors}
        />
      </View>

      {/* ======== LOANS SECTION ======== */}
      <SectionHeader title="LOANS" colors={colors} />
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem
          icon="file-document-outline"
          label="My Applications"
          onPress={() => navigation.getParent()?.navigate('LoansTab')}
          colors={colors}
        />
        <MenuItem
          icon="radar"
          label="Track Application"
          subtitle="Check your loan progress"
          onPress={() => navigation.getParent()?.navigate('ApplyTab', { screen: 'TrackApplication', params: { fromTab: 'ProfileTab' } })}
          colors={colors}
        />
        <MenuItem
          icon="file-download-outline"
          label="Loan Statements"
          onPress={() =>
            navigation.getParent()?.navigate('LoansTab', { screen: 'LoanStatement' })
          }
          colors={colors}
        />
        <MenuItem
          icon="calendar-month-outline"
          label="EMI Calendar"
          onPress={() => navigation.navigate('EMICalendar')}
          isLast
          colors={colors}
        />
      </View>

      {/* ======== SETTINGS SECTION ======== */}
      <SectionHeader title="PREFERENCES" colors={colors} />
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem
          icon="bell-outline"
          label="Notifications"
          onPress={() => setNotificationsEnabled((prev) => !prev)}
          rightElement={
            <AppSwitch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          }
          colors={colors}
        />
        <MenuItem
          icon="weather-night"
          label="Dark Mode"
          onPress={() => themeStore.toggleTheme()}
          rightElement={
            <AppSwitch
              value={themeStore.isDark}
              onValueChange={() => themeStore.toggleTheme()}
            />
          }
          colors={colors}
        />
        <MenuItem
          icon="translate"
          label="Language"
          subtitle="English"
          onPress={() => languageRef.current?.open()}
          colors={colors}
        />
        <MenuItem
          icon="fingerprint"
          label="Biometric Lock"
          onPress={() => setBiometricEnabled((prev) => !prev)}
          rightElement={
            <AppSwitch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
            />
          }
          isLast
          colors={colors}
        />
      </View>

      {/* ======== SUPPORT SECTION ======== */}
      <SectionHeader title="SUPPORT" colors={colors} />
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem
          icon="help-circle-outline"
          label="Help & FAQ"
          onPress={() => navigation.navigate('Help')}
          colors={colors}
        />
        <MenuItem
          icon="headphones"
          label="Contact Us"
          subtitle="1800-123-4567 (Toll Free)"
          onPress={() =>
            Toast.show({
              type: 'info',
              text1: 'Contact Support',
              text2: '1800-123-4567 (Toll Free)',
            })
          }
          colors={colors}
        />
        <MenuItem
          icon="star-outline"
          label="Rate App"
          onPress={() =>
            Toast.show({ type: 'success', text1: 'Thanks for rating!' })
          }
          colors={colors}
        />
        <MenuItem
          icon="information-outline"
          label="About LendEase"
          onPress={() =>
            Alert.alert(
              'About LendEase',
              'LendEase v1.0.0\nBuild 1\n\nA modern lending platform that makes borrowing simple, transparent, and fast.',
            )
          }
          isLast
          colors={colors}
        />
      </View>

      {/* ======== LOG OUT ======== */}
      <View style={[styles.menuCard, styles.logoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem
          icon="logout"
          label="Log Out"
          onPress={handleLogout}
          danger
          isLast
          colors={colors}
        />
      </View>

      {/* ---- Version ---- */}
      <Text style={[styles.versionText, { color: colors.textMuted }]}>
        LendEase v1.0.0 (Build 1)
      </Text>

      <MadeByFooter />

      <LanguageSheet ref={languageRef} />
    </ScreenWrapper>
  );
};

export default ProfileScreen;

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* ===== Hero Header ===== */
  heroHeader: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 18,
    marginHorizontal: -20,
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  /* Avatar */
  avatarArea: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarGradientRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },

  /* Name area */
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroPhone: {
    fontSize: 14,
    marginTop: 2,
    letterSpacing: 0.3,
  },

  /* KYC Badge */
  kycRow: {
    marginTop: 8,
  },
  editBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* ===== Stats Grid ===== */
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
    letterSpacing: 0.2,
  },

  /* ===== Section Headers ===== */
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 28,
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  /* ===== Menu Card (grouped) ===== */
  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  logoutCard: {
    marginTop: 28,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextBlock: {
    flex: 1,
    marginLeft: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  menuSeparator: {
    position: 'absolute',
    bottom: 0,
    left: 70,
    right: 16,
    height: StyleSheet.hairlineWidth,
  },

  /* Verified pill */
  verifiedRow: {
    flexDirection: 'row',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Misc */
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
});
