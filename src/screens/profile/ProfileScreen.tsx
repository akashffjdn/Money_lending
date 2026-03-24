import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from '../../utils/MotiCompat';
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
import { ProfileStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

/* ------------------------------------------------------------------ */
/*  MenuItem                                                          */
/* ------------------------------------------------------------------ */

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

const MenuItem = memo<MenuItemProps>(
  ({ icon, label, onPress, rightElement, danger }) => {
    const { colors } = useTheme();

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.menuItem,
          pressed && { backgroundColor: colors.surfaceHover },
        ]}
      >
        <View
          style={[
            styles.menuIconContainer,
            {
              backgroundColor: danger
                ? colors.errorMuted
                : colors.primaryMuted,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color={danger ? colors.error : colors.primary}
          />
        </View>
        <Text
          style={[
            styles.menuLabel,
            { color: danger ? colors.error : colors.text },
          ]}
        >
          {label}
        </Text>
        {rightElement ?? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textMuted}
          />
        )}
      </Pressable>
    );
  },
);

/* ------------------------------------------------------------------ */
/*  Section Header                                                    */
/* ------------------------------------------------------------------ */

const SectionHeader = memo<{ title: string }>(({ title }) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
      {title}
    </Text>
  );
});

/* ------------------------------------------------------------------ */
/*  Stat Column                                                       */
/* ------------------------------------------------------------------ */

interface StatColumnProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}

const StatColumn = memo<StatColumnProps>(({ icon, label, value, valueColor }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.statColumn}>
      <View style={[styles.statIconCircle, { backgroundColor: colors.primaryMuted }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={colors.primary}
        />
      </View>
      <Text
        style={[
          styles.statValue,
          { color: valueColor ?? colors.text },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
});

/* ------------------------------------------------------------------ */
/*  ProfileScreen                                                     */
/* ------------------------------------------------------------------ */

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const authStore = useAuthStore();
  const themeStore = useThemeStore();
  const loanStore = useLoanStore();

  const user = authStore.user;

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

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
    Alert.alert('Log Out', 'Are you sure?', [
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

  const showComingSoon = useCallback(() => {
    Toast.show({ type: 'info', text1: 'Coming soon' });
  }, []);

  return (
    <ScreenWrapper headerTitle="Profile" scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ---- Hero Card ---- */}
        <MotiView
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.heroWrapper}
        >
          <View
            style={[
              styles.heroCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.avatarContainer}>
              <AppAvatar
                size={80}
                name={user?.name ?? 'U'}
              />
              <Pressable
                onPress={() =>
                  Toast.show({ type: 'info', text1: 'Change Photo' })
                }
                style={[
                  styles.cameraOverlay,
                  { backgroundColor: colors.primary },
                ]}
              >
                <MaterialCommunityIcons
                  name="camera"
                  size={14}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>

            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name ?? 'User'}
            </Text>
            <Text style={[styles.userDetail, { color: colors.textSecondary }]}>
              {maskPhone(user?.phone ?? '')}
            </Text>
            <Text style={[styles.userDetail, { color: colors.textSecondary }]}>
              {maskEmail(user?.email ?? '')}
            </Text>

            <View style={styles.kycBadgeRow}>
              <AppBadge
                variant={kycBadgeVariant()}
                label={kycBadgeLabel()}
              />
            </View>

            <Pressable
              onPress={() => navigation.navigate('EditProfile')}
              hitSlop={8}
              style={({ pressed }) => [
                styles.editProfileBtn,
                { backgroundColor: colors.primaryMuted },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.editProfileText, { color: colors.primary }]}>
                Edit Profile
              </Text>
            </Pressable>
          </View>
        </MotiView>

        {/* ---- Stats Row ---- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 100 }}
          style={[
            styles.statsRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <StatColumn
            icon="wallet-outline"
            label="Total Loans"
            value={String(loanStore.loans?.length ?? 0)}
          />
          <View
            style={[styles.statSeparator, { backgroundColor: colors.border }]}
          />
          <StatColumn
            icon="chart-line"
            label="Credit Score"
            value={String(user?.creditScore ?? '—')}
            valueColor={creditScoreColor()}
          />
          <View
            style={[styles.statSeparator, { backgroundColor: colors.border }]}
          />
          <StatColumn
            icon="calendar-outline"
            label="Member Since"
            value="Mar 2026"
          />
        </MotiView>

        {/* ---- Account ---- */}
        <SectionHeader title="ACCOUNT" />
        <MenuItem
          icon="account-outline"
          label="Personal Info"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuItem
          icon="shield-check-outline"
          label="KYC Documents"
          onPress={() => navigation.navigate('KYC')}
          rightElement={
            user?.kycStatus === 'verified' ? (
              <View style={[styles.greenDot, { backgroundColor: colors.success }]} />
            ) : undefined
          }
        />
        <MenuItem
          icon="bank-outline"
          label="Bank Accounts"
          onPress={showComingSoon}
        />
        <MenuItem
          icon="credit-card-outline"
          label="Payment Methods"
          onPress={showComingSoon}
        />

        {/* ---- Loans ---- */}
        <SectionHeader title="LOANS" />
        <MenuItem
          icon="file-document-outline"
          label="My Applications"
          onPress={() =>
            navigation.getParent()?.navigate('LoansTab')
          }
        />
        <MenuItem
          icon="file-download-outline"
          label="Loan Statements"
          onPress={() =>
            Toast.show({ type: 'info', text1: 'Loan statements', text2: 'Coming soon' })
          }
        />
        <MenuItem
          icon="calendar-month-outline"
          label="EMI Calendar"
          onPress={() =>
            Toast.show({ type: 'info', text1: 'EMI Calendar', text2: 'Coming soon' })
          }
        />

        {/* ---- Settings ---- */}
        <SectionHeader title="SETTINGS" />
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
        />
        <MenuItem
          icon="translate"
          label="Language"
          onPress={showComingSoon}
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
        />

        {/* ---- Support ---- */}
        <SectionHeader title="SUPPORT" />
        <MenuItem
          icon="help-circle-outline"
          label="Help & FAQ"
          onPress={() => navigation.navigate('Help')}
        />
        <MenuItem
          icon="phone-outline"
          label="Contact Us"
          onPress={() =>
            Toast.show({
              type: 'info',
              text1: 'Contact Support',
              text2: '1800-123-4567 (Toll Free)',
            })
          }
        />
        <MenuItem
          icon="star-outline"
          label="Rate App"
          onPress={() =>
            Toast.show({ type: 'success', text1: 'Thanks for rating!' })
          }
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
        />

        {/* ---- Log Out ---- */}
        <View style={styles.logoutWrapper}>
          <MenuItem
            icon="logout"
            label="Log Out"
            onPress={handleLogout}
            danger
          />
        </View>

        {/* ---- Version ---- */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          v1.0.0 (Build 1)
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default ProfileScreen;

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },

  /* Hero */
  heroWrapper: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 14,
    letterSpacing: 0.2,
  },
  userDetail: {
    fontSize: 14,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  kycBadgeRow: {
    marginTop: 10,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 20,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    height: 40,
  },

  /* Section */
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  /* Menu Item */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 14,
  },

  /* Misc */
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logoutWrapper: {
    marginTop: 20,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 16,
    letterSpacing: 0.3,
  },
});
