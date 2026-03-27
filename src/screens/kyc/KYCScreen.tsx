import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../utils/responsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from '../../utils/MotiCompat';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types/navigation';
import { useKYCStore } from '../../store/kycStore';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppChip from '../../components/ui/AppChip';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import StepIndicator from '../../components/shared/StepIndicator';
import { PincodeLookup } from '../../constants/indianStates';
import type { AddressDocType } from '../../types/kyc';

type Props = NativeStackScreenProps<ProfileStackParamList, 'KYC'>;
type KYCView = 'overview' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'complete';

const STEP_NAMES = ['PAN Card', 'Aadhaar Card', 'Selfie Verification', 'Bank Statement', 'Address Proof'];
const STEP_SUBTITLES = ['Instant verification', 'Takes 30 seconds', 'Quick face scan', 'Upload PDF', 'Final step'];
const STEP_INDICATOR_LABELS = ['PAN', 'Aadhaar', 'Selfie', 'Bank', 'Address'];
const STEP_ICONS: Array<keyof typeof MaterialCommunityIcons.glyphMap> = [
  'card-account-details-outline',
  'fingerprint',
  'face-recognition',
  'bank-outline',
  'map-marker-radius-outline',
];
const STEP_COLORS = ['#8B5CF6', '#3B82F6', '#0EA5E9', '#F59E0B', '#22C55E'];

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const ADDRESS_DOC_OPTIONS: { label: string; value: AddressDocType }[] = [
  { label: 'Utility Bill', value: 'utility_bill' },
  { label: 'Rent Agreement', value: 'rent_agreement' },
  { label: 'Passport', value: 'passport' },
  { label: 'Voter ID', value: 'voter_id' },
];

// ---------- Pulsing Dot for active step ----------
const PulsingDot = memo(({ color }: { color: string }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, [scale, opacity]);

  return (
    <View style={styles.pulsingDotContainer}>
      <Animated.View
        style={[
          styles.pulsingRing,
          { backgroundColor: color, transform: [{ scale }], opacity },
        ]}
      />
      <View style={[styles.pulsingDotInner, { backgroundColor: color }]} />
    </View>
  );
});

// ---------- Selfie Scan Line Component ----------
const ScanLine = memo(({ imageHeight, color }: { imageHeight: number; color: string }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: imageHeight, duration: 2000, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, [imageHeight, translateY]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: color,
        },
        { transform: [{ translateY }] },
      ]}
    />
  );
});

// ---------- Upload Card Component ----------
const UploadCard = memo(
  ({
    icon,
    label,
    onPress,
    borderColor,
    iconColor,
    textColor,
    bgColor,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    borderColor: string;
    iconColor: string;
    textColor: string;
    bgColor: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.uploadCard,
        { borderColor, backgroundColor: bgColor },
        pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[styles.uploadIconCircle, { backgroundColor: `${iconColor}1A` }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
      </View>
      <Text style={[styles.uploadCardText, { color: textColor }]}>{label}</Text>
    </Pressable>
  ),
);

// ===================== MAIN COMPONENT =====================
const KYCScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { s, isTablet } = useResponsive();
  const { width: screenWidth } = useWindowDimensions();
  const kycStore = useKYCStore();

  // Local state
  const [currentView, setCurrentView] = useState<KYCView>('overview');

  // Step 1 state
  const [panNumber, setPanNumber] = useState(kycStore.data.panNumber);
  const [panImage, setPanImage] = useState<string | undefined>(kycStore.data.panImage);
  const [panError, setPanError] = useState('');

  // Step 2 state
  const [aadhaarNumber, setAadhaarNumber] = useState(kycStore.data.aadhaarNumber);
  const [aadhaarFront, setAadhaarFront] = useState<string | undefined>(kycStore.data.aadhaarFront);
  const [aadhaarBack, setAadhaarBack] = useState<string | undefined>(kycStore.data.aadhaarBack);
  const [aadhaarError, setAadhaarError] = useState('');

  // Step 3 state
  const [selfieImage, setSelfieImage] = useState<string | undefined>(kycStore.data.selfieImage);

  // Step 4 state
  const [bankStatement, setBankStatement] = useState<string | undefined>(kycStore.data.bankStatement);
  const [bankStatementName, setBankStatementName] = useState<string | undefined>(kycStore.data.bankStatementName);

  // Step 5 state
  const [selectedDocType, setSelectedDocType] = useState<AddressDocType | null>(kycStore.data.addressDocType);
  const [addressDocImage, setAddressDocImage] = useState<string | undefined>(kycStore.data.addressDocImage);
  const [addressLine1, setAddressLine1] = useState(kycStore.data.addressLine1);
  const [addressLine2, setAddressLine2] = useState(kycStore.data.addressLine2);
  const [city, setCity] = useState(kycStore.data.city);
  const [stateName, setStateName] = useState(kycStore.data.state);
  const [pincode, setPincode] = useState(kycStore.data.pincode);

  // ---------- Navigation helpers ----------
  const handleBack = useCallback(() => {
    switch (currentView) {
      case 'step1':
        setCurrentView('overview');
        break;
      case 'step2':
        setCurrentView('step1');
        break;
      case 'step3':
        setCurrentView('step2');
        break;
      case 'step4':
        setCurrentView('step3');
        break;
      case 'step5':
        setCurrentView('step4');
        break;
      case 'complete':
        setCurrentView('overview');
        break;
      default:
        navigation.goBack();
    }
  }, [currentView, navigation]);

  const getFirstIncompleteStep = useCallback((): KYCView => {
    for (let i = 0; i < kycStore.steps.length; i++) {
      if (kycStore.steps[i].status !== 'completed') {
        return `step${i + 1}` as KYCView;
      }
    }
    return 'step1';
  }, [kycStore.steps]);

  // ---------- Image picking ----------
  const pickFromCamera = useCallback(async (cameraType?: ImagePicker.CameraType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return undefined;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
      cameraType: cameraType ?? ImagePicker.CameraType.back,
    });
    if (!result.canceled && result.assets[0]) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return result.assets[0].uri;
    }
    return undefined;
  }, []);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
      return undefined;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return result.assets[0].uri;
    }
    return undefined;
  }, []);

  // ---------- PAN Validation ----------
  const validatePan = useCallback((value: string) => {
    if (!value) {
      setPanError('PAN number is required');
      return false;
    }
    if (!PAN_REGEX.test(value)) {
      setPanError('Invalid PAN format (e.g., ABCDE1234F)');
      return false;
    }
    setPanError('');
    return true;
  }, []);

  // ---------- Aadhaar formatting ----------
  const handleAadhaarChange = useCallback((text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    for (let i = 0; i < digitsOnly.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += digitsOnly[i];
    }
    setAadhaarNumber(formatted);
    setAadhaarError('');
  }, []);

  const validateAadhaar = useCallback((value: string) => {
    const digits = value.replace(/\s/g, '');
    if (digits.length !== 12) {
      setAadhaarError('Aadhaar number must be 12 digits');
      return false;
    }
    setAadhaarError('');
    return true;
  }, []);

  // ---------- Pincode lookup ----------
  const handlePincodeChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);
    if (cleaned.length === 6) {
      const lookup = PincodeLookup[cleaned];
      if (lookup) {
        setCity(lookup.city);
        setStateName(lookup.state);
        Toast.show({
          type: 'success',
          text1: 'Pincode Found',
          text2: `${lookup.city}, ${lookup.state}`,
        });
      }
    }
  }, []);

  // ---------- Step transitions ----------
  const handleStep1Next = useCallback(() => {
    if (!validatePan(panNumber)) return;
    if (!panImage) {
      Alert.alert('Upload Required', 'Please upload or take a photo of your PAN card.');
      return;
    }
    kycStore.updateData({ panNumber, panImage });
    kycStore.updateStep(1, 'completed');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCurrentView('step2');
  }, [panNumber, panImage, validatePan, kycStore]);

  const handleStep2Next = useCallback(() => {
    if (!validateAadhaar(aadhaarNumber)) return;
    if (!aadhaarFront || !aadhaarBack) {
      Alert.alert('Upload Required', 'Please upload both front and back of your Aadhaar card.');
      return;
    }
    kycStore.updateData({ aadhaarNumber, aadhaarFront, aadhaarBack });
    kycStore.updateStep(2, 'completed');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCurrentView('step3');
  }, [aadhaarNumber, aadhaarFront, aadhaarBack, validateAadhaar, kycStore]);

  const handleStep3Next = useCallback(() => {
    if (!selfieImage) {
      Alert.alert('Selfie Required', 'Please take a selfie for verification.');
      return;
    }
    kycStore.updateData({ selfieImage });
    kycStore.updateStep(3, 'completed');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCurrentView('step4');
  }, [selfieImage, kycStore]);

  const handleStep4Next = useCallback(() => {
    if (!bankStatement) {
      Alert.alert('Upload Required', 'Please upload your bank statement.');
      return;
    }
    kycStore.updateData({ bankStatement, bankStatementName });
    kycStore.updateStep(4, 'completed');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCurrentView('step5');
  }, [bankStatement, bankStatementName, kycStore]);

  const handleStep5Submit = useCallback(() => {
    if (!selectedDocType) {
      Alert.alert('Required', 'Please select a document type.');
      return;
    }
    if (!addressDocImage) {
      Alert.alert('Upload Required', 'Please upload your address proof document.');
      return;
    }
    if (!addressLine1.trim()) {
      Alert.alert('Required', 'Please enter your address.');
      return;
    }
    if (!city.trim() || !stateName.trim() || pincode.length !== 6) {
      Alert.alert('Required', 'Please fill in city, state, and a valid 6-digit pincode.');
      return;
    }
    kycStore.updateData({
      addressDocType: selectedDocType,
      addressDocImage,
      addressLine1,
      addressLine2,
      city,
      state: stateName,
      pincode,
    });
    kycStore.updateStep(5, 'completed');
    kycStore.submitKYC();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCurrentView('complete');
  }, [selectedDocType, addressDocImage, addressLine1, addressLine2, city, stateName, pincode, kycStore]);

  // ---------- Document picker (Step 4) ----------
  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a PDF under 10MB.');
          return;
        }
        setBankStatement(asset.uri);
        setBankStatementName(asset.name);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document.');
    }
  }, []);

  // ===================== RENDER HELPERS =====================

  const renderUploadRow = useCallback(
    (onCamera: () => void, onGallery: () => void) => (
      <View style={styles.uploadRow}>
        <UploadCard
          icon="camera"
          label="Take Photo"
          onPress={onCamera}
          borderColor={colors.border}
          iconColor={colors.primary}
          textColor={colors.textSecondary}
          bgColor={colors.surface}
        />
        <UploadCard
          icon="image"
          label="Upload"
          onPress={onGallery}
          borderColor={colors.border}
          iconColor={colors.primary}
          textColor={colors.textSecondary}
          bgColor={colors.surface}
        />
      </View>
    ),
    [colors],
  );

  const renderImagePreview = useCallback(
    (uri: string, onRetake: () => void, onContinue?: () => void) => (
      <View>
        <View style={[styles.imagePreviewContainer, { borderColor: colors.success }]}>
          <Image source={{ uri }} style={styles.imagePreview} resizeMode="cover" />
          <View style={[styles.imagePreviewBadge, { backgroundColor: colors.successMuted }]}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.imagePreviewBadgeText, { color: colors.success }]}>Uploaded</Text>
          </View>
        </View>
        <View style={styles.previewActions}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <AppButton title="Retake" variant="secondary" onPress={onRetake} fullWidth />
          </View>
          {onContinue && (
            <View style={{ flex: 1, marginLeft: 8 }}>
              <AppButton title="Continue" variant="primary" onPress={onContinue} fullWidth />
            </View>
          )}
        </View>
      </View>
    ),
    [colors.success, colors.successMuted],
  );

  // ===================== VIEW: OVERVIEW =====================
  const renderOverview = () => {
    const { overallStatus } = kycStore;
    const completedCount = kycStore.steps.filter((s) => s.status === 'completed').length;
    const totalSteps = kycStore.steps.length;
    const progressPercent = (completedCount / totalSteps) * 100;

    const statusConfig: Record<
      string,
      { gradient: [string, string]; icon: string; label: string; description: string }
    > = {
      verified: {
        gradient: ['#16A34A', '#22C55E'],
        icon: 'shield-check',
        label: 'KYC Verified',
        description: 'Your identity has been verified successfully.',
      },
      under_review: {
        gradient: ['#D97706', '#F59E0B'],
        icon: 'clock-outline',
        label: 'Under Review',
        description: 'Your documents are being reviewed. Usually takes 24-48 hours.',
      },
      rejected: {
        gradient: ['#DC2626', '#EF4444'],
        icon: 'alert-circle',
        label: 'Verification Rejected',
        description: 'Some documents were rejected. Please re-upload them.',
      },
      not_started: {
        gradient: ['#C8850A', '#E8A830'],
        icon: 'shield-alert-outline',
        label: 'Verify Your Identity',
        description: 'Complete KYC to unlock all features & start transacting.',
      },
      in_progress: {
        gradient: ['#C8850A', '#E8A830'],
        icon: 'shield-half-full',
        label: 'Almost There!',
        description: 'Continue verification to unlock all features.',
      },
    };

    const config = statusConfig[overallStatus] || statusConfig.not_started;

    const getStepStatus = (status: string) => {
      switch (status) {
        case 'completed':
          return { badge: 'Verified', badgeBg: 'rgba(34, 197, 94, 0.12)', badgeColor: '#22C55E', iconName: 'check-circle' as const };
        case 'in_progress':
          return { badge: 'Continue', badgeBg: 'rgba(200, 133, 10, 0.12)', badgeColor: '#C8850A', iconName: 'arrow-right-circle' as const };
        case 'rejected':
          return { badge: 'Retry', badgeBg: 'rgba(239, 68, 68, 0.12)', badgeColor: '#EF4444', iconName: 'refresh-circle' as const };
        default:
          return { badge: 'Pending', badgeBg: `${colors.textMuted}14`, badgeColor: colors.textMuted, iconName: 'chevron-right' as const };
      }
    };

    return (
      <View style={styles.viewContainer}>
        {/* ---- Hero Status Card with Gradient ---- */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <MaterialCommunityIcons name={config.icon as any} size={28} color="#FFFFFF" />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroLabel}>{config.label}</Text>
                <Text style={styles.heroDescription}>{config.description}</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.heroProgressSection}>
              <View style={styles.heroProgressHeader}>
                <Text style={styles.heroProgressLabel}>
                  {completedCount} of {totalSteps} completed
                </Text>
                <Text style={styles.heroProgressPercent}>{Math.round(progressPercent)}%</Text>
              </View>
              <View style={styles.heroProgressTrack}>
                <View style={[styles.heroProgressFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* ---- RBI compliance note ---- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
        >
          <View style={[styles.complianceNote, { backgroundColor: colors.infoMuted }]}>
            <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.info} />
            <Text style={[styles.complianceText, { color: colors.info }]}>
              KYC is mandatory as per RBI guidelines. Your data is encrypted & secure.
            </Text>
          </View>
        </MotiView>

        {/* ---- Step Cards ---- */}
        <View style={styles.stepsSection}>
          {kycStore.steps.map((step, index) => {
            const stepColor = STEP_COLORS[index];
            const status = getStepStatus(step.status);
            const isCompleted = step.status === 'completed';
            const isCurrent = index === kycStore.currentStep && step.status !== 'completed';
            const isLocked = index > kycStore.currentStep && step.status !== 'completed';
            const canNavigate = step.status !== 'completed' && index <= kycStore.currentStep;

            return (
              <MotiView
                key={step.id}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 450, delay: 300 + index * 80 }}
              >
                <Pressable
                  onPress={() => {
                    if (canNavigate) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCurrentView(`step${index + 1}` as KYCView);
                    }
                  }}
                  disabled={isLocked}
                  style={({ pressed }) => [
                    styles.stepCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isCurrent ? stepColor : colors.border,
                      borderWidth: isCurrent ? 1.5 : 1,
                      opacity: isLocked ? 0.55 : 1,
                    },
                    isCurrent && {
                      shadowColor: stepColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 4,
                    },
                    pressed && canNavigate && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  {/* Left: Icon container */}
                  <View style={[styles.stepIconContainer, { backgroundColor: `${stepColor}14` }]}>
                    {isCompleted ? (
                      <View style={[styles.stepIconCompleted, { backgroundColor: '#22C55E' }]}>
                        <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                      </View>
                    ) : isCurrent ? (
                      <PulsingDot color={stepColor} />
                    ) : (
                      <MaterialCommunityIcons name={STEP_ICONS[index]} size={22} color={isLocked ? colors.textMuted : stepColor} />
                    )}
                  </View>

                  {/* Middle: Text */}
                  <View style={styles.stepTextWrap}>
                    <Text style={[styles.stepName, { color: isLocked ? colors.textMuted : colors.text }]}>
                      {STEP_NAMES[index]}
                    </Text>
                    <Text style={[styles.stepSubtitle, { color: isLocked ? colors.textMuted : colors.textSecondary }]}>
                      {isCompleted ? 'Verified successfully' : STEP_SUBTITLES[index]}
                    </Text>
                  </View>

                  {/* Right: Status badge or lock */}
                  {isLocked ? (
                    <View style={[styles.stepBadge, { backgroundColor: `${colors.textMuted}14` }]}>
                      <MaterialCommunityIcons name="lock" size={14} color={colors.textMuted} />
                    </View>
                  ) : (
                    <View style={[styles.stepBadge, { backgroundColor: status.badgeBg }]}>
                      {isCompleted ? (
                        <MaterialCommunityIcons name="check-circle" size={14} color={status.badgeColor} />
                      ) : null}
                      <Text style={[styles.stepBadgeText, { color: status.badgeColor }]}>
                        {status.badge}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </MotiView>
            );
          })}
        </View>

        {/* ---- Trust Signal ---- */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 800 }}
        >
          <View style={styles.trustRow}>
            <MaterialCommunityIcons name="lock-check" size={14} color={colors.textMuted} />
            <Text style={[styles.trustText, { color: colors.textMuted }]}>
              256-bit encrypted  |  ISO 27001 certified
            </Text>
          </View>
        </MotiView>

        {/* ---- CTA Button ---- */}
        <View style={styles.bottomAction}>
          <AppButton
            title={completedCount === 0 ? 'Start Verification' : completedCount === totalSteps ? 'View Status' : 'Continue Verification'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (completedCount === totalSteps) {
                setCurrentView('complete');
              } else {
                setCurrentView(getFirstIncompleteStep());
              }
            }}
            fullWidth
          />
        </View>
      </View>
    );
  };

  // ===================== SHARED STEP RENDERER =====================
  const renderStepHeader = (stepIndex: number, title: string, subtitle: string) => {
    const color = STEP_COLORS[stepIndex];
    const icon = STEP_ICONS[stepIndex];
    return (
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <LinearGradient
          colors={[`${color}18`, `${color}06`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.stepHeroCard}
        >
          <View style={[styles.stepHeroIconWrap, { backgroundColor: `${color}20` }]}>
            <MaterialCommunityIcons name={icon} size={30} color={color} />
          </View>
          <Text style={[styles.stepHeroTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.stepHeroSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </LinearGradient>
      </MotiView>
    );
  };

  // ===================== VIEW: STEP 1 — PAN =====================
  const renderStep1 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={0} />

      <View style={styles.stepContent}>
        {renderStepHeader(0, 'Verify your PAN', 'Enter your PAN number and upload a clear photo of your card')}

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
        >
          <View style={[styles.inputSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppInput
              label="PAN Number"
              value={panNumber}
              onChangeText={(text) => {
                setPanNumber(text.toUpperCase());
                setPanError('');
              }}
              autoCapitalize="characters"
              maxLength={10}
              error={panError}
              placeholder="ABCDE1234F"
              showCharCount
              leftIcon={<MaterialCommunityIcons name="card-account-details-outline" size={20} />}
            />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 250 }}
        >
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>UPLOAD PAN CARD</Text>

          {!panImage ? (
            renderUploadRow(
              async () => {
                const uri = await pickFromCamera();
                if (uri) setPanImage(uri);
              },
              async () => {
                const uri = await pickFromGallery();
                if (uri) setPanImage(uri);
              },
            )
          ) : (
            renderImagePreview(panImage, () => setPanImage(undefined))
          )}
        </MotiView>

        <View style={styles.bottomAction}>
          <AppButton
            title="Verify & Continue"
            onPress={handleStep1Next}
            fullWidth
            disabled={!panNumber || !panImage}
          />
        </View>
      </View>
    </View>
  );

  // ===================== VIEW: STEP 2 — AADHAAR =====================
  const renderStep2 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={1} />

      <View style={styles.stepContent}>
        {renderStepHeader(1, 'Verify your Aadhaar', 'Enter your Aadhaar number and upload both sides of your card')}

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
        >
          <View style={[styles.inputSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppInput
              label="Aadhaar Number"
              value={aadhaarNumber}
              onChangeText={handleAadhaarChange}
              keyboardType="numeric"
              maxLength={14}
              error={aadhaarError}
              placeholder="XXXX XXXX XXXX"
              showCharCount
              leftIcon={<MaterialCommunityIcons name="fingerprint" size={20} />}
            />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 250 }}
        >
          <View style={[styles.uploadSectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.uploadSectionTitle, { color: colors.text }]}>Front Side</Text>
            <Text style={[styles.uploadSectionHint, { color: colors.textMuted }]}>Photo with name & Aadhaar number visible</Text>
            <View style={{ marginTop: 12 }}>
              {!aadhaarFront ? (
                renderUploadRow(
                  async () => {
                    const uri = await pickFromCamera();
                    if (uri) setAadhaarFront(uri);
                  },
                  async () => {
                    const uri = await pickFromGallery();
                    if (uri) setAadhaarFront(uri);
                  },
                )
              ) : (
                renderImagePreview(aadhaarFront, () => setAadhaarFront(undefined))
              )}
            </View>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 350 }}
        >
          <View style={[styles.uploadSectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.uploadSectionTitle, { color: colors.text }]}>Back Side</Text>
            <Text style={[styles.uploadSectionHint, { color: colors.textMuted }]}>Photo with address details visible</Text>
            <View style={{ marginTop: 12 }}>
              {!aadhaarBack ? (
                renderUploadRow(
                  async () => {
                    const uri = await pickFromCamera();
                    if (uri) setAadhaarBack(uri);
                  },
                  async () => {
                    const uri = await pickFromGallery();
                    if (uri) setAadhaarBack(uri);
                  },
                )
              ) : (
                renderImagePreview(aadhaarBack, () => setAadhaarBack(undefined))
              )}
            </View>
          </View>
        </MotiView>

        <View style={styles.bottomAction}>
          <AppButton
            title="Verify & Continue"
            onPress={handleStep2Next}
            fullWidth
            disabled={!aadhaarNumber || !aadhaarFront || !aadhaarBack}
          />
        </View>
      </View>
    </View>
  );

  // ===================== VIEW: STEP 3 — SELFIE =====================
  const renderStep3 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={2} />

      <View style={styles.stepContent}>
        {renderStepHeader(2, 'Take a Selfie', 'We need a clear photo of your face for identity matching')}

        {!selfieImage ? (
          <>
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 450, delay: 200 }}
            >
              <View style={[styles.selfieCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Face scan area */}
                <View style={styles.selfieScanArea}>
                  <View style={[styles.selfieScanCircle, { borderColor: `${STEP_COLORS[2]}40` }]}>
                    <MaterialCommunityIcons name="face-recognition" size={52} color={STEP_COLORS[2]} />
                  </View>
                  {/* Corner brackets */}
                  <View style={[styles.cornerBracket, styles.cornerTL, { borderColor: STEP_COLORS[2] }]} />
                  <View style={[styles.cornerBracket, styles.cornerTR, { borderColor: STEP_COLORS[2] }]} />
                  <View style={[styles.cornerBracket, styles.cornerBL, { borderColor: STEP_COLORS[2] }]} />
                  <View style={[styles.cornerBracket, styles.cornerBR, { borderColor: STEP_COLORS[2] }]} />
                </View>

                <View style={styles.tipsContainer}>
                  {[
                    { icon: 'lightbulb-on-outline' as const, text: 'Ensure good lighting', color: '#F59E0B' },
                    { icon: 'glasses' as const, text: 'Remove glasses & caps', color: '#3B82F6' },
                    { icon: 'camera-front' as const, text: 'Face the camera directly', color: '#22C55E' },
                  ].map((tip, idx) => (
                    <MotiView
                      key={tip.text}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'timing', duration: 300, delay: 400 + idx * 100 }}
                    >
                      <View style={styles.tipRow}>
                        <View style={[styles.tipIconCircle, { backgroundColor: `${tip.color}14` }]}>
                          <MaterialCommunityIcons name={tip.icon} size={16} color={tip.color} />
                        </View>
                        <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip.text}</Text>
                      </View>
                    </MotiView>
                  ))}
                </View>
              </View>
            </MotiView>

            <View style={{ marginTop: 4 }}>
              <AppButton
                title="Open Camera"
                onPress={async () => {
                  const uri = await pickFromCamera(ImagePicker.CameraType.front);
                  if (uri) setSelfieImage(uri);
                }}
                fullWidth
              />
            </View>
          </>
        ) : (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <View style={styles.selfiePreviewContainer}>
              <View style={[styles.selfiePreviewWrapper, { borderColor: STEP_COLORS[2] }]}>
                <Image source={{ uri: selfieImage }} style={styles.selfiePreview} resizeMode="cover" />
                <ScanLine imageHeight={200} color={STEP_COLORS[2]} />
              </View>

              <View style={[styles.selfieMatchBadge, { backgroundColor: `${STEP_COLORS[2]}14` }]}>
                <MaterialCommunityIcons name="check-circle" size={16} color={STEP_COLORS[2]} />
                <Text style={[styles.selfieMatchText, { color: STEP_COLORS[2] }]}>Photo captured</Text>
              </View>

              <View style={styles.previewActions}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <AppButton title="Retake" variant="secondary" onPress={() => setSelfieImage(undefined)} fullWidth />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <AppButton title="Confirm" variant="primary" onPress={handleStep3Next} fullWidth />
                </View>
              </View>
            </View>
          </MotiView>
        )}
      </View>
    </View>
  );

  // ===================== VIEW: STEP 4 — BANK STATEMENT =====================
  const renderStep4 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={3} />

      <View style={styles.stepContent}>
        {renderStepHeader(3, 'Upload Bank Statement', 'Upload last 3 months statement in PDF format')}

        <Pressable
          onPress={handlePickDocument}
          style={({ pressed }) => [
            styles.documentUploadCard,
            {
              borderColor: bankStatement ? colors.success : colors.border,
              backgroundColor: bankStatement ? colors.successMuted : colors.surface,
            },
            pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
          ]}
        >
          {!bankStatement ? (
            <View style={styles.documentUploadContent}>
              <View style={[styles.docIconCircle, { backgroundColor: colors.errorMuted }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={32} color={colors.error} />
              </View>
              <Text style={[styles.documentUploadText, { color: colors.text, maxWidth: screenWidth - 80 }]}>Tap to upload PDF</Text>
              <Text style={[styles.documentUploadHint, { color: colors.textMuted }]}>Max file size: 10MB</Text>
            </View>
          ) : (
            <View style={styles.documentUploadContent}>
              <View style={[styles.docIconCircle, { backgroundColor: colors.successMuted }]}>
                <MaterialCommunityIcons name="file-check-outline" size={32} color={colors.success} />
              </View>
              <Text style={[styles.documentUploadText, { color: colors.text, maxWidth: screenWidth - 80 }]} numberOfLines={1}>
                {bankStatementName || 'Document uploaded'}
              </Text>
              <View style={[styles.uploadSuccessBadge, { backgroundColor: colors.successMuted }]}>
                <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.uploadSuccessText, { color: colors.success }]}>Uploaded</Text>
              </View>
            </View>
          )}
        </Pressable>

        <View style={{ marginTop: 12 }}>
          <AppButton
            title="Connect via Account Aggregator"
            variant="secondary"
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Coming Soon',
                text2: 'Account Aggregator will be available soon',
              });
            }}
            fullWidth
          />
        </View>

        <View style={styles.bottomAction}>
          <AppButton title="Next" onPress={handleStep4Next} fullWidth disabled={!bankStatement} />
        </View>
      </View>
    </View>
  );

  // ===================== VIEW: STEP 5 — ADDRESS =====================
  const renderStep5 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={4} />

      <View style={styles.stepContent}>
        {renderStepHeader(4, 'Address Proof', 'Final step! Select document type and provide your address')}

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DOCUMENT TYPE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipRowContent}
          keyboardShouldPersistTaps="handled"
        >
          {ADDRESS_DOC_OPTIONS.map((opt) => (
            <View key={opt.value} style={{ marginRight: 8 }}>
              <AppChip
                label={opt.label}
                selected={selectedDocType === opt.value}
                onPress={() => setSelectedDocType(opt.value)}
              />
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 12 }]}>UPLOAD DOCUMENT</Text>
        {!addressDocImage ? (
          renderUploadRow(
            async () => {
              const uri = await pickFromCamera();
              if (uri) setAddressDocImage(uri);
            },
            async () => {
              const uri = await pickFromGallery();
              if (uri) setAddressDocImage(uri);
            },
          )
        ) : (
          renderImagePreview(addressDocImage, () => setAddressDocImage(undefined))
        )}

        <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 8 }]}>ADDRESS DETAILS</Text>
        <View style={[styles.addressFormCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppInput label="Address Line 1 *" value={addressLine1} onChangeText={setAddressLine1} placeholder="House no, Street name" />
          <View style={styles.addressFieldGap} />
          <AppInput label="Address Line 2" value={addressLine2} onChangeText={setAddressLine2} placeholder="Area, Landmark" />
          <View style={styles.addressFieldGap} />
          <AppInput label="Pincode *" value={pincode} onChangeText={handlePincodeChange} keyboardType="numeric" maxLength={6} placeholder="6-digit pincode" />
          <View style={styles.addressFieldGap} />
          <View style={styles.cityStateRow}>
            <View style={styles.cityStateField}>
              <AppInput label="City *" value={city} onChangeText={setCity} placeholder="City" />
            </View>
            <View style={styles.cityStateGap} />
            <View style={styles.cityStateField}>
              <AppInput label="State *" value={stateName} onChangeText={setStateName} placeholder="State" />
            </View>
          </View>
        </View>

        <View style={styles.bottomAction}>
          <AppButton
            title="Submit KYC"
            onPress={handleStep5Submit}
            fullWidth
            disabled={!selectedDocType || !addressDocImage || !addressLine1.trim() || !city.trim() || !stateName.trim() || pincode.length !== 6}
          />
        </View>
      </View>
    </View>
  );

  // ===================== VIEW: COMPLETE =====================
  const renderComplete = () => (
    <View style={styles.completeContainer}>
      {/* Success animation */}
      <MotiView
        from={{ scale: 0, rotate: '-180deg' }}
        animate={{ scale: 1, rotate: '0deg' }}
        transition={{ type: 'spring', damping: 12 }}
      >
        <LinearGradient
          colors={['#16A34A', '#22C55E']}
          style={styles.completeCircleOuter}
        >
          <View style={styles.completeCircleInner}>
            <MaterialCommunityIcons name="check-bold" size={40} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 400 }}
      >
        <Text style={[styles.completeTitle, { color: colors.text }]}>KYC Submitted!</Text>
        <Text style={[styles.completeSubtitle, { color: colors.textSecondary }]}>
          Your documents are under review. We'll notify you once verified within 24-48 hours.
        </Text>
      </MotiView>

      {/* Timeline card */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 600 }}
        style={{ width: '100%', marginTop: 28 }}
      >
        <View style={[styles.completeTimelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'file-check-outline' as const, label: 'Documents submitted', color: '#22C55E', done: true },
            { icon: 'magnify-scan' as const, label: 'Under review', color: '#F59E0B', done: false },
            { icon: 'shield-check' as const, label: 'Verification complete', color: '#3B82F6', done: false },
          ].map((item, idx) => (
            <View key={item.label} style={styles.completeTimelineRow}>
              <View style={[styles.completeTimelineDot, { backgroundColor: item.done ? item.color : `${item.color}30` }]}>
                <MaterialCommunityIcons name={item.icon} size={16} color={item.done ? '#FFFFFF' : item.color} />
              </View>
              {idx < 2 && <View style={[styles.completeTimelineLine, { backgroundColor: item.done ? item.color : colors.border }]} />}
              <Text style={[styles.completeTimelineText, { color: item.done ? colors.text : colors.textMuted }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </MotiView>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 800 }}
        style={styles.completeButton}
      >
        <AppButton title="Back to Profile" onPress={() => navigation.navigate('Profile')} fullWidth />
      </MotiView>
    </View>
  );

  // ===================== MAIN RENDER =====================
  const getHeaderTitle = (): string => {
    switch (currentView) {
      case 'overview':
        return 'KYC Verification';
      case 'step1':
        return 'PAN Card';
      case 'step2':
        return 'Aadhaar Card';
      case 'step3':
        return 'Selfie';
      case 'step4':
        return 'Bank Statement';
      case 'step5':
        return 'Address Proof';
      case 'complete':
        return 'Verification';
      default:
        return 'KYC';
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return renderOverview();
      case 'step1':
        return renderStep1();
      case 'step2':
        return renderStep2();
      case 'step3':
        return renderStep3();
      case 'step4':
        return renderStep4();
      case 'step5':
        return renderStep5();
      case 'complete':
        return renderComplete();
      default:
        return renderOverview();
    }
  };

  return (
    <ScreenWrapper
      headerTitle={getHeaderTitle()}
      onBack={handleBack}
      scrollable={currentView !== 'complete'}
    >
      {renderCurrentView()}
    </ScreenWrapper>
  );
};

// ===================== STYLES =====================
const styles = StyleSheet.create({
  viewContainer: {
    paddingTop: 16,
  },

  // ---- Hero Status Card ----
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  heroLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    lineHeight: 18,
  },
  heroProgressSection: {
    marginTop: 18,
  },
  heroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.2,
  },
  heroProgressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroProgressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  // ---- Compliance Note ----
  complianceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  complianceText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },

  // ---- Step Cards ----
  stepsSection: {
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  stepIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCompleted: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  stepName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  stepSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ---- Pulsing Dot ----
  pulsingDotContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pulsingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ---- Trust Row ----
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ---- Step Content (individual steps) ----
  stepContent: {
    marginTop: 16,
  },
  stepHeroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  stepHeroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stepHeroTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  stepHeroSubtitle: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  inputSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 4,
    marginBottom: 20,
  },
  uploadSectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  uploadSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  uploadSectionHint: {
    fontSize: 12,
    marginTop: 2,
  },

  // ---- Upload Row ----
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  uploadCard: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCardText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ---- Image Preview ----
  imagePreviewContainer: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  imagePreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    position: 'absolute',
    bottom: 10,
  },
  imagePreviewBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  // ---- Selfie ----
  selfieCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  selfieScanArea: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  selfieScanCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  } as any,
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  selfieIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tipsContainer: {
    width: '100%',
    gap: 14,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selfiePreviewContainer: {
    alignItems: 'center',
  },
  selfiePreviewWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
  },
  selfiePreview: {
    width: '100%',
    height: '100%',
  },
  selfieMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  selfieMatchText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ---- Document Upload (Step 4) ----
  documentUploadCard: {
    height: 170,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  documentUploadContent: {
    alignItems: 'center',
    gap: 6,
  },
  docIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  documentUploadText: {
    fontSize: 15,
    fontWeight: '600',
    // maxWidth is now applied inline via screenWidth from useWindowDimensions
  },
  documentUploadHint: {
    fontSize: 12,
  },
  uploadSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 2,
  },
  uploadSuccessText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ---- Chip Row (Step 5) ----
  chipRow: {
    marginBottom: 8,
  },
  chipRowContent: {
    paddingRight: 16,
  },

  // ---- Address Form ----
  addressFormCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 4,
  },
  addressFieldGap: {
    height: 8,
  },
  cityStateRow: {
    flexDirection: 'row',
  },
  cityStateField: {
    flex: 1,
  },
  cityStateGap: {
    width: 12,
  },

  // ---- Bottom Action ----
  bottomAction: {
    marginTop: 24,
    marginBottom: 32,
  },

  // ---- Complete View ----
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  completeCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  completeCircleInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: -0.5,
  },
  completeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  completeTimelineCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  completeTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  completeTimelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTimelineLine: {
    position: 'absolute',
    left: 15,
    top: 34,
    width: 2,
    height: 20,
  },
  completeTimelineText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 14,
  },
  completeButton: {
    marginTop: 28,
    width: '100%',
  },
});

export default KYCScreen;
