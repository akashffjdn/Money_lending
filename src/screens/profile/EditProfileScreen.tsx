import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useForm, Controller } from 'react-hook-form';

import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../utils/responsive';
import { useAuthStore } from '../../store/authStore';
import AppAvatar from '../../components/ui/AppAvatar';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import { ProfileStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

interface EditProfileFormData {
  name: string;
  email: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
}

const GENDER_OPTIONS: Array<EditProfileFormData['gender']> = [
  'Male',
  'Female',
  'Other',
];

const GENDER_ICONS: Record<string, string> = {
  Male: 'gender-male',
  Female: 'gender-female',
  Other: 'gender-non-binary',
};

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, mode } = useTheme();
  const { s, isTablet } = useResponsive();
  const authStore = useAuthStore();
  const user = authStore.user;
  const isDark = mode === 'dark';

  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatar);

  const pickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Gallery permission denied' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      authStore.updateProfile({ avatar: uri });
      Toast.show({ type: 'success', text1: 'Photo updated' });
    }
  }, [authStore]);

  const pickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Camera permission denied' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      authStore.updateProfile({ avatar: uri });
      Toast.show({ type: 'success', text1: 'Photo updated' });
    }
  }, [authStore]);

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const handleChangePhoto = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      // On web, directly open gallery (camera not available)
      pickFromGallery();
    } else {
      setShowPhotoOptions(true);
    }
  }, [pickFromGallery]);

  // Entry animations
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(avatarAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      dob: user?.dob ?? '',
      gender: (user?.gender as EditProfileFormData['gender']) ?? 'Male',
    },
  });

  const selectedGender = watch('gender');

  /* ---------- Submit ---------- */
  const onSubmit = useCallback(
    async (data: EditProfileFormData) => {
      try {
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        await new Promise((resolve) => setTimeout(resolve, 500));
        await authStore.updateProfile(data);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your changes have been saved.',
        });
        navigation.goBack();
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Please try again later.',
        });
      } finally {
        setSaving(false);
      }
    },
    [authStore, navigation],
  );

  return (
    <ScreenWrapper headerTitle="Edit Profile" onBack={() => navigation.goBack()}>
      {/* ======== AVATAR SECTION ======== */}
      <Animated.View
        style={[
          styles.avatarSection,
          {
            opacity: avatarAnim,
            transform: [
              {
                scale: avatarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        {/* Gradient background circle */}
        <View style={styles.avatarBgCircle}>
          <LinearGradient
            colors={
              isDark
                ? ['#1A1408', '#111827']
                : ['#FEF3E0', '#FFF8ED']
            }
            style={styles.avatarBgGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        {/* Avatar with ring */}
        <View style={styles.avatarRingOuter}>
          <LinearGradient
            colors={['#C8850A', '#E8A830', '#C8850A']}
            style={styles.avatarGradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.avatarInnerRing, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <AppAvatar size={88} name={user?.name ?? 'U'} />
              )}
            </View>
          </LinearGradient>
        </View>

        <Pressable
          onPress={handleChangePhoto}
          hitSlop={8}
          style={({ pressed }) => [
            styles.changePhotoBtn,
            {
              backgroundColor: colors.primaryMuted,
              borderColor: colors.primary + '30',
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialCommunityIcons
            name="camera-outline"
            size={15}
            color={colors.primary}
          />
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>
            Change Photo
          </Text>
        </Pressable>
      </Animated.View>

      {/* ======== FORM ======== */}
      <Animated.View
        style={[
          {
            opacity: formAnim,
            transform: [
              {
                translateY: formAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: colors.primaryMuted }]}>
            <MaterialCommunityIcons name="account-outline" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
            Personal Information
          </Text>
        </View>

        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Full Name */}
          <Controller
            control={control}
            name="name"
            rules={{ required: 'Full name is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Full Name"
                placeholder="Enter your full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon={
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                }
              />
            )}
          />

          <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

          {/* Email */}
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Email"
                placeholder="Enter your email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                leftIcon={
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                }
              />
            )}
          />

          <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

          {/* Date of Birth */}
          <Controller
            control={control}
            name="dob"
            rules={{ required: 'Date of birth is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Date of Birth"
                placeholder="DD/MM/YYYY"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.dob?.message}
                leftIcon={
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                }
              />
            )}
          />
        </View>

        {/* ======== GENDER SECTION ======== */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: colors.primaryMuted }]}>
            <MaterialCommunityIcons name="account-group-outline" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
            Gender
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((option) => {
              const isSelected = selectedGender === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setValue('gender', option);
                  }}
                  style={({ pressed }) => [
                    styles.genderCard,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryMuted
                        : colors.surface,
                      borderColor: isSelected
                        ? colors.primary
                        : colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View
                    style={[
                      styles.genderIconCircle,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceHover,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={GENDER_ICONS[option] as any}
                      size={20}
                      color={isSelected ? '#FFFFFF' : colors.textMuted}
                    />
                  </View>
                  <Text
                    style={[
                      styles.genderLabel,
                      {
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {option}
                  </Text>
                  {isSelected && (
                    <View style={[styles.genderCheck, { backgroundColor: colors.primary }]}>
                      <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ======== PHONE SECTION ======== */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: colors.primaryMuted }]}>
            <MaterialCommunityIcons name="phone-outline" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
            Phone Number
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppInput
            label="Phone"
            value={user?.phone ?? ''}
            editable={false}
            leftIcon={
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={colors.textMuted}
              />
            }
          />
          <View style={styles.phoneHintRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color={colors.textMuted}
            />
            <Text style={[styles.phoneHint, { color: colors.textMuted }]}>
              Phone number cannot be changed
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ======== SAVE BUTTON ======== */}
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            opacity: btnAnim,
            transform: [
              {
                translateY: btnAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <AppButton
          title="Save Changes"
          onPress={handleSubmit(onSubmit)}
          loading={saving}
          variant="primary"
          fullWidth
        />
      </Animated.View>

      {/* Photo Options Bottom Sheet (mobile only) */}
      {showPhotoOptions && (
        <Pressable
          style={styles.photoOverlay}
          onPress={() => setShowPhotoOptions(false)}
        >
          <View style={[styles.photoSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.photoSheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.photoSheetTitle, { color: colors.text }]}>Change Photo</Text>

            <Pressable
              style={({ pressed }) => [styles.photoOption, pressed && { opacity: 0.6 }]}
              onPress={() => { setShowPhotoOptions(false); pickFromCamera(); }}
            >
              <View style={[styles.photoOptionIcon, { backgroundColor: colors.primaryMuted }]}>
                <MaterialCommunityIcons name="camera" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.photoOptionText, { color: colors.text }]}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.photoOption, pressed && { opacity: 0.6 }]}
              onPress={() => { setShowPhotoOptions(false); pickFromGallery(); }}
            >
              <View style={[styles.photoOptionIcon, { backgroundColor: colors.primaryMuted }]}>
                <MaterialCommunityIcons name="image" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.photoOptionText, { color: colors.text }]}>Choose from Gallery</Text>
            </Pressable>

            {avatarUri && (
              <Pressable
                style={({ pressed }) => [styles.photoOption, pressed && { opacity: 0.6 }]}
                onPress={() => {
                  setShowPhotoOptions(false);
                  setAvatarUri(undefined);
                  authStore.updateProfile({ avatar: undefined });
                  Toast.show({ type: 'info', text1: 'Photo removed' });
                }}
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="delete" size={22} color="#EF4444" />
                </View>
                <Text style={[styles.photoOptionText, { color: '#EF4444' }]}>Remove Photo</Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.photoCancelBtn,
                { backgroundColor: colors.surface },
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => setShowPhotoOptions(false)}
            >
              <Text style={[styles.photoCancelText, { color: colors.textMuted }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      )}
    </ScreenWrapper>
  );
};

export default EditProfileScreen;

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* ===== Avatar Section ===== */
  avatarSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
    position: 'relative',
  },
  avatarBgCircle: {
    position: 'absolute',
    top: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    opacity: 0.6,
  },
  avatarBgGradient: {
    width: '100%',
    height: '100%',
  },
  avatarRingOuter: {
    marginBottom: 14,
  },
  avatarGradientRing: {
    width: 102,
    height: 102,
    borderRadius: 51,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* ===== Section Headers ===== */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  /* ===== Form Card ===== */
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 8,
  },
  fieldDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
    marginHorizontal: -4,
  },

  /* ===== Gender ===== */
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    position: 'relative',
  },
  genderIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  genderLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  genderCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ===== Phone ===== */
  phoneHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
    marginLeft: 4,
    gap: 5,
  },
  phoneHint: {
    fontSize: 12,
    letterSpacing: 0.1,
  },

  /* ===== Button ===== */
  buttonWrapper: {
    marginTop: 32,
  },

  /* ===== Photo Options Sheet ===== */
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  photoSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  photoSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  photoSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  photoOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  photoCancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  photoCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
