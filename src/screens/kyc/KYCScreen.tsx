import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInRight,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { MotiView } from '../../utils/MotiCompat';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<ProfileStackParamList, 'KYC'>;
type KYCView = 'overview' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'complete';

const STEP_NAMES = ['PAN Card', 'Aadhaar Card', 'Selfie Verification', 'Bank Statement', 'Address Proof'];
const STEP_INDICATOR_LABELS = ['PAN', 'Aadhaar', 'Selfie', 'Bank', 'Address'];
const STEP_ICONS = ['card-account-details-outline', 'card-account-details', 'face-recognition', 'bank-outline', 'map-marker-outline'];

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const ADDRESS_DOC_OPTIONS: { label: string; value: AddressDocType }[] = [
  { label: 'Utility Bill', value: 'utility_bill' },
  { label: 'Rent Agreement', value: 'rent_agreement' },
  { label: 'Passport', value: 'passport' },
  { label: 'Voter ID', value: 'voter_id' },
];

// ---------- Selfie Scan Line Component ----------
const ScanLine = memo(({ imageHeight, color }: { imageHeight: number; color: string }) => {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withTiming(imageHeight, { duration: 2000 }),
      -1,
      true,
    );
  }, [imageHeight, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

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
        animatedStyle,
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
        pressed && { opacity: 0.7 },
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
    (
      onCamera: () => void,
      onGallery: () => void,
    ) => (
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
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={[styles.imagePreviewContainer, { borderColor: colors.success }]}>
          <Image
            source={{ uri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
          <View style={[styles.imagePreviewBadge, { backgroundColor: colors.successMuted }]}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.imagePreviewBadgeText, { color: colors.success }]}>
              Uploaded
            </Text>
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
      </Animated.View>
    ),
    [colors.success, colors.successMuted],
  );

  // ===================== VIEW: OVERVIEW =====================
  const renderOverview = () => {
    const { overallStatus } = kycStore;

    const statusConfig: Record<
      string,
      { bg: string; text: string; icon: string; label: string; description: string }
    > = {
      verified: {
        bg: colors.successMuted,
        text: colors.success,
        icon: 'shield-check',
        label: 'KYC Verified',
        description: 'Your identity has been verified successfully.',
      },
      under_review: {
        bg: colors.warningMuted,
        text: colors.warning,
        icon: 'clock-outline',
        label: 'Under Review',
        description: 'Your documents are being reviewed. This usually takes 24-48 hours.',
      },
      rejected: {
        bg: colors.errorMuted,
        text: colors.error,
        icon: 'alert-circle',
        label: 'Verification Rejected',
        description: 'Some documents were rejected. Please re-upload them.',
      },
      not_started: {
        bg: colors.infoMuted,
        text: colors.info,
        icon: 'information',
        label: 'Verification Pending',
        description: 'Complete your KYC to access all features.',
      },
      in_progress: {
        bg: colors.infoMuted,
        text: colors.info,
        icon: 'information',
        label: 'In Progress',
        description: 'Continue your verification to unlock all features.',
      },
    };

    const config = statusConfig[overallStatus] || statusConfig.not_started;

    const getStepCircleStyle = (status: string) => {
      switch (status) {
        case 'completed':
          return { backgroundColor: colors.success };
        case 'in_progress':
          return { backgroundColor: colors.warning };
        case 'rejected':
          return { backgroundColor: colors.error };
        default:
          return { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.border };
      }
    };

    const getStepLineStyle = (status: string) => {
      switch (status) {
        case 'completed':
          return { backgroundColor: colors.success };
        case 'in_progress':
          return { backgroundColor: colors.warning, borderStyle: 'dashed' as const };
        default:
          return { backgroundColor: colors.border, borderStyle: 'dashed' as const };
      }
    };

    const getStepStatusText = (status: string) => {
      switch (status) {
        case 'completed':
          return { text: 'Completed', color: colors.success };
        case 'in_progress':
          return { text: 'In Progress', color: colors.warning };
        case 'rejected':
          return { text: 'Rejected', color: colors.error };
        default:
          return { text: 'Not Started', color: colors.textMuted };
      }
    };

    return (
      <View style={styles.viewContainer}>
        {/* Status Banner */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={[
            styles.statusBanner,
            { backgroundColor: config.bg },
          ]}
        >
          <View style={styles.statusRow}>
            <View style={[styles.statusIconCircle, { backgroundColor: `${config.text}1A` }]}>
              <MaterialCommunityIcons
                name={config.icon as any}
                size={24}
                color={config.text}
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusLabel, { color: config.text }]}>
                {config.label}
              </Text>
              <Text style={[styles.statusDescription, { color: config.text }]}>
                {config.description}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Vertical Timeline */}
        <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.timelineTitle, { color: colors.textMuted }]}>
            VERIFICATION STEPS
          </Text>
          {kycStore.steps.map((step, index) => {
            const circleStyle = getStepCircleStyle(step.status);
            const lineStyle = getStepLineStyle(step.status);
            const statusText = getStepStatusText(step.status);
            const isLast = index === kycStore.steps.length - 1;
            const canNavigate =
              step.status !== 'completed' && index <= kycStore.currentStep;

            return (
              <MotiView
                key={step.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 400, delay: index * 100 }}
              >
                <Pressable
                  onPress={() => {
                    if (canNavigate) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCurrentView(`step${index + 1}` as KYCView);
                    }
                  }}
                  disabled={!canNavigate}
                  style={({ pressed }) => [
                    styles.timelineStep,
                    pressed && canNavigate && { backgroundColor: colors.surfaceHover },
                  ]}
                >
                  {/* Left Column */}
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineCircle, circleStyle]}>
                      {step.status === 'completed' ? (
                        <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                      ) : step.status === 'rejected' ? (
                        <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                      ) : (
                        <MaterialCommunityIcons
                          name={STEP_ICONS[index] as any}
                          size={14}
                          color={
                            step.status === 'in_progress'
                              ? '#FFFFFF'
                              : colors.textMuted
                          }
                        />
                      )}
                    </View>
                    {!isLast && (
                      <View style={[styles.timelineLine, lineStyle]} />
                    )}
                  </View>

                  {/* Right Column */}
                  <View style={styles.timelineRight}>
                    <Text style={[styles.timelineStepName, { color: colors.text }]}>
                      {STEP_NAMES[index]}
                    </Text>
                    <Text style={[styles.timelineStatus, { color: statusText.color }]}>
                      {statusText.text}
                    </Text>
                  </View>

                  {/* Chevron */}
                  {canNavigate && (
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.textMuted}
                    />
                  )}
                </Pressable>
              </MotiView>
            );
          })}
        </View>

        {/* Continue Button */}
        <View style={styles.bottomAction}>
          <AppButton
            title="Continue Verification"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setCurrentView(getFirstIncompleteStep());
            }}
            fullWidth
          />
        </View>
      </View>
    );
  };

  // ===================== VIEW: STEP 1 — PAN =====================
  const renderStep1 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={0} />

      <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>PAN Card Verification</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
          Enter your PAN number and upload a photo of your card
        </Text>

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
          />
        </View>

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

        <View style={styles.bottomAction}>
          <AppButton
            title="Next"
            onPress={handleStep1Next}
            fullWidth
            disabled={!panNumber || !panImage}
          />
        </View>
      </Animated.View>
    </View>
  );

  // ===================== VIEW: STEP 2 — AADHAAR =====================
  const renderStep2 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={1} />

      <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Aadhaar Card Verification</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
          Enter your Aadhaar number and upload both sides
        </Text>

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
          />
        </View>

        {/* Front Side */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>FRONT SIDE</Text>
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

        {/* Back Side */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 8 }]}>
          BACK SIDE
        </Text>
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

        <View style={styles.bottomAction}>
          <AppButton
            title="Next"
            onPress={handleStep2Next}
            fullWidth
            disabled={!aadhaarNumber || !aadhaarFront || !aadhaarBack}
          />
        </View>
      </Animated.View>
    </View>
  );

  // ===================== VIEW: STEP 3 — SELFIE =====================
  const renderStep3 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={2} />

      <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Selfie Verification</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
          Take a clear selfie for identity matching
        </Text>

        {!selfieImage ? (
          <>
            <View style={[styles.selfieCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.selfieIconCircle, { backgroundColor: colors.primaryMuted }]}>
                <MaterialCommunityIcons
                  name="face-recognition"
                  size={40}
                  color={colors.primary}
                />
              </View>

              <View style={styles.tipsContainer}>
                {[
                  { icon: 'lightbulb-on-outline', text: 'Good lighting', color: colors.warning },
                  { icon: 'glasses', text: 'Remove glasses', color: colors.info },
                  { icon: 'camera-front', text: 'Face camera directly', color: colors.success },
                ].map((tip) => (
                  <View key={tip.text} style={styles.tipRow}>
                    <View style={[styles.tipIconCircle, { backgroundColor: `${tip.color}1A` }]}>
                      <MaterialCommunityIcons name={tip.icon as any} size={16} color={tip.color} />
                    </View>
                    <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                      {tip.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <AppButton
              title="Take Selfie"
              onPress={async () => {
                const uri = await pickFromCamera(ImagePicker.CameraType.front);
                if (uri) setSelfieImage(uri);
              }}
              fullWidth
            />
          </>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.selfiePreviewContainer}>
            <View style={[styles.selfiePreviewWrapper, { borderColor: colors.primary }]}>
              <Image
                source={{ uri: selfieImage }}
                style={styles.selfiePreview}
                resizeMode="cover"
              />
              <ScanLine imageHeight={200} color={colors.primary} />
            </View>

            <View style={styles.previewActions}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <AppButton
                  title="Retake"
                  variant="secondary"
                  onPress={() => setSelfieImage(undefined)}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <AppButton
                  title="Confirm"
                  variant="primary"
                  onPress={handleStep3Next}
                  fullWidth
                />
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );

  // ===================== VIEW: STEP 4 — BANK STATEMENT =====================
  const renderStep4 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={3} />

      <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Upload Bank Statement</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
          Last 3 months statement in PDF format
        </Text>

        <Pressable
          onPress={handlePickDocument}
          style={({ pressed }) => [
            styles.documentUploadCard,
            {
              borderColor: bankStatement ? colors.success : colors.border,
              backgroundColor: bankStatement ? colors.successMuted : colors.surface,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          {!bankStatement ? (
            <View style={styles.documentUploadContent}>
              <View style={[styles.docIconCircle, { backgroundColor: colors.errorMuted }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={28} color={colors.error} />
              </View>
              <Text style={[styles.documentUploadText, { color: colors.text }]}>
                Tap to upload PDF
              </Text>
              <Text style={[styles.documentUploadHint, { color: colors.textMuted }]}>
                Max file size: 10MB
              </Text>
            </View>
          ) : (
            <View style={styles.documentUploadContent}>
              <View style={[styles.docIconCircle, { backgroundColor: colors.successMuted }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={28} color={colors.success} />
              </View>
              <Text
                style={[styles.documentUploadText, { color: colors.text }]}
                numberOfLines={1}
              >
                {bankStatementName || 'Document uploaded'}
              </Text>
              <MaterialCommunityIcons
                name="check-circle"
                size={22}
                color={colors.success}
                style={{ marginTop: 4 }}
              />
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
          <AppButton
            title="Next"
            onPress={handleStep4Next}
            fullWidth
            disabled={!bankStatement}
          />
        </View>
      </Animated.View>
    </View>
  );

  // ===================== VIEW: STEP 5 — ADDRESS =====================
  const renderStep5 = () => (
    <View style={styles.viewContainer}>
      <StepIndicator steps={STEP_INDICATOR_LABELS} currentStep={4} />

      <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Address Proof</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
          Select document type and provide your address
        </Text>

        {/* Document Type Selector */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DOCUMENT TYPE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipRowContent}
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

        {/* Upload Section */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 12 }]}>
          UPLOAD DOCUMENT
        </Text>
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

        {/* Address Form */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 8 }]}>
          ADDRESS DETAILS
        </Text>

        <View style={[styles.addressFormCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppInput
            label="Address Line 1 *"
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="House no, Street name"
          />

          <View style={styles.addressFieldGap} />
          <AppInput
            label="Address Line 2"
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Area, Landmark"
          />

          <View style={styles.addressFieldGap} />
          <AppInput
            label="Pincode *"
            value={pincode}
            onChangeText={handlePincodeChange}
            keyboardType="numeric"
            maxLength={6}
            placeholder="6-digit pincode"
          />

          <View style={styles.addressFieldGap} />
          <View style={styles.cityStateRow}>
            <View style={styles.cityStateField}>
              <AppInput
                label="City *"
                value={city}
                onChangeText={setCity}
                placeholder="City"
              />
            </View>
            <View style={styles.cityStateGap} />
            <View style={styles.cityStateField}>
              <AppInput
                label="State *"
                value={stateName}
                onChangeText={setStateName}
                placeholder="State"
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomAction}>
          <AppButton
            title="Submit KYC"
            onPress={handleStep5Submit}
            fullWidth
            disabled={
              !selectedDocType ||
              !addressDocImage ||
              !addressLine1.trim() ||
              !city.trim() ||
              !stateName.trim() ||
              pincode.length !== 6
            }
          />
        </View>
      </Animated.View>
    </View>
  );

  // ===================== VIEW: COMPLETE =====================
  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <MotiView
        from={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' as const, damping: 10 }}
      >
        <View style={[styles.checkCircleOuter, { backgroundColor: colors.successMuted }]}>
          <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
            <MaterialCommunityIcons name="check" size={36} color="#FFFFFF" />
          </View>
        </View>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 300 }}
      >
        <Text style={[styles.completeTitle, { color: colors.text }]}>
          KYC Submitted Successfully!
        </Text>
        <Text style={[styles.completeSubtitle, { color: colors.textSecondary }]}>
          Your documents are under review. This usually takes 24-48 hours. We'll notify you once verified.
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 600 }}
        style={styles.completeInfoCard}
      >
        <View style={[styles.completeInfo, { backgroundColor: colors.infoMuted }]}>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.info} />
          <Text style={[styles.completeInfoText, { color: colors.info }]}>
            You can check your verification status anytime from the Profile screen.
          </Text>
        </View>
      </MotiView>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 600 }}
        style={styles.completeButton}
      >
        <AppButton
          title="Back to Profile"
          onPress={() => navigation.navigate('Profile')}
          fullWidth
        />
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Status Banner
  statusBanner: {
    padding: 18,
    marginBottom: 20,
    borderRadius: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  statusLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
    opacity: 0.85,
  },

  // Timeline
  timelineCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 8,
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderRadius: 12,
    paddingRight: 4,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32,
  },
  timelineCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    marginLeft: 16,
    paddingVertical: 12,
  },
  timelineStepName: {
    fontSize: 15,
    fontWeight: '600',
  },
  timelineStatus: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },

  // Step Content
  stepContent: {
    marginTop: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
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

  // Upload Row
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

  // Image Preview
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

  // Selfie
  selfieCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  selfieIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tipsContainer: {
    width: '100%',
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginBottom: 20,
    borderWidth: 3,
  },
  selfiePreview: {
    width: '100%',
    height: '100%',
  },

  // Document Upload (Step 4)
  documentUploadCard: {
    height: 160,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  documentUploadContent: {
    alignItems: 'center',
    gap: 4,
  },
  docIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  documentUploadText: {
    fontSize: 15,
    fontWeight: '600',
    maxWidth: SCREEN_WIDTH - 80,
  },
  documentUploadHint: {
    fontSize: 12,
  },

  // Chip Row (Step 5)
  chipRow: {
    marginBottom: 8,
  },
  chipRowContent: {
    paddingRight: 16,
  },

  // Address Form
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

  // Bottom Action
  bottomAction: {
    marginTop: 24,
    marginBottom: 32,
  },

  // Complete View
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  checkCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 28,
    letterSpacing: 0.2,
  },
  completeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  completeInfoCard: {
    width: '100%',
    marginTop: 24,
  },
  completeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  completeInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  completeButton: {
    marginTop: 28,
    width: '100%',
  },
});

export default KYCScreen;
