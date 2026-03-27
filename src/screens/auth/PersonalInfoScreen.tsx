import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from '../../utils/MotiCompat';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema } from '../../utils/validators';
import AppInput from '../../components/ui/AppInput';
import { useResponsive } from '../../utils/responsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'PersonalInfo'>;

type Gender = 'Male' | 'Female' | 'Other';

interface PersonalInfoFormData {
  name: string;
  email: string;
  dob: string;
  gender: Gender;
}

const GENDER_OPTIONS: { label: Gender; icon: string }[] = [
  { label: 'Male', icon: 'gender-male' },
  { label: 'Female', icon: 'gender-female' },
  { label: 'Other', icon: 'gender-non-binary' },
];

const CONFETTI_COLORS = [
  '#C8850A', '#E8A830', '#FFD700', '#22C55E',
  '#3B82F6', '#A06D08', '#F5C542', '#FFA500',
];

// Confetti particle
const ConfettiParticle: React.FC<{
  x: number;
  delay: number;
  size: number;
  color: string;
  screenHeight: number;
}> = ({ x, delay, size, color, screenHeight }) => (
  <MotiView
    from={{ translateY: -20, opacity: 1 }}
    animate={{ translateY: screenHeight + 20, opacity: 0 }}
    transition={{ type: 'timing' as const, duration: 2000, delay }}
    style={[
      styles.confettiParticle,
      {
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      },
    ]}
  />
);

const PersonalInfoScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { s, isTablet, width, height } = useResponsive();
  const completeProfile = useAuthStore((state) => state.completeProfile);

  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: '',
      email: '',
      dob: '',
      gender: undefined,
    },
  });

  const confettiParticles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      delay: Math.random() * 600,
      size: 5 + Math.random() * 7,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }));
  }, [width]);

  const formatDateInput = useCallback((text: string): string => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '/' + digits.slice(4, 8);
    return formatted;
  }, []);

  const onSubmit = useCallback(
    async (data: PersonalInfoFormData) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);

      try {
        await completeProfile(data);
        setShowConfetti(true);
        setTimeout(() => {
          // authStore sets isAuthenticated + profileComplete = true
          // RootNavigator handles navigation to MainTab
        }, 2000);
      } catch {
        setLoading(false);
      }
    },
    [completeProfile],
  );

  const renderField = (
    name: 'name' | 'email' | 'dob',
    label: string,
    icon: string,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'number-pad' = 'default',
    delayMs: number = 0,
    extra?: {
      autoCapitalize?: 'none' | 'words';
      maxLength?: number;
      formatter?: (text: string) => string;
    },
  ) => (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing' as const, duration: 400, delay: delayMs }}
    >
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label={label}
            value={value}
            onChangeText={(text) =>
              onChange(extra?.formatter ? extra.formatter(text) : text)
            }
            onFocus={() => setFocusedField(name)}
            onBlur={() => {
              setFocusedField(null);
              onBlur();
            }}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoCapitalize={extra?.autoCapitalize ?? 'sentences'}
            maxLength={extra?.maxLength}
            leftIcon={<MaterialCommunityIcons name={icon as any} size={18} />}
            error={errors[name]?.message}
          />
        )}
      />
    </MotiView>
  );

  const TOTAL_STEPS = 4;
  const CURRENT_STEP = 4;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dark header */}
      <LinearGradient
        colors={['#0B1426', '#162240']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={({ pressed }) => [
                styles.backButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </Pressable>

            {/* Step indicator */}
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>
                Step {CURRENT_STEP} of {TOTAL_STEPS}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` },
              ]}
            />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing' as const, duration: 400 }}
            style={styles.headerContent}
          >
            <Text style={styles.headerTitle}>Almost there!</Text>
            <Text style={styles.headerSubtitle}>
              Tell us a little about yourself to get started
            </Text>
          </MotiView>
        </SafeAreaView>

        <View style={styles.headerDecor} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing' as const, duration: 400, delay: 100 }}
          style={styles.avatarSection}
        >
          <View style={styles.avatarOuter}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primaryMuted }]}>
              <MaterialCommunityIcons
                name="account"
                size={36}
                color={colors.primary}
              />
            </View>
            <Pressable
              hitSlop={8}
              style={[styles.cameraButton, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="camera" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>
            Add a photo
          </Text>
        </MotiView>

        {/* Form Fields */}
        {renderField('name', 'Full Name', 'account-outline', 'John Doe', 'default', 200, {
          autoCapitalize: 'words',
        })}
        {renderField('email', 'Email Address', 'email-outline', 'john@example.com', 'email-address', 300, {
          autoCapitalize: 'none',
        })}
        {renderField('dob', 'Date of Birth', 'calendar-outline', 'DD/MM/YYYY', 'number-pad', 400, {
          maxLength: 10,
          formatter: formatDateInput,
        })}

        {/* Gender */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing' as const, duration: 400, delay: 500 }}
          style={{ marginBottom: 16 }}
        >
          <Text style={[styles.genderLabel, { color: colors.textSecondary }]}>Gender</Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((option) => {
                  const isSelected = value === option.label;
                  return (
                    <Pressable
                      key={option.label}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onChange(option.label);
                      }}
                      style={({ pressed }) => [
                        styles.genderChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primaryMuted
                            : colors.inputBg,
                          borderColor: isSelected ? colors.primary : colors.inputBorder,
                        },
                        pressed && { transform: [{ scale: 0.97 }] },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={option.icon as any}
                        size={18}
                        color={isSelected ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.genderChipText,
                          {
                            color: isSelected ? colors.primary : colors.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
          {errors.gender && (
            <View style={styles.genderErrorRow}>
              <MaterialCommunityIcons name="alert-circle" size={13} color={colors.error} />
              <Text style={[styles.genderErrorText, { color: colors.error }]}>
                {errors.gender.message}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Submit Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing' as const, duration: 400, delay: 600 }}
          style={styles.submitWrapper}
        >
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            style={({ pressed }) => [
              styles.submitPressable,
              { opacity: loading ? 0.6 : pressed ? 0.9 : 1 },
            ]}
          >
            <LinearGradient
              colors={['#C8850A', '#E8A830']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <MotiView
                  from={{ rotate: '0deg' }}
                  animate={{ rotate: '360deg' }}
                  transition={{ loop: true, type: 'timing' as const, duration: 800 }}
                >
                  <MaterialCommunityIcons name="loading" size={22} color="#FFFFFF" />
                </MotiView>
              ) : (
                <View style={styles.submitContent}>
                  <Text style={styles.submitText}>Complete Setup</Text>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              )}
            </LinearGradient>
          </Pressable>

          {/* Why we need this */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color={colors.textMuted}
            />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              This information helps us personalize your experience
            </Text>
          </View>
        </MotiView>
      </ScrollView>

      {/* Confetti Overlay */}
      {showConfetti && (
        <View style={styles.confettiOverlay} pointerEvents="none">
          {confettiParticles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              x={particle.x}
              delay={particle.delay}
              size={particle.size}
              color={particle.color}
              screenHeight={height}
            />
          ))}
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' as const, delay: 300 }}
            style={styles.celebrationCenter}
          >
            <View style={styles.celebrationIconBg}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={72}
                color="#22C55E"
              />
            </View>
            <Text style={styles.celebrationText}>Profile Complete!</Text>
            <Text style={styles.celebrationSubtext}>
              Setting up your account...
            </Text>
          </MotiView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Header */
  headerGradient: {
    paddingBottom: 24,
    overflow: 'hidden',
  },
  headerSafe: {
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    backgroundColor: 'rgba(232,168,48,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    color: '#E8A830',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E8A830',
    borderRadius: 2,
  },
  headerContent: {
    marginTop: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
  headerDecor: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(200,133,10,0.04)',
    top: -30,
    right: -40,
  },

  /* Scroll */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarOuter: {
    position: 'relative',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },

  /* Gender label */
  genderLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  genderErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingLeft: 2,
  },
  genderErrorText: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* Gender */
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  genderChipText: {
    fontSize: 14,
  },

  /* Submit */
  submitWrapper: {
    marginTop: 8,
  },
  submitPressable: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#C8850A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  submitGradient: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
  },

  /* Confetti */
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  confettiParticle: {
    position: 'absolute',
    top: 0,
  },
  celebrationCenter: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  celebrationIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  celebrationSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginTop: 6,
  },
});

export default PersonalInfoScreen;
