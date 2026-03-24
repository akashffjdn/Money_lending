import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from '../../utils/MotiCompat';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useForm, Controller } from 'react-hook-form';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import AppAvatar from '../../components/ui/AppAvatar';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppChip from '../../components/ui/AppChip';
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

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const authStore = useAuthStore();
  const user = authStore.user;

  const [saving, setSaving] = useState(false);

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

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        await authStore.updateProfile(data);

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---- Avatar ---- */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 350 }}
            style={styles.avatarSection}
          >
            <View style={styles.avatarRing}>
              <AppAvatar size={80} name={user?.name ?? 'U'} />
            </View>
            <Pressable
              onPress={() =>
                Toast.show({ type: 'info', text1: 'Change Photo' })
              }
              hitSlop={8}
              style={({ pressed }) => [
                styles.changePhotoBtn,
                { backgroundColor: colors.primaryMuted },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialCommunityIcons
                name="camera-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.changePhotoText, { color: colors.primary }]}>
                Change Photo
              </Text>
            </Pressable>
          </MotiView>

          {/* ---- Form Card ---- */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* ---- Full Name ---- */}
            <View style={styles.fieldWrapper}>
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
                    leftIcon={<MaterialCommunityIcons name="account-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />
            </View>

            {/* ---- Email ---- */}
            <View style={styles.fieldWrapper}>
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
                    leftIcon={<MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />
            </View>

            {/* ---- Date of Birth ---- */}
            <View style={styles.fieldWrapper}>
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
                    leftIcon={<MaterialCommunityIcons name="calendar-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />
            </View>

            {/* ---- Gender ---- */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Gender
              </Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((option) => (
                  <AppChip
                    key={option}
                    label={option}
                    selected={selectedGender === option}
                    onPress={() => setValue('gender', option)}
                  />
                ))}
              </View>
            </View>

            {/* ---- Phone (read-only) ---- */}
            <View style={styles.fieldWrapperLast}>
              <AppInput
                label="Phone"
                value={user?.phone ?? ''}
                editable={false}
                leftIcon={<MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} />}
              />
              <View style={styles.phoneHintRow}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={13}
                  color={colors.textMuted}
                />
                <Text style={[styles.phoneHint, { color: colors.textMuted }]}>
                  Phone number cannot be changed
                </Text>
              </View>
            </View>
          </MotiView>

          {/* ---- Save Button ---- */}
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            style={styles.buttonWrapper}
          >
            <AppButton
              title="Save Changes"
              onPress={handleSubmit(onSubmit)}
              loading={saving}
              variant="primary"
              fullWidth
            />
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default EditProfileScreen;

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 44,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Form Card */
  formCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 4,
  },

  /* Fields */
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldWrapperLast: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  phoneHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
    gap: 4,
  },
  phoneHint: {
    fontSize: 12,
  },

  /* Button */
  buttonWrapper: {
    marginHorizontal: 20,
    marginTop: 28,
  },
});
