import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useBankStore, type BankAccount } from '../../store/bankStore';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import AppButton from '../../components/ui/AppButton';
import { MotiView } from '../../utils/MotiCompat';
import { ProfileStackParamList } from '../../types/navigation';
import { BorderRadius } from '../../constants/spacing';

type Props = NativeStackScreenProps<ProfileStackParamList, 'BankAccounts'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/* ── Bank brand colors ── */
const BANK_COLORS: Record<string, { gradient: [string, string]; icon: string }> = {
  SBI: { gradient: ['#1A237E', '#283593'], icon: 'bank' },
  HDFC: { gradient: ['#004B87', '#0068B5'], icon: 'bank' },
  ICICI: { gradient: ['#F58220', '#FF9800'], icon: 'bank' },
  AXIS: { gradient: ['#800020', '#A52A2A'], icon: 'bank' },
  KOTAK: { gradient: ['#ED1C24', '#FF5252'], icon: 'bank' },
  DEFAULT: { gradient: ['#374151', '#4B5563'], icon: 'bank' },
};

const getBankStyle = (code: string) => BANK_COLORS[code] ?? BANK_COLORS.DEFAULT;

/* ------------------------------------------------------------------ */
/*  BankAccountCard                                                    */
/* ------------------------------------------------------------------ */

interface BankCardProps {
  account: BankAccount;
  index: number;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  colors: any;
}

const BankAccountCard = memo<BankCardProps>(({ account, index, onSetPrimary, onDelete, colors }) => {
  const bankStyle = getBankStyle(account.bankCode);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 100 }}
    >
      <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Bank Header */}
        <View style={styles.accountCardHeader}>
          <LinearGradient
            colors={bankStyle.gradient}
            style={styles.bankIconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="bank" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.bankHeaderInfo}>
            <Text style={[styles.bankName, { color: colors.text }]}>{account.bankName}</Text>
            <Text style={[styles.branchName, { color: colors.textMuted }]}>{account.branchName}</Text>
          </View>
          {account.isPrimary && (
            <View style={[styles.primaryBadge, { backgroundColor: colors.successMuted }]}>
              <MaterialCommunityIcons name="check-circle" size={12} color={colors.success} />
              <Text style={[styles.primaryBadgeText, { color: colors.success }]}>Primary</Text>
            </View>
          )}
        </View>

        {/* Account Details */}
        <View style={[styles.accountDetailsRow, { backgroundColor: colors.surface }]}>
          <View style={styles.accountDetailItem}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Account No.</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{account.accountNumber}</Text>
          </View>
          <View style={styles.accountDetailDivider} />
          <View style={styles.accountDetailItem}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>IFSC</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{account.ifscCode}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.accountCardFooter}>
          <View style={styles.accountTypeRow}>
            <MaterialCommunityIcons
              name={account.accountType === 'savings' ? 'piggy-bank' : 'briefcase'}
              size={14}
              color={colors.textMuted}
            />
            <Text style={[styles.accountTypeText, { color: colors.textMuted }]}>
              {account.accountType === 'savings' ? 'Savings' : 'Current'} Account
            </Text>
          </View>
          <View style={styles.accountActions}>
            {!account.isPrimary && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSetPrimary(account.id);
                }}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.primaryMuted },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Set Primary</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => onDelete(account.id)}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.errorMuted },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </View>
    </MotiView>
  );
});

/* ------------------------------------------------------------------ */
/*  AddBankSheet                                                       */
/* ------------------------------------------------------------------ */

interface AddBankSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    ifscCode: string;
    holderName: string;
    accountType: 'savings' | 'current';
    branchName: string;
  }) => void;
  colors: any;
}

const AddBankSheet: React.FC<AddBankSheetProps> = ({ visible, onClose, onAdd, colors }) => {
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<'savings' | 'current'>('savings');
  const [step, setStep] = useState<'form' | 'verifying' | 'success'>('form');

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('form');
      setHolderName('');
      setAccountNumber('');
      setConfirmAccount('');
      setIfsc('');
      setBankName('');
      setAccountType('savings');
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 140, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const detectBank = (code: string) => {
    const upper = code.toUpperCase();
    if (upper.startsWith('SBIN')) { setBankName('State Bank of India'); return 'SBI'; }
    if (upper.startsWith('HDFC')) { setBankName('HDFC Bank'); return 'HDFC'; }
    if (upper.startsWith('ICIC')) { setBankName('ICICI Bank'); return 'ICICI'; }
    if (upper.startsWith('UTIB')) { setBankName('Axis Bank'); return 'AXIS'; }
    if (upper.startsWith('KKBK')) { setBankName('Kotak Mahindra Bank'); return 'KOTAK'; }
    setBankName('');
    return 'DEFAULT';
  };

  const handleSubmit = async () => {
    if (!holderName.trim() || !accountNumber.trim() || !ifsc.trim()) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    }
    if (accountNumber !== confirmAccount) {
      Alert.alert('Mismatch', 'Account numbers do not match.');
      return;
    }
    if (ifsc.length < 11) {
      Alert.alert('Invalid IFSC', 'IFSC code must be 11 characters.');
      return;
    }

    setStep('verifying');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate verification
    await new Promise((r) => setTimeout(r, 2000));

    const bankCode = detectBank(ifsc);
    const masked = `XXXX XXXX ${accountNumber.slice(-4)}`;

    onAdd({
      bankName: bankName || 'Unknown Bank',
      bankCode,
      accountNumber: masked,
      ifscCode: ifsc.toUpperCase(),
      holderName: holderName.trim(),
      accountType,
      branchName: 'Auto-detected Branch',
    });

    setStep('success');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => handleClose(), 1500);
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheetOverlay}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]}>
            <Pressable style={{ flex: 1 }} onPress={handleClose} />
          </Animated.View>

          <Animated.View style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.handleBar}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>
            <Pressable style={styles.sheetClose} onPress={handleClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
            </Pressable>

            {step === 'form' && (
              <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Link Bank Account</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
                  Enter your bank account details for quick payments
                </Text>

                {/* Account Type Toggle */}
                <View style={styles.typeToggle}>
                  {(['savings', 'current'] as const).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setAccountType(type)}
                      style={[
                        styles.typeToggleBtn,
                        {
                          backgroundColor: accountType === type ? colors.primary : colors.surface,
                          borderColor: accountType === type ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={type === 'savings' ? 'piggy-bank' : 'briefcase'}
                        size={16}
                        color={accountType === type ? '#FFFFFF' : colors.textMuted}
                      />
                      <Text style={[
                        styles.typeToggleText,
                        { color: accountType === type ? '#FFFFFF' : colors.textSecondary },
                      ]}>
                        {type === 'savings' ? 'Savings' : 'Current'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Form Fields */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Account Holder Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="Full name as per bank records"
                    placeholderTextColor={colors.textMuted}
                    value={holderName}
                    onChangeText={setHolderName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Account Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter account number"
                    placeholderTextColor={colors.textMuted}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="number-pad"
                    secureTextEntry
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Confirm Account Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="Re-enter account number"
                    placeholderTextColor={colors.textMuted}
                    value={confirmAccount}
                    onChangeText={setConfirmAccount}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>IFSC Code</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="e.g. SBIN0001234"
                    placeholderTextColor={colors.textMuted}
                    value={ifsc}
                    onChangeText={(v) => {
                      setIfsc(v.toUpperCase());
                      if (v.length >= 4) detectBank(v);
                    }}
                    autoCapitalize="characters"
                    maxLength={11}
                  />
                  {bankName ? (
                    <View style={[styles.bankDetected, { backgroundColor: colors.successMuted }]}>
                      <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                      <Text style={[styles.bankDetectedText, { color: colors.success }]}>{bankName}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Security note */}
                <View style={[styles.securityNote, { backgroundColor: colors.surface }]}>
                  <MaterialCommunityIcons name="shield-lock" size={16} color={colors.primary} />
                  <Text style={[styles.securityNoteText, { color: colors.textMuted }]}>
                    Your bank details are encrypted with 256-bit SSL and never shared with third parties.
                  </Text>
                </View>

                <View style={styles.sheetActionRow}>
                  <AppButton title="Verify & Link Account" onPress={handleSubmit} fullWidth size="lg" />
                </View>
              </ScrollView>
            )}

            {step === 'verifying' && (
              <View style={styles.verifyingContainer}>
                <MotiView
                  from={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 120 }}
                >
                  <View style={[styles.verifyingCircle, { backgroundColor: colors.primaryMuted }]}>
                    <MaterialCommunityIcons name="bank-transfer" size={36} color={colors.primary} />
                  </View>
                </MotiView>
                <Text style={[styles.verifyingTitle, { color: colors.text }]}>Verifying Account</Text>
                <Text style={[styles.verifyingSubtext, { color: colors.textMuted }]}>
                  Please wait while we verify your bank details...
                </Text>
              </View>
            )}

            {step === 'success' && (
              <View style={styles.verifyingContainer}>
                <MotiView
                  from={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 120 }}
                >
                  <LinearGradient
                    colors={['#16A34A', '#22C55E']}
                    style={styles.successCircle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="check" size={36} color="#FFFFFF" />
                  </LinearGradient>
                </MotiView>
                <Text style={[styles.verifyingTitle, { color: colors.text }]}>Account Linked!</Text>
                <Text style={[styles.verifyingSubtext, { color: colors.textMuted }]}>
                  Your bank account has been successfully linked.
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/*  BankAccountsScreen                                                 */
/* ------------------------------------------------------------------ */

const BankAccountsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const store = useBankStore();
  const [showAddSheet, setShowAddSheet] = useState(false);

  useEffect(() => {
    if (store.bankAccounts.length === 0) store.loadBankData();
  }, []);

  const handleDelete = useCallback((id: string) => {
    const account = store.bankAccounts.find((a) => a.id === id);
    Alert.alert(
      'Remove Account',
      `Remove ${account?.bankName} (${account?.accountNumber})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            store.removeBankAccount(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }, [store.bankAccounts]);

  const handleSetPrimary = useCallback((id: string) => {
    store.setPrimaryAccount(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleAdd = useCallback((data: any) => {
    store.addBankAccount(data);
  }, []);

  return (
    <ScreenWrapper
      headerTitle="Bank Accounts"
      onBack={() => navigation.goBack()}
      scrollable
    >
      {/* Hero Summary */}
      <LinearGradient
        colors={['#0B1426', '#132042', '#1A2D5A']}
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative glow circle */}
        <View style={styles.heroGlow} />

        {/* Top Row — icon + title */}
        <View style={styles.heroTopRow}>
          <LinearGradient
            colors={['#C8850A', '#E8A830']}
            style={styles.heroBankIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="bank" size={22} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroTitle}>Your Bank Accounts</Text>
            <Text style={styles.heroSubtitle}>Manage linked accounts for payments & disbursals</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatPill}>
            <MaterialCommunityIcons name="link-variant" size={14} color="#C8850A" />
            <Text style={styles.heroStatNumber}>{store.bankAccounts.length}</Text>
            <Text style={styles.heroStatLabel}>Linked</Text>
          </View>

          <View style={styles.heroStatPill}>
            <MaterialCommunityIcons name="star" size={14} color="#22C55E" />
            <Text style={styles.heroStatNumber}>
              {store.bankAccounts.find((a) => a.isPrimary)?.bankCode ?? '—'}
            </Text>
            <Text style={styles.heroStatLabel}>Primary</Text>
          </View>

          <View style={styles.heroStatPill}>
            <MaterialCommunityIcons name="check-decagram" size={14} color="#60A5FA" />
            <Text style={styles.heroStatNumber}>{store.bankAccounts.length}</Text>
            <Text style={styles.heroStatLabel}>Verified</Text>
          </View>
        </View>

        {/* Secure footer */}
        <View style={styles.heroSecureBadge}>
          <View style={styles.heroSecureDot} />
          <MaterialCommunityIcons name="shield-check" size={13} color="rgba(255,255,255,0.5)" />
          <Text style={styles.heroSecureText}>RBI Compliant  •  256-bit Encrypted  •  NPCI Verified</Text>
        </View>
      </LinearGradient>

      {/* Account List */}
      {store.bankAccounts.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
            <MaterialCommunityIcons name="bank-off" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Bank Accounts</Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            Link your bank account for seamless EMI payments and quick disbursals.
          </Text>
        </View>
      ) : (
        store.bankAccounts.map((account, index) => (
          <BankAccountCard
            key={account.id}
            account={account}
            index={index}
            onSetPrimary={handleSetPrimary}
            onDelete={handleDelete}
            colors={colors}
          />
        ))
      )}

      {/* Add Button */}
      <View style={styles.addButtonRow}>
        <AppButton
          title="Link New Account"
          onPress={() => setShowAddSheet(true)}
          fullWidth
          leftIcon={<MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />}
        />
      </View>

      {/* Info Section */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>Why link a bank account?</Text>
        {[
          { icon: 'flash', text: 'Instant loan disbursals to your account' },
          { icon: 'repeat', text: 'Set up autopay for hassle-free EMIs' },
          { icon: 'shield-check', text: 'Verified accounts for faster processing' },
        ].map((item) => (
          <View key={item.text} style={styles.infoItem}>
            <MaterialCommunityIcons name={item.icon as any} size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{item.text}</Text>
          </View>
        ))}
      </View>

      <AddBankSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onAdd={handleAdd}
        colors={colors}
      />
    </ScreenWrapper>
  );
};

export default BankAccountsScreen;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* Hero */
  heroCard: { borderRadius: 20, padding: 20, paddingBottom: 16, marginBottom: 20, overflow: 'hidden', position: 'relative' as const },
  heroGlow: { position: 'absolute' as const, top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(200,133,10,0.12)' },
  heroTopRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 18 },
  heroBankIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center' as const, justifyContent: 'center' as const },
  heroTitleBlock: { flex: 1, marginLeft: 12 },
  heroTitle: { fontSize: 17, fontWeight: '700' as const, color: '#FFFFFF', letterSpacing: 0.2 },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 16 },
  heroStatsRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 16 },
  heroStatPill: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, backgroundColor: 'rgba(255,255,255,0.07)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  heroStatNumber: { fontSize: 15, fontWeight: '800' as const, color: '#FFFFFF' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500' as const },
  heroSecureBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  heroSecureDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#22C55E' },
  heroSecureText: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500' as const, letterSpacing: 0.3 },

  /* Account Card */
  accountCard: { borderRadius: 16, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  accountCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  bankIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bankHeaderInfo: { flex: 1, marginLeft: 12 },
  bankName: { fontSize: 15, fontWeight: '600' },
  branchName: { fontSize: 12, marginTop: 2 },
  primaryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  primaryBadgeText: { fontSize: 11, fontWeight: '700' },

  accountDetailsRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 10, padding: 12, gap: 12 },
  accountDetailItem: { flex: 1 },
  accountDetailDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  detailLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
  detailValue: { fontSize: 14, fontWeight: '600', marginTop: 4, letterSpacing: 0.5 },

  accountCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  accountTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  accountTypeText: { fontSize: 12, fontWeight: '500' },
  accountActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },

  /* Empty State */
  emptyState: { alignItems: 'center', padding: 32, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtext: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  /* Add Button */
  addButtonRow: { marginTop: 4, marginBottom: 20 },

  /* Info Card */
  infoCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 16 },
  infoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoText: { fontSize: 13, flex: 1 },

  /* Sheet */
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: SCREEN_HEIGHT * 0.9, paddingBottom: 34 },
  handleBar: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  sheetClose: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  sheetContent: { paddingHorizontal: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  sheetSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 20, lineHeight: 18 },

  /* Type Toggle */
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6, borderWidth: 1 },
  typeToggleText: { fontSize: 14, fontWeight: '600' },

  /* Form */
  formGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1 },
  bankDetected: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  bankDetectedText: { fontSize: 12, fontWeight: '600' },

  /* Security Note */
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 16 },
  securityNoteText: { fontSize: 12, flex: 1, lineHeight: 16 },

  sheetActionRow: { marginTop: 8, marginBottom: 16 },

  /* Verifying */
  verifyingContainer: { alignItems: 'center', paddingVertical: 40 },
  verifyingCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  successCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  verifyingTitle: { fontSize: 20, fontWeight: '700', marginTop: 20 },
  verifyingSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
