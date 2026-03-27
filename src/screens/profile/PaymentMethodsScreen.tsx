import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
  Modal,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../utils/responsive';
import {
  useBankStore,
  type SavedCard,
  type SavedUPI,
  type AutopayMandate,
} from '../../store/bankStore';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import { MotiView } from '../../utils/MotiCompat';
import { ProfileStackParamList } from '../../types/navigation';
import { BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/formatCurrency';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PaymentMethods'>;

type TabKey = 'cards' | 'upi' | 'autopay';

/* ── Card brand styles ── */
const CARD_GRADIENTS: Record<string, [string, string]> = {
  visa: ['#1A1F71', '#2D3494'],
  mastercard: ['#1A1A2E', '#16213E'],
  rupay: ['#005B99', '#0082CC'],
};

const CARD_LOGOS: Record<string, string> = {
  visa: 'credit-card',
  mastercard: 'credit-card-multiple',
  rupay: 'credit-card-chip',
};

/* ── UPI App Colors ── */
const UPI_COLORS: Record<string, string> = {
  PhonePe: '#5F259F',
  'Google Pay': '#4285F4',
  Paytm: '#00BAF2',
  BHIM: '#00897B',
  DEFAULT: '#6B7280',
};

/* ------------------------------------------------------------------ */
/*  Card Visual                                                        */
/* ------------------------------------------------------------------ */

interface CardVisualProps {
  card: SavedCard;
  index: number;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  colors: any;
}

const CardVisual = memo<CardVisualProps>(({ card, index, onSetDefault, onDelete, colors }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 100 }}
    >
      <LinearGradient
        colors={CARD_GRADIENTS[card.cardType] ?? CARD_GRADIENTS.visa}
        style={styles.creditCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Card header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardBankName}>{card.bankName}</Text>
          {card.isDefault && (
            <View style={styles.defaultChip}>
              <Text style={styles.defaultChipText}>Default</Text>
            </View>
          )}
        </View>

        {/* Card chip */}
        <View style={styles.cardChip}>
          <MaterialCommunityIcons name="integrated-circuit-chip" size={28} color="rgba(255,255,255,0.7)" />
          <MaterialCommunityIcons name="contactless-payment" size={20} color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />
        </View>

        {/* Card number */}
        <Text style={styles.cardNumberDisplay}>
          {'****    ****    ****    '}{card.cardNumber}
        </Text>

        {/* Card footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardFooterLabel}>CARD HOLDER</Text>
            <Text style={styles.cardFooterValue}>{card.cardHolder}</Text>
          </View>
          <View>
            <Text style={styles.cardFooterLabel}>EXPIRES</Text>
            <Text style={styles.cardFooterValue}>{card.expiryDate}</Text>
          </View>
          <View style={styles.cardBrandIcon}>
            <MaterialCommunityIcons
              name={CARD_LOGOS[card.cardType] as any ?? 'credit-card'}
              size={28}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.cardBrandText}>{card.cardType.toUpperCase()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Actions */}
      <View style={[styles.cardActions, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {!card.isDefault && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSetDefault(card.id);
            }}
            style={({ pressed }) => [styles.cardActionBtn, { backgroundColor: colors.primaryMuted }, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="star-outline" size={14} color={colors.primary} />
            <Text style={[styles.cardActionText, { color: colors.primary }]}>Set Default</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => onDelete(card.id)}
          style={({ pressed }) => [styles.cardActionBtn, { backgroundColor: colors.errorMuted }, pressed && { opacity: 0.7 }]}
        >
          <MaterialCommunityIcons name="delete-outline" size={14} color={colors.error} />
          <Text style={[styles.cardActionText, { color: colors.error }]}>Remove</Text>
        </Pressable>
      </View>
    </MotiView>
  );
});

/* ------------------------------------------------------------------ */
/*  UPI Item                                                           */
/* ------------------------------------------------------------------ */

interface UPIItemProps {
  upi: SavedUPI;
  index: number;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  colors: any;
}

const UPIItem = memo<UPIItemProps>(({ upi, index, onSetDefault, onDelete, colors }) => {
  const appColor = UPI_COLORS[upi.appName] ?? UPI_COLORS.DEFAULT;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 80 }}
    >
      <View style={[styles.upiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.upiIconCircle, { backgroundColor: appColor + '20' }]}>
          <MaterialCommunityIcons name="cellphone" size={20} color={appColor} />
        </View>
        <View style={styles.upiInfo}>
          <View style={styles.upiNameRow}>
            <Text style={[styles.upiId, { color: colors.text }]}>{upi.upiId}</Text>
            {upi.isDefault && (
              <View style={[styles.upiDefaultBadge, { backgroundColor: colors.successMuted }]}>
                <Text style={[styles.upiDefaultText, { color: colors.success }]}>Default</Text>
              </View>
            )}
          </View>
          <View style={styles.upiSubRow}>
            <Text style={[styles.upiApp, { color: colors.textMuted }]}>{upi.appName}</Text>
            {upi.isVerified && (
              <View style={styles.verifiedBadgeSmall}>
                <MaterialCommunityIcons name="check-decagram" size={12} color={colors.success} />
                <Text style={[styles.verifiedSmallText, { color: colors.success }]}>Verified</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.upiActions}>
          {!upi.isDefault && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSetDefault(upi.id);
              }}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="star-outline" size={20} color={colors.textMuted} />
            </Pressable>
          )}
          <Pressable onPress={() => onDelete(upi.id)} hitSlop={8}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>
    </MotiView>
  );
});

/* ------------------------------------------------------------------ */
/*  Autopay Item                                                       */
/* ------------------------------------------------------------------ */

interface AutopayItemProps {
  mandate: AutopayMandate;
  index: number;
  onToggle: (id: string) => void;
  colors: any;
}

const AutopayItem = memo<AutopayItemProps>(({ mandate, index, onToggle, colors }) => {
  const isActive = mandate.status === 'active';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 80 }}
    >
      <View style={[styles.autopayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.autopayHeader}>
          <View style={[styles.autopayIcon, { backgroundColor: isActive ? colors.successMuted : colors.surface }]}>
            <MaterialCommunityIcons
              name="repeat"
              size={18}
              color={isActive ? colors.success : colors.textMuted}
            />
          </View>
          <View style={styles.autopayInfo}>
            <Text style={[styles.autopayLoanType, { color: colors.text }]}>{mandate.loanType}</Text>
            <Text style={[styles.autopayLoanId, { color: colors.textMuted }]}>{mandate.loanId}</Text>
          </View>
          <View style={[
            styles.autopayStatusBadge,
            { backgroundColor: isActive ? colors.successMuted : colors.surface },
          ]}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? colors.success : colors.textMuted }]} />
            <Text style={[styles.autopayStatusText, { color: isActive ? colors.success : colors.textMuted }]}>
              {isActive ? 'Active' : 'Paused'}
            </Text>
          </View>
        </View>

        <View style={[styles.autopayDetails, { backgroundColor: colors.surface }]}>
          <View style={styles.autopayDetailCol}>
            <Text style={[styles.autopayDetailLabel, { color: colors.textMuted }]}>Max Amount</Text>
            <Text style={[styles.autopayDetailValue, { color: colors.text }]}>{formatCurrency(mandate.maxAmount)}</Text>
          </View>
          <View style={styles.autopayDetailCol}>
            <Text style={[styles.autopayDetailLabel, { color: colors.textMuted }]}>Bank</Text>
            <Text style={[styles.autopayDetailValue, { color: colors.text }]}>{mandate.bankName} {mandate.accountNumber}</Text>
          </View>
          <View style={styles.autopayDetailCol}>
            <Text style={[styles.autopayDetailLabel, { color: colors.textMuted }]}>Next Debit</Text>
            <Text style={[styles.autopayDetailValue, { color: colors.text }]}>{mandate.nextDebit}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onToggle(mandate.id);
          }}
          style={({ pressed }) => [
            styles.autopayToggleBtn,
            {
              backgroundColor: isActive ? colors.errorMuted : colors.successMuted,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialCommunityIcons
            name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
            size={16}
            color={isActive ? colors.error : colors.success}
          />
          <Text style={[styles.autopayToggleText, { color: isActive ? colors.error : colors.success }]}>
            {isActive ? 'Pause Autopay' : 'Resume Autopay'}
          </Text>
        </Pressable>
      </View>
    </MotiView>
  );
});

/* ------------------------------------------------------------------ */
/*  Add Card Sheet                                                     */
/* ------------------------------------------------------------------ */

interface AddCardSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddCard: (data: Omit<SavedCard, 'id' | 'isDefault'>) => void;
  onAddUPI: (data: { upiId: string; appName: string }) => void;
  colors: any;
}

const AddCardSheet: React.FC<AddCardSheetProps> = ({ visible, onClose, onAddCard, onAddUPI, colors }) => {
  const { height: screenHeight } = useWindowDimensions();
  const [mode, setMode] = useState<'card' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('form');
      setCardNumber('');
      setCardHolder('');
      setExpiry('');
      setCvv('');
      setUpiId('');
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 140, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: screenHeight, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const formatCardNum = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const detectCardType = (num: string): 'visa' | 'mastercard' | 'rupay' => {
    const d = num.replace(/\D/g, '');
    if (d.startsWith('4')) return 'visa';
    if (d.startsWith('5') || d.startsWith('2')) return 'mastercard';
    if (d.startsWith('6') || d.startsWith('8')) return 'rupay';
    return 'visa';
  };

  const handleAddCard = async () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 16 || !cardHolder.trim() || expiry.length < 5 || cvv.length < 3) {
      Alert.alert('Missing Fields', 'Please fill all card details correctly.');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddCard({
      cardNumber: digits.slice(-4),
      cardHolder: cardHolder.toUpperCase(),
      expiryDate: expiry,
      cardType: detectCardType(digits),
      bankName: 'Added Card',
    });
    setStep('success');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(handleClose, 1500);
  };

  const handleAddUPI = async () => {
    if (!upiId.includes('@')) {
      Alert.alert('Invalid UPI', 'Please enter a valid UPI ID (e.g. name@upi).');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const handle = upiId.split('@')[1] ?? '';
    let appName = 'UPI';
    if (handle.includes('ybl') || handle.includes('ibl')) appName = 'PhonePe';
    else if (handle.includes('ok')) appName = 'Google Pay';
    else if (handle.includes('paytm')) appName = 'Paytm';
    else if (handle.includes('upi')) appName = 'BHIM';

    onAddUPI({ upiId, appName });
    setStep('success');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(handleClose, 1500);
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheetOverlay}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]}>
            <Pressable style={{ flex: 1 }} onPress={handleClose} />
          </Animated.View>

          <Animated.View style={[styles.sheet, { backgroundColor: colors.card, maxHeight: screenHeight * 0.9, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.handleBar}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>
            <Pressable style={styles.sheetCloseBtn} onPress={handleClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
            </Pressable>

            {step === 'form' ? (
              <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Payment Method</Text>

                {/* Mode Toggle */}
                <View style={[styles.modeToggle, { backgroundColor: colors.surface }]}>
                  {(['card', 'upi'] as const).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setMode(m)}
                      style={[
                        styles.modeToggleBtn,
                        mode === m && { backgroundColor: colors.primary },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={m === 'card' ? 'credit-card' : 'cellphone'}
                        size={16}
                        color={mode === m ? '#FFFFFF' : colors.textMuted}
                      />
                      <Text style={[styles.modeToggleText, { color: mode === m ? '#FFFFFF' : colors.textSecondary }]}>
                        {m === 'card' ? 'Debit/Credit Card' : 'UPI ID'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {mode === 'card' ? (
                  <>
                    {/* Card Preview */}
                    <LinearGradient
                      colors={CARD_GRADIENTS[detectCardType(cardNumber)] ?? CARD_GRADIENTS.visa}
                      style={styles.cardPreview}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <MaterialCommunityIcons name="integrated-circuit-chip" size={24} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.cardPreviewNumber}>
                        {cardNumber || '**** **** **** ****'}
                      </Text>
                      <View style={styles.cardPreviewFooter}>
                        <Text style={styles.cardPreviewName}>{cardHolder || 'YOUR NAME'}</Text>
                        <Text style={styles.cardPreviewExpiry}>{expiry || 'MM/YY'}</Text>
                      </View>
                    </LinearGradient>

                    <AppInput
                      label="Card Number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChangeText={(t) => setCardNumber(formatCardNum(t))}
                      keyboardType="number-pad"
                      maxLength={19}
                      leftIcon={<MaterialCommunityIcons name="credit-card-outline" size={18} />}
                    />

                    <AppInput
                      label="Card Holder Name"
                      placeholder="Name on card"
                      value={cardHolder}
                      onChangeText={setCardHolder}
                      autoCapitalize="characters"
                      leftIcon={<MaterialCommunityIcons name="account" size={18} />}
                    />

                    <View style={styles.formRow}>
                      <View style={{ flex: 1 }}>
                        <AppInput
                          label="Expiry"
                          placeholder="MM/YY"
                          value={expiry}
                          onChangeText={(t) => setExpiry(formatExpiry(t))}
                          keyboardType="number-pad"
                          maxLength={5}
                        />
                      </View>
                      <View style={{ width: 12 }} />
                      <View style={{ flex: 1 }}>
                        <AppInput
                          label="CVV"
                          placeholder="***"
                          value={cvv}
                          onChangeText={setCvv}
                          keyboardType="number-pad"
                          maxLength={4}
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <View style={styles.sheetActionRow}>
                      <AppButton title="Add Card" onPress={handleAddCard} fullWidth size="lg" />
                    </View>
                  </>
                ) : (
                  <>
                    <AppInput
                      label="UPI ID"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChangeText={setUpiId}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      leftIcon={<MaterialCommunityIcons name="at" size={18} />}
                    />

                    {/* Popular UPI Apps */}
                    <Text style={[styles.popularLabel, { color: colors.textMuted }]}>Popular UPI Apps</Text>
                    <View style={styles.upiChipRow}>
                      {[
                        { name: 'PhonePe', handle: '@ybl' },
                        { name: 'GPay', handle: '@okaxis' },
                        { name: 'Paytm', handle: '@paytm' },
                        { name: 'BHIM', handle: '@upi' },
                      ].map((app) => (
                        <Pressable
                          key={app.name}
                          onPress={() => {
                            const username = upiId.split('@')[0] || 'yourname';
                            setUpiId(username + app.handle);
                          }}
                          style={[styles.upiChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                          <Text style={[styles.upiChipText, { color: colors.text }]}>{app.name}</Text>
                        </Pressable>
                      ))}
                    </View>

                    <View style={styles.sheetActionRow}>
                      <AppButton title="Verify & Add UPI" onPress={handleAddUPI} fullWidth size="lg" />
                    </View>
                  </>
                )}

                <View style={[styles.securityNote, { backgroundColor: colors.surface }]}>
                  <MaterialCommunityIcons name="shield-lock" size={14} color={colors.primary} />
                  <Text style={[styles.securityNoteText, { color: colors.textMuted }]}>
                    Your payment details are encrypted and securely stored.
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.successContainer}>
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
                <Text style={[styles.successTitle, { color: colors.text }]}>
                  {mode === 'card' ? 'Card Added!' : 'UPI Added!'}
                </Text>
                <Text style={[styles.successSubtext, { color: colors.textMuted }]}>
                  Your payment method has been saved successfully.
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
/*  PaymentMethodsScreen                                               */
/* ------------------------------------------------------------------ */

const PaymentMethodsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { s, isTablet } = useResponsive();
  const { width: windowWidth } = useWindowDimensions();
  const store = useBankStore();
  const [activeTab, setActiveTab] = useState<TabKey>('cards');
  const [showAddSheet, setShowAddSheet] = useState(false);

  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (store.savedCards.length === 0) store.loadBankData();
  }, []);

  useEffect(() => {
    const toValue = activeTab === 'cards' ? 0 : activeTab === 'upi' ? 1 : 2;
    Animated.spring(tabIndicatorAnim, { toValue, damping: 15, stiffness: 150, useNativeDriver: true }).start();
  }, [activeTab]);

  const handleDeleteCard = useCallback((id: string) => {
    Alert.alert('Remove Card', 'Remove this card?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => store.removeCard(id) },
    ]);
  }, []);

  const handleDeleteUPI = useCallback((id: string) => {
    Alert.alert('Remove UPI', 'Remove this UPI ID?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => store.removeUPI(id) },
    ]);
  }, []);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'cards', label: 'Cards', icon: 'credit-card' },
    { key: 'upi', label: 'UPI', icon: 'cellphone' },
    { key: 'autopay', label: 'Autopay', icon: 'repeat' },
  ];

  const tabWidth = (windowWidth - 40) / 3;

  const renderContent = () => {
    switch (activeTab) {
      case 'cards':
        return (
          <View>
            {store.savedCards.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="credit-card-off" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Saved Cards</Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  Add a debit or credit card for quick payments.
                </Text>
              </View>
            ) : (
              store.savedCards.map((card, i) => (
                <CardVisual
                  key={card.id}
                  card={card}
                  index={i}
                  onSetDefault={store.setDefaultCard}
                  onDelete={handleDeleteCard}
                  colors={colors}
                />
              ))
            )}
            <View style={styles.addBtnRow}>
              <AppButton
                title="Add New Card"
                onPress={() => setShowAddSheet(true)}
                fullWidth
                variant="secondary"
                leftIcon={<MaterialCommunityIcons name="plus" size={16} color={colors.primary} />}
              />
            </View>
          </View>
        );

      case 'upi':
        return (
          <View>
            {store.savedUPI.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="cellphone-off" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No UPI IDs</Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  Link your UPI ID for instant payments.
                </Text>
              </View>
            ) : (
              store.savedUPI.map((upi, i) => (
                <UPIItem
                  key={upi.id}
                  upi={upi}
                  index={i}
                  onSetDefault={store.setDefaultUPI}
                  onDelete={handleDeleteUPI}
                  colors={colors}
                />
              ))
            )}
            <View style={styles.addBtnRow}>
              <AppButton
                title="Add New UPI ID"
                onPress={() => setShowAddSheet(true)}
                fullWidth
                variant="secondary"
                leftIcon={<MaterialCommunityIcons name="plus" size={16} color={colors.primary} />}
              />
            </View>
          </View>
        );

      case 'autopay':
        return (
          <View>
            {store.autopayMandates.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="repeat-off" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Autopay Setup</Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  Set up autopay to never miss an EMI payment.
                </Text>
              </View>
            ) : (
              store.autopayMandates.map((m, i) => (
                <AutopayItem
                  key={m.id}
                  mandate={m}
                  index={i}
                  onToggle={store.toggleAutopay}
                  colors={colors}
                />
              ))
            )}
            {/* Autopay info */}
            <View style={[styles.autopayInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="information" size={16} color={colors.primary} />
              <Text style={[styles.autopayInfoText, { color: colors.textMuted }]}>
                Autopay mandates are created automatically when you take a new loan. You can pause/resume them here.
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <ScreenWrapper
      headerTitle="Payment Methods"
      onBack={() => navigation.goBack()}
      scrollable
    >
      {/* Segmented Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              backgroundColor: colors.primary,
              width: tabWidth - 8,
              transform: [{
                translateX: tabIndicatorAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [4, tabWidth + 4, tabWidth * 2 + 4],
                }),
              }],
            },
          ]}
        />
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.key);
            }}
            style={styles.tabBtn}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#FFFFFF' : colors.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? '#FFFFFF' : colors.textMuted },
            ]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {renderContent()}

      <AddCardSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onAddCard={store.addCard}
        onAddUPI={store.addUPI}
        colors={colors}
      />
    </ScreenWrapper>
  );
};

export default PaymentMethodsScreen;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* Tab Bar */
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    height: 40,
    borderRadius: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 6,
    zIndex: 1,
  },
  tabText: { fontSize: 13, fontWeight: '600' },

  /* Credit Card */
  creditCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
    aspectRatio: 1.7,
    justifyContent: 'space-between',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBankName: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  defaultChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  defaultChipText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  cardChip: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardNumberDisplay: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: 2, marginTop: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardFooterLabel: { fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, fontWeight: '500' },
  cardFooterValue: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 2 },
  cardBrandIcon: { alignItems: 'center' },
  cardBrandText: { fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginTop: 2 },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cardActionText: { fontSize: 12, fontWeight: '600' },

  /* UPI Card */
  upiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  upiIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  upiInfo: { flex: 1, marginLeft: 12 },
  upiNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upiId: { fontSize: 15, fontWeight: '600' },
  upiDefaultBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  upiDefaultText: { fontSize: 10, fontWeight: '700' },
  upiSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  upiApp: { fontSize: 12 },
  verifiedBadgeSmall: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verifiedSmallText: { fontSize: 10, fontWeight: '600' },
  upiActions: { flexDirection: 'row', gap: 12 },

  /* Autopay Card */
  autopayCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  autopayHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  autopayIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  autopayInfo: { flex: 1, marginLeft: 10 },
  autopayLoanType: { fontSize: 14, fontWeight: '600' },
  autopayLoanId: { fontSize: 11, marginTop: 2 },
  autopayStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  autopayStatusText: { fontSize: 11, fontWeight: '600' },
  autopayDetails: { flexDirection: 'row', marginHorizontal: 14, borderRadius: 10, padding: 10, marginBottom: 10, gap: 8 },
  autopayDetailCol: { flex: 1 },
  autopayDetailLabel: { fontSize: 10, fontWeight: '500', letterSpacing: 0.3 },
  autopayDetailValue: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  autopayToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6, marginHorizontal: 14, marginBottom: 14, borderRadius: 10 },
  autopayToggleText: { fontSize: 13, fontWeight: '600' },
  autopayInfoCard: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  autopayInfoText: { fontSize: 12, flex: 1, lineHeight: 16 },

  /* Empty State */
  emptyState: { alignItems: 'center', padding: 32, borderRadius: 16, borderWidth: 1 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySubtext: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  /* Add Button */
  addBtnRow: { marginTop: 16, marginBottom: 8 },

  /* Sheet */
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, paddingBottom: 34 },
  handleBar: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  sheetCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  sheetBody: { paddingHorizontal: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 16 },

  /* Mode Toggle */
  modeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  modeToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  modeToggleText: { fontSize: 13, fontWeight: '600' },

  /* Card Preview */
  cardPreview: { borderRadius: 14, padding: 16, marginBottom: 20, height: 160, justifyContent: 'space-between' },
  cardPreviewNumber: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  cardPreviewFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardPreviewName: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  cardPreviewExpiry: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  /* Form */
  formGroup: { marginBottom: 14 }, // kept for formRow layout
  formRow: { flexDirection: 'row' },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1 },

  /* UPI Chips */
  popularLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8, letterSpacing: 0.3 },
  upiChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  upiChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  upiChipText: { fontSize: 13, fontWeight: '500' },

  /* Security Note */
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginBottom: 16 },
  securityNoteText: { fontSize: 11, flex: 1, lineHeight: 15 },

  sheetActionRow: { marginTop: 4, marginBottom: 12 },

  /* Success */
  successContainer: { alignItems: 'center', paddingVertical: 40 },
  successCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 20, fontWeight: '700', marginTop: 20 },
  successSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
