import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MotiView } from '../../utils/MotiCompat';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../hooks/useTheme';
import { ApplyStackParamList } from '../../types/navigation';
import { useLoanApplicationStore } from '../../store/loanApplicationStore';
import { calculateEMI } from '../../utils/emiCalculator';
import { formatCurrency } from '../../utils/formatCurrency';

import ScreenWrapper from '../../components/layout/ScreenWrapper';
import AppCard from '../../components/ui/AppCard';
import AppChip from '../../components/ui/AppChip';
import AppBadge from '../../components/ui/AppBadge';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSlider from '../../components/ui/AppSlider';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import StepIndicator from '../../components/shared/StepIndicator';

import type { LoanType } from '../../types/loan';

type Props = NativeStackScreenProps<ApplyStackParamList, 'LoanApplication'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = ['Loan Type', 'Amount', 'Details', 'Review', 'Submit'];

// --- Loan Type Config ---

interface LoanTypeOption {
  key: LoanType;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  bg: string;
}

const LOAN_TYPES: LoanTypeOption[] = [
  { key: 'personal', label: 'Personal Loan', icon: 'wallet', color: '#C8850A', bg: 'rgba(200,133,10,0.12)' },
  { key: 'business', label: 'Business Loan', icon: 'briefcase', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'education', label: 'Education Loan', icon: 'school', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'medical', label: 'Medical Loan', icon: 'hospital-box', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { key: 'home_renovation', label: 'Home Renovation', icon: 'home', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { key: 'vehicle', label: 'Vehicle Loan', icon: 'car', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
];

// --- Quick Amount & Tenure Options ---

const QUICK_AMOUNTS = [
  { label: '\u20B950K', value: 50000 },
  { label: '\u20B91L', value: 100000 },
  { label: '\u20B92L', value: 200000 },
  { label: '\u20B95L', value: 500000 },
  { label: '\u20B910L', value: 1000000 },
];

const TENURE_OPTIONS = [
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: '12M', value: 12 },
  { label: '18M', value: 18 },
  { label: '24M', value: 24 },
  { label: '36M', value: 36 },
];

const EMPLOYMENT_TYPES: {
  key: 'salaried' | 'self_employed' | 'business_owner';
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { key: 'salaried', label: 'Salaried', icon: 'badge-account-horizontal' },
  { key: 'self_employed', label: 'Self-Employed', icon: 'account-tie' },
  { key: 'business_owner', label: 'Business Owner', icon: 'domain' },
];

const RESIDENTIAL_OPTIONS: {
  key: 'owned' | 'rented' | 'family';
  label: string;
}[] = [
  { key: 'owned', label: 'Owned' },
  { key: 'rented', label: 'Rented' },
  { key: 'family', label: 'Family-Owned' },
];

// --- Loan Type Label Map ---

const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  personal: 'Personal Loan',
  business: 'Business Loan',
  education: 'Education Loan',
  medical: 'Medical Loan',
  home_renovation: 'Home Renovation',
  vehicle: 'Vehicle Loan',
};

// --- Main Screen ---

const LoanApplicationScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const currentStep = useLoanApplicationStore((s) => s.currentStep);
  const application = useLoanApplicationStore((s) => s.application);
  const referenceId = useLoanApplicationStore((s) => s.referenceId);
  const setStep = useLoanApplicationStore((s) => s.setStep);
  const updateApplication = useLoanApplicationStore((s) => s.updateApplication);
  const submitApplication = useLoanApplicationStore((s) => s.submitApplication);
  const resetApplication = useLoanApplicationStore((s) => s.resetApplication);

  // Local state for checkboxes on review step
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  // EMI calculation
  const emiResult = useMemo(
    () => calculateEMI(application.amount, application.interestRate, application.tenure),
    [application.amount, application.interestRate, application.tenure],
  );

  // --- Navigation Handlers ---

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0:
        return application.loanType !== null;
      case 1:
        return application.amount >= 10000 && application.tenure >= 3;
      case 2:
        return application.employmentType !== null && application.residentialStatus !== null;
      case 3:
        return termsAccepted && consentAccepted;
      default:
        return false;
    }
  }, [currentStep, application, termsAccepted, consentAccepted]);

  const handleNext = useCallback(async () => {
    if (!canGoNext) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep === 3) {
      // Submit
      submitApplication();
      setStep(4);
    } else {
      setStep(currentStep + 1);
    }
  }, [canGoNext, currentStep, setStep, submitApplication]);

  const handleBack = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  }, [currentStep, setStep]);

  const handleGoHome = useCallback(() => {
    resetApplication();
    navigation.goBack();
  }, [navigation, resetApplication]);

  // --- Step 0: Loan Type ---

  const renderStep0 = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        What do you need the loan for?
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Select the type of loan that best fits your needs
      </Text>
      <View style={styles.typeGrid}>
        {LOAN_TYPES.map((type, index) => {
          const isSelected = application.loanType === type.key;
          return (
            <MotiView
              key={type.key}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300, delay: index * 60 }}
              style={styles.typeCardWrapper}
            >
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateApplication({ loanType: type.key });
                }}
                style={[
                  styles.typeCard,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected
                      ? 'rgba(200,133,10,0.12)'
                      : colors.card,
                    shadowColor: '#000',
                  },
                  isSelected && styles.typeCardSelected,
                ]}
              >
                {isSelected && (
                  <View style={styles.typeCardCheckmark}>
                    <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.typeIconCircle,
                    { backgroundColor: isSelected ? type.color + '25' : type.bg },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={26}
                    color={type.color}
                  />
                </View>
                <Text
                  style={[
                    styles.typeCardLabel,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            </MotiView>
          );
        })}
      </View>
    </MotiView>
  );

  // --- Step 1: Amount & Tenure ---

  const renderStep1 = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      {/* Amount display */}
      <View style={[styles.amountDisplay, { backgroundColor: colors.surface }]}>
        <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
          Loan Amount
        </Text>
        <AnimatedCounter
          value={application.amount}
          prefix={'\u20B9'}
          style={[styles.amountText, { color: colors.text }]}
        />
      </View>

      {/* Slider */}
      <View style={styles.sliderSection}>
        <AppSlider
          min={10000}
          max={1000000}
          value={application.amount}
          step={5000}
          onValueChange={(val) => updateApplication({ amount: val })}
          formatLabel={(val) => formatCurrency(val)}
        />
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>
            {'\u20B9'}10,000
          </Text>
          <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>
            {'\u20B9'}10,00,000
          </Text>
        </View>
      </View>

      {/* Quick select chips */}
      <Text style={[styles.chipSectionLabel, { color: colors.textSecondary }]}>
        Quick Select
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickAmountRow}
      >
        {QUICK_AMOUNTS.map((qa) => (
          <View key={qa.value} style={styles.quickChipWrapper}>
            <AppChip
              label={qa.label}
              selected={application.amount === qa.value}
              onPress={() => updateApplication({ amount: qa.value })}
            />
          </View>
        ))}
      </ScrollView>

      {/* Tenure section */}
      <View style={styles.tenureSection}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Repayment Period
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tenureRow}
        >
          {TENURE_OPTIONS.map((t) => (
            <View key={t.value} style={styles.quickChipWrapper}>
              <AppChip
                label={t.label}
                selected={application.tenure === t.value}
                onPress={() => updateApplication({ tenure: t.value })}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* EMI Preview */}
      <View style={[styles.emiPreviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient
          colors={['rgba(200,133,10,0.08)', 'rgba(200,133,10,0.02)']}
          style={styles.emiPreviewGradient}
        >
          <Text style={[styles.emiPreviewLabel, { color: colors.textMuted }]}>
            Estimated Monthly EMI
          </Text>
          <AnimatedCounter
            value={emiResult.emi}
            prefix={'\u20B9'}
            style={[styles.emiPreviewValue, { color: colors.primary }]}
          />
        </LinearGradient>

        <View style={[styles.emiPreviewDetails, { borderTopColor: colors.border }]}>
          <View style={styles.emiDetailItem}>
            <Text style={[styles.emiDetailLabel, { color: colors.textMuted }]}>
              Interest Rate
            </Text>
            <Text style={[styles.emiDetailValue, { color: colors.text }]}>
              {application.interestRate}% p.a.
            </Text>
          </View>
          <View style={[styles.emiDetailDivider, { backgroundColor: colors.border }]} />
          <View style={styles.emiDetailItem}>
            <Text style={[styles.emiDetailLabel, { color: colors.textMuted }]}>
              Total Interest
            </Text>
            <Text style={[styles.emiDetailValue, { color: colors.text }]}>
              {formatCurrency(emiResult.totalInterest)}
            </Text>
          </View>
          <View style={[styles.emiDetailDivider, { backgroundColor: colors.border }]} />
          <View style={styles.emiDetailItem}>
            <Text style={[styles.emiDetailLabel, { color: colors.textMuted }]}>
              Total Payable
            </Text>
            <Text style={[styles.emiDetailValue, { color: colors.text }]}>
              {formatCurrency(emiResult.totalPayable)}
            </Text>
          </View>
        </View>

        {/* Principal vs Interest bar */}
        <View style={styles.breakdownSection}>
          <View style={styles.breakdownBar}>
            <View
              style={[
                styles.breakdownPrincipal,
                {
                  flex: application.amount,
                  backgroundColor: '#C8850A',
                },
              ]}
            />
            <View
              style={[
                styles.breakdownInterest,
                {
                  flex: emiResult.totalInterest || 1,
                  backgroundColor: colors.textMuted,
                },
              ]}
            />
          </View>
          <View style={styles.breakdownLabels}>
            <View style={styles.breakdownLabelRow}>
              <View style={[styles.breakdownDot, { backgroundColor: '#C8850A' }]} />
              <Text style={[styles.breakdownLabelText, { color: colors.textSecondary }]}>
                Principal ({Math.round((application.amount / (emiResult.totalPayable || 1)) * 100)}%)
              </Text>
            </View>
            <View style={styles.breakdownLabelRow}>
              <View style={[styles.breakdownDot, { backgroundColor: colors.textMuted }]} />
              <Text style={[styles.breakdownLabelText, { color: colors.textSecondary }]}>
                Interest ({Math.round((emiResult.totalInterest / (emiResult.totalPayable || 1)) * 100)}%)
              </Text>
            </View>
          </View>
        </View>
      </View>
    </MotiView>
  );

  // --- Step 2: Employment & Personal Details ---

  const renderStep2 = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      {/* Employment Type */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>
        Employment Type
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {EMPLOYMENT_TYPES.map((et) => (
          <View key={et.key} style={styles.quickChipWrapper}>
            <AppChip
              label={et.label}
              selected={application.employmentType === et.key}
              onPress={() => updateApplication({ employmentType: et.key })}
            />
          </View>
        ))}
      </ScrollView>

      {/* Conditional Fields */}
      {application.employmentType === 'salaried' && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 100 }}
        >
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppInput
              label="Company Name"
              value={application.companyName}
              onChangeText={(text) => updateApplication({ companyName: text })}
              placeholder="Enter company name"
            />
            <AppInput
              label="Designation"
              value={application.designation}
              onChangeText={(text) => updateApplication({ designation: text })}
              placeholder="Enter designation"
            />
            <AppInput
              label="Monthly Salary"
              value={application.monthlyIncome > 0 ? String(application.monthlyIncome) : ''}
              onChangeText={(text) => updateApplication({ monthlyIncome: Number(text) || 0 })}
              placeholder="Enter monthly salary"
              keyboardType="numeric"
            />
            <AppInput
              label="Experience (years)"
              value={application.experience > 0 ? String(application.experience) : ''}
              onChangeText={(text) => updateApplication({ experience: Number(text) || 0 })}
              placeholder="Years of experience"
              keyboardType="numeric"
            />
          </View>
        </MotiView>
      )}

      {application.employmentType === 'self_employed' && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 100 }}
        >
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppInput
              label="Business Name"
              value={application.businessName}
              onChangeText={(text) => updateApplication({ businessName: text })}
              placeholder="Enter business name"
            />
            <AppInput
              label="Business Type"
              value={application.businessType}
              onChangeText={(text) => updateApplication({ businessType: text })}
              placeholder="Enter business type"
            />
            <AppInput
              label="Monthly Income"
              value={application.monthlyIncome > 0 ? String(application.monthlyIncome) : ''}
              onChangeText={(text) => updateApplication({ monthlyIncome: Number(text) || 0 })}
              placeholder="Enter monthly income"
              keyboardType="numeric"
            />
            <AppInput
              label="Years in Business"
              value={application.yearsInBusiness > 0 ? String(application.yearsInBusiness) : ''}
              onChangeText={(text) => updateApplication({ yearsInBusiness: Number(text) || 0 })}
              placeholder="Years in business"
              keyboardType="numeric"
            />
          </View>
        </MotiView>
      )}

      {application.employmentType === 'business_owner' && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 100 }}
        >
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppInput
              label="Company Name"
              value={application.companyName}
              onChangeText={(text) => updateApplication({ companyName: text })}
              placeholder="Enter company name"
            />
            <AppInput
              label="Industry"
              value={application.businessType}
              onChangeText={(text) => updateApplication({ businessType: text })}
              placeholder="Enter industry"
            />
            <AppInput
              label="Annual Turnover"
              value={application.annualTurnover > 0 ? String(application.annualTurnover) : ''}
              onChangeText={(text) => updateApplication({ annualTurnover: Number(text) || 0 })}
              placeholder="Enter annual turnover"
              keyboardType="numeric"
            />
            <AppInput
              label="Years in Operation"
              value={application.yearsInBusiness > 0 ? String(application.yearsInBusiness) : ''}
              onChangeText={(text) => updateApplication({ yearsInBusiness: Number(text) || 0 })}
              placeholder="Years in operation"
              keyboardType="numeric"
            />
          </View>
        </MotiView>
      )}

      {/* Residential Status */}
      <View style={styles.residentialSection}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Residential Status
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {RESIDENTIAL_OPTIONS.map((ro) => (
            <View key={ro.key} style={styles.quickChipWrapper}>
              <AppChip
                label={ro.label}
                selected={application.residentialStatus === ro.key}
                onPress={() => updateApplication({ residentialStatus: ro.key })}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Financial Inputs */}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.formCardTitle, { color: colors.text }]}>
          Financial Information
        </Text>
        <AppInput
          label="Monthly Expenses"
          value={application.monthlyExpenses > 0 ? String(application.monthlyExpenses) : ''}
          onChangeText={(text) => updateApplication({ monthlyExpenses: Number(text) || 0 })}
          placeholder="Enter monthly expenses"
          keyboardType="numeric"
        />
        <AppInput
          label="Existing EMI Obligations"
          value={application.existingEmi > 0 ? String(application.existingEmi) : ''}
          onChangeText={(text) => updateApplication({ existingEmi: Number(text) || 0 })}
          placeholder="Enter existing EMI amount"
          keyboardType="numeric"
        />
      </View>
    </MotiView>
  );

  // --- Step 3: Review & Confirm ---

  const renderStep3 = () => {
    const employmentLabel =
      application.employmentType === 'salaried'
        ? 'Salaried'
        : application.employmentType === 'self_employed'
        ? 'Self-Employed'
        : application.employmentType === 'business_owner'
        ? 'Business Owner'
        : '--';

    const residentialLabel =
      application.residentialStatus === 'owned'
        ? 'Owned'
        : application.residentialStatus === 'rented'
        ? 'Rented'
        : application.residentialStatus === 'family'
        ? 'Family-Owned'
        : '--';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Review Your Application
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Please verify all details before submitting
        </Text>

        {/* Loan Information */}
        <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reviewCardHeader}>
            <View style={styles.reviewCardTitleRow}>
              <View style={[styles.reviewCardIcon, { backgroundColor: 'rgba(200,133,10,0.12)' }]}>
                <MaterialCommunityIcons name="file-document-outline" size={14} color="#C8850A" />
              </View>
              <Text style={[styles.reviewCardTitle, { color: colors.text }]}>
                Loan Information
              </Text>
            </View>
            <Pressable
              onPress={() => setStep(0)}
              hitSlop={8}
              style={[styles.editBtn, { backgroundColor: 'rgba(200,133,10,0.12)' }]}
            >
              <MaterialCommunityIcons name="pencil" size={12} color="#C8850A" />
              <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Type</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {application.loanType ? LOAN_TYPE_LABELS[application.loanType] : '--'}
            </Text>
          </View>
          <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Amount</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {formatCurrency(application.amount)}
            </Text>
          </View>
          <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Tenure</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {application.tenure} months
            </Text>
          </View>
          <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Monthly EMI</Text>
            <Text style={[styles.reviewValueHighlight, { color: colors.primary }]}>
              {formatCurrency(emiResult.emi)}
            </Text>
          </View>
          <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Interest Rate</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {application.interestRate}% p.a.
            </Text>
          </View>
        </View>

        {/* Personal Details */}
        <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
          <View style={styles.reviewCardHeader}>
            <View style={styles.reviewCardTitleRow}>
              <View style={[styles.reviewCardIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                <MaterialCommunityIcons name="account-outline" size={14} color="#3B82F6" />
              </View>
              <Text style={[styles.reviewCardTitle, { color: colors.text }]}>
                Personal Details
              </Text>
            </View>
            <Pressable
              onPress={() => setStep(2)}
              hitSlop={8}
              style={[styles.editBtn, { backgroundColor: 'rgba(200,133,10,0.12)' }]}
            >
              <MaterialCommunityIcons name="pencil" size={12} color="#C8850A" />
              <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Employment</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {employmentLabel}
            </Text>
          </View>
          {application.companyName ? (
            <>
              <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Company</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {application.companyName}
                </Text>
              </View>
            </>
          ) : null}
          <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Residence</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {residentialLabel}
            </Text>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
          <View style={styles.reviewCardTitleRow}>
            <View style={[styles.reviewCardIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
              <MaterialCommunityIcons name="chart-bar" size={14} color="#22C55E" />
            </View>
            <Text style={[styles.reviewCardTitle, { color: colors.text }]}>
              Financial Summary
            </Text>
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Monthly Income</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {formatCurrency(application.monthlyIncome)}
            </Text>
          </View>
          <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Monthly Expenses</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {formatCurrency(application.monthlyExpenses)}
            </Text>
          </View>
          <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Existing EMIs</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {formatCurrency(application.existingEmi)}
            </Text>
          </View>
        </View>

        {/* Terms & Consent */}
        <View style={styles.checkboxSection}>
          <Pressable
            onPress={() => setTermsAccepted((prev) => !prev)}
            style={[
              styles.checkboxRow,
              {
                backgroundColor: termsAccepted ? 'rgba(200,133,10,0.08)' : colors.surface,
                borderColor: termsAccepted ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={termsAccepted ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={termsAccepted ? colors.primary : colors.textMuted}
            />
            <View style={styles.checkboxTextCol}>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                I agree to the Terms & Conditions
              </Text>
              <Pressable
                onPress={() =>
                  Toast.show({
                    type: 'info',
                    text1: 'Terms & Conditions',
                    text2: 'Terms would open here',
                  })
                }
                hitSlop={8}
              >
                <Text style={[styles.readTermsText, { color: colors.primary }]}>
                  Read Terms
                </Text>
              </Pressable>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setConsentAccepted((prev) => !prev)}
            style={[
              styles.checkboxRow,
              {
                backgroundColor: consentAccepted ? 'rgba(200,133,10,0.08)' : colors.surface,
                borderColor: consentAccepted ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={consentAccepted ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={consentAccepted ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.checkboxLabel, { color: colors.text, flex: 1, marginLeft: 12 }]}>
              I authorize LendEase to verify my credit information
            </Text>
          </Pressable>
        </View>
      </MotiView>
    );
  };

  // --- Step 4: Success ---

  const renderStep4 = () => (
    <View style={styles.successContainer}>
      {/* Check circle animation */}
      <MotiView
        from={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 8 }}
      >
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          style={styles.successCircle}
        >
          <MaterialCommunityIcons name="check" size={44} color="#FFFFFF" />
        </LinearGradient>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 300 }}
      >
        <Text style={[styles.successTitle, { color: colors.text }]}>
          Application Submitted!
        </Text>
        <Text style={[styles.successDescription, { color: colors.textSecondary }]}>
          Your loan application has been received and is being processed.
        </Text>
      </MotiView>

      {/* Reference card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 400 }}
        style={{ width: '100%' }}
      >
        <View style={[styles.refCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.refLabel, { color: colors.textMuted }]}>Reference ID</Text>
          <Text style={[styles.refId, { color: colors.primary }]}>
            {referenceId || 'LE-2026-XXXXX'}
          </Text>
          <View style={[styles.refDivider, { backgroundColor: colors.border }]} />
          <View style={styles.refTimeRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.refTimeText, { color: colors.textMuted }]}>
              Expected approval: 2-4 hours
            </Text>
          </View>
        </View>
      </MotiView>

      {/* Mini Timeline */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 500 }}
        style={styles.timelineContainer}
      >
        {[
          { label: 'Submitted', done: true, icon: 'check' as const },
          { label: 'Under Review', done: false, icon: 'file-search' as const },
          { label: 'Approved', done: false, icon: 'shield-check' as const },
          { label: 'Disbursed', done: false, icon: 'bank-transfer' as const },
        ].map((step, index) => (
          <View key={step.label} style={styles.timelineStep}>
            <View style={styles.timelineStepInner}>
              {index > 0 && (
                <View
                  style={[
                    styles.timelineConnector,
                    { backgroundColor: step.done ? '#22C55E' : colors.border },
                  ]}
                />
              )}
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor: step.done ? '#22C55E' : colors.surface,
                    borderWidth: step.done ? 0 : 2,
                    borderColor: colors.border,
                  },
                ]}
              >
                {step.done ? (
                  <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons name={step.icon} size={10} color={colors.textMuted} />
                )}
              </View>
            </View>
            <Text
              style={[
                styles.timelineLabel,
                {
                  color: step.done ? '#22C55E' : colors.textMuted,
                  fontWeight: step.done ? '600' : '400',
                },
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </MotiView>

      {/* Action Buttons */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 700 }}
        style={styles.successActions}
      >
        <LinearGradient
          colors={['#C8850A', '#E8A830']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.trackBtnGradient}
        >
          <Pressable
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Track',
                text2: 'Application tracking opening...',
              });
            }}
            style={styles.trackBtnInner}
          >
            <MaterialCommunityIcons name="radar" size={18} color="#FFFFFF" />
            <Text style={styles.trackBtnText}>Track Application</Text>
          </Pressable>
        </LinearGradient>
        <View style={styles.successBtnGap} />
        <Pressable
          onPress={handleGoHome}
          style={[styles.homeBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.homeBtnText, { color: colors.textSecondary }]}>
            Back to Home
          </Text>
        </Pressable>
      </MotiView>
    </View>
  );

  // --- Render current step ---

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  const getNextButtonTitle = () => {
    if (currentStep === 3) return 'Submit Application';
    return 'Continue';
  };

  return (
    <ScreenWrapper
      headerTitle="Apply for Loan"
      onBack={currentStep < 4 ? () => navigation.goBack() : undefined}
      scrollable={false}
    >
      {/* Step Indicator */}
      {currentStep < 4 && (
        <View style={styles.stepIndicatorWrapper}>
          <StepIndicator
            steps={STEPS}
            currentStep={currentStep}
            onStepPress={(step) => {
              if (step < currentStep) setStep(step);
            }}
          />
        </View>
      )}

      {/* Step Content */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.stepContent,
          { paddingBottom: currentStep < 4 ? insets.bottom + 110 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom Navigation */}
      {currentStep < 4 && (
        <View
          style={[
            styles.bottomNav,
            {
              paddingBottom: insets.bottom + 16,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.bottomNavRow}>
            {currentStep > 0 && (
              <View style={styles.backBtnWrapper}>
                <Pressable
                  onPress={handleBack}
                  style={[styles.backBtn, { borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textSecondary} />
                  <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>Back</Text>
                </Pressable>
              </View>
            )}
            <View style={[styles.nextBtnWrapper, currentStep === 0 && { flex: 1 }]}>
              <LinearGradient
                colors={canGoNext ? ['#C8850A', '#E8A830'] : [colors.surface, colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.nextBtnGradient, !canGoNext && { opacity: 0.5 }]}
              >
                <Pressable
                  onPress={handleNext}
                  disabled={!canGoNext}
                  style={styles.nextBtnInner}
                >
                  <Text style={[
                    styles.nextBtnText,
                    { color: canGoNext ? '#FFFFFF' : colors.textMuted },
                  ]}>
                    {getNextButtonTitle()}
                  </Text>
                  {currentStep < 3 && (
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={18}
                      color={canGoNext ? '#FFFFFF' : colors.textMuted}
                    />
                  )}
                </Pressable>
              </LinearGradient>
            </View>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  stepIndicatorWrapper: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Step titles
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  chipSectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },

  // Step 0: Loan Type Grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCardWrapper: {
    width: (SCREEN_WIDTH - 52) / 2,
  },
  typeCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  typeCardSelected: {
    borderWidth: 2,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  typeCardCheckmark: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  typeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },

  // Step 1: Amount & Tenure
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  amountText: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sliderSection: {
    marginTop: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickAmountRow: {
    marginTop: 4,
    gap: 8,
    flexDirection: 'row',
  },
  quickChipWrapper: {
    marginRight: 0,
  },
  tenureSection: {
    marginTop: 24,
  },
  tenureRow: {
    gap: 8,
    flexDirection: 'row',
  },
  chipRow: {
    gap: 8,
    flexDirection: 'row',
    marginBottom: 16,
  },

  // EMI Preview
  emiPreviewCard: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emiPreviewGradient: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emiPreviewLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  emiPreviewValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emiPreviewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emiDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  emiDetailLabel: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '500',
  },
  emiDetailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  emiDetailDivider: {
    width: 1,
    height: '100%',
  },
  breakdownSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  breakdownPrincipal: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  breakdownInterest: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  breakdownLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  breakdownLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Step 2: Details
  residentialSection: {
    marginTop: 8,
  },
  formCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Step 3: Review
  reviewCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCardIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  reviewCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewDivider: {
    height: StyleSheet.hairlineWidth,
  },
  reviewLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewValueHighlight: {
    fontSize: 15,
    fontWeight: '700',
  },
  checkboxSection: {
    marginTop: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  checkboxTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  readTermsText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  // Step 4: Success
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  successDescription: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  refCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  refLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  refId: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  refDivider: {
    height: StyleSheet.hairlineWidth,
    width: '60%',
    marginVertical: 12,
  },
  refTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refTimeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: 32,
    paddingHorizontal: 8,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  timelineStepInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timelineConnector: {
    height: 2,
    flex: 1,
    marginRight: -1,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 70,
  },
  successActions: {
    marginTop: 36,
    width: '100%',
  },
  trackBtnGradient: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  trackBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  trackBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  homeBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  successBtnGap: {
    height: 12,
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomNavRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtnWrapper: {
    flex: 0.35,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextBtnWrapper: {
    flex: 0.65,
  },
  nextBtnGradient: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 6,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LoanApplicationScreen;
