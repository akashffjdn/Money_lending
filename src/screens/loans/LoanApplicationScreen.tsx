import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MotiView } from '../../utils/MotiCompat';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../utils/responsive';
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
import TermsSheet, { type TermsSheetRef } from '../../components/shared/TermsSheet';

import type { LoanType } from '../../types/loan';

type Props = NativeStackScreenProps<ApplyStackParamList, 'LoanApplication'>;

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
  const { s, width, isTablet, rv } = useResponsive();

  const currentStep = useLoanApplicationStore((s) => s.currentStep);
  const application = useLoanApplicationStore((s) => s.application);
  const referenceId = useLoanApplicationStore((s) => s.referenceId);
  const setStep = useLoanApplicationStore((s) => s.setStep);
  const updateApplication = useLoanApplicationStore((s) => s.updateApplication);
  const submitApplication = useLoanApplicationStore((s) => s.submitApplication);
  const resetApplication = useLoanApplicationStore((s) => s.resetApplication);

  // Terms sheet ref
  const termsSheetRef = useRef<TermsSheetRef>(null);

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
              style={[styles.typeCardWrapper, { width: (width - 52) / 2 }]}
            >
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateApplication({ loanType: type.key });
                  // Auto-advance to next step after selection
                  setTimeout(() => setStep(1), 300);
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

  const renderStep2 = () => {
    // Employment type cards with descriptions
    const empTypeCards: {
      key: 'salaried' | 'self_employed' | 'business_owner';
      label: string;
      desc: string;
      icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
      color: string;
      bg: string;
    }[] = [
      { key: 'salaried', label: 'Salaried', desc: 'Working for a company', icon: 'badge-account-horizontal', color: '#C8850A', bg: 'rgba(200,133,10,0.10)' },
      { key: 'self_employed', label: 'Self-Employed', desc: 'Freelancer or consultant', icon: 'account-tie', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
      { key: 'business_owner', label: 'Business Owner', desc: 'Own a registered business', icon: 'domain', color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
    ];

    // Residential chips
    const resChips: {
      key: 'owned' | 'rented' | 'family';
      label: string;
      icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    }[] = [
      { key: 'owned', label: 'Own House', icon: 'home' },
      { key: 'rented', label: 'Rented', icon: 'home-city-outline' },
      { key: 'family', label: 'With Family', icon: 'home-heart' },
    ];

    // Salary quick-select chips
    const salaryChips = [25000, 50000, 75000, 100000];

    return (
      <View>
        {/* Section 1: Employment Type — conversational header */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
        >
          <Text style={[styles.dtConversationalTitle, { color: colors.text }]}>
            What do you do for work?
          </Text>
          <Text style={[styles.dtConversationalSub, { color: colors.textMuted }]}>
            This helps us find the best loan options for you
          </Text>

          {/* Employment cards — vertical list with descriptions */}
          <View style={styles.dtEmpList}>
            {empTypeCards.map((et) => {
              const selected = application.employmentType === et.key;
              return (
                <Pressable
                  key={et.key}
                  onPress={() => updateApplication({ employmentType: et.key })}
                  style={({ pressed }) => [
                    styles.dtEmpCardV2,
                    {
                      backgroundColor: selected ? et.bg : colors.card,
                      borderColor: selected ? et.color : colors.border,
                      borderWidth: selected ? 1.5 : 1,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <View style={[styles.dtEmpIconCircle, { backgroundColor: selected ? et.color + '20' : colors.surface }]}>
                    <MaterialCommunityIcons name={et.icon} size={22} color={selected ? et.color : colors.textMuted} />
                  </View>
                  <View style={styles.dtEmpTextBlock}>
                    <Text style={[styles.dtEmpLabelV2, { color: selected ? et.color : colors.text }]}>
                      {et.label}
                    </Text>
                    <Text style={[styles.dtEmpDesc, { color: colors.textMuted }]}>
                      {et.desc}
                    </Text>
                  </View>
                  <View style={[
                    styles.dtEmpRadio,
                    {
                      borderColor: selected ? et.color : colors.border,
                      backgroundColor: selected ? et.color : 'transparent',
                    },
                  ]}>
                    {selected && <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        {/* Section 2: Employment Details Form — progressive reveal */}
        {application.employmentType === 'salaried' && (
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 80 }}
          >
            <View style={[styles.dtFormSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.dtFormHeader}>
                <View style={[styles.dtFormHeaderIcon, { backgroundColor: 'rgba(200,133,10,0.10)' }]}>
                  <MaterialCommunityIcons name="office-building-outline" size={14} color="#C8850A" />
                </View>
                <Text style={[styles.dtFormHeaderTitle, { color: colors.text }]}>Tell us about your job</Text>
              </View>
              <View style={[styles.dtFormDivider, { backgroundColor: colors.border }]} />
              <AppInput
                label="Company Name"
                value={application.companyName}
                onChangeText={(text) => updateApplication({ companyName: text })}
                placeholder="e.g. Infosys, TCS"
                leftIcon={<MaterialCommunityIcons name="office-building-outline" size={20} />}
              />
              <AppInput
                label="Designation"
                value={application.designation}
                onChangeText={(text) => updateApplication({ designation: text })}
                placeholder="e.g. Software Engineer"
                leftIcon={<MaterialCommunityIcons name="briefcase-outline" size={20} />}
              />
              <AppInput
                label="Monthly Salary (in-hand)"
                value={application.monthlyIncome > 0 ? String(application.monthlyIncome) : ''}
                onChangeText={(text) => updateApplication({ monthlyIncome: Number(text) || 0 })}
                placeholder="After deductions"
                keyboardType="numeric"
                leftIcon={<MaterialCommunityIcons name="currency-inr" size={20} />}
              />
              {/* Quick-select salary chips */}
              <View style={styles.dtQuickChips}>
                {salaryChips.map((val) => (
                  <Pressable
                    key={val}
                    onPress={() => updateApplication({ monthlyIncome: val })}
                    style={[
                      styles.dtQuickChip,
                      {
                        backgroundColor: application.monthlyIncome === val ? 'rgba(200,133,10,0.12)' : colors.surface,
                        borderColor: application.monthlyIncome === val ? '#C8850A' : colors.border,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.dtQuickChipText,
                      { color: application.monthlyIncome === val ? '#C8850A' : colors.textMuted },
                    ]}>
                      {val >= 100000 ? `${val / 100000}L` : `${val / 1000}K`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <AppInput
                label="Experience (years)"
                value={application.experience > 0 ? String(application.experience) : ''}
                onChangeText={(text) => updateApplication({ experience: Number(text) || 0 })}
                placeholder="e.g. 5"
                keyboardType="numeric"
                leftIcon={<MaterialCommunityIcons name="clock-outline" size={20} />}
              />
            </View>
          </MotiView>
        )}

        {application.employmentType === 'self_employed' && (
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 80 }}
          >
            <View style={[styles.dtFormSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.dtFormHeader}>
                <View style={[styles.dtFormHeaderIcon, { backgroundColor: 'rgba(59,130,246,0.10)' }]}>
                  <MaterialCommunityIcons name="store-outline" size={14} color="#3B82F6" />
                </View>
                <Text style={[styles.dtFormHeaderTitle, { color: colors.text }]}>Tell us about your work</Text>
              </View>
              <View style={[styles.dtFormDivider, { backgroundColor: colors.border }]} />
              <AppInput
                label="Business / Practice Name"
                value={application.businessName}
                onChangeText={(text) => updateApplication({ businessName: text })}
                placeholder="e.g. Sharma & Associates"
                leftIcon={<MaterialCommunityIcons name="store-outline" size={20} />}
              />
              <AppInput
                label="Nature of Work"
                value={application.businessType}
                onChangeText={(text) => updateApplication({ businessType: text })}
                placeholder="e.g. Consulting, Design"
                leftIcon={<MaterialCommunityIcons name="shape-outline" size={20} />}
              />
              <AppInput
                label="Monthly Income"
                value={application.monthlyIncome > 0 ? String(application.monthlyIncome) : ''}
                onChangeText={(text) => updateApplication({ monthlyIncome: Number(text) || 0 })}
                placeholder="Average monthly earnings"
                keyboardType="numeric"
                leftIcon={<MaterialCommunityIcons name="currency-inr" size={20} />}
              />
              <AppInput
                label="Years of Experience"
                value={application.yearsInBusiness > 0 ? String(application.yearsInBusiness) : ''}
                onChangeText={(text) => updateApplication({ yearsInBusiness: Number(text) || 0 })}
                placeholder="e.g. 3"
                keyboardType="numeric"
                leftIcon={<MaterialCommunityIcons name="calendar-clock-outline" size={20} />}
              />
            </View>
          </MotiView>
        )}

        {application.employmentType === 'business_owner' && (
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 80 }}
          >
            <View style={[styles.dtFormSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.dtFormHeader}>
                <View style={[styles.dtFormHeaderIcon, { backgroundColor: 'rgba(139,92,246,0.10)' }]}>
                  <MaterialCommunityIcons name="domain" size={14} color="#8B5CF6" />
                </View>
                <Text style={[styles.dtFormHeaderTitle, { color: colors.text }]}>Tell us about your business</Text>
              </View>
              <View style={[styles.dtFormDivider, { backgroundColor: colors.border }]} />
              <AppInput
                label="Company Name"
                value={application.companyName}
                onChangeText={(text) => updateApplication({ companyName: text })}
                placeholder="e.g. ABC Pvt Ltd"
                leftIcon={<MaterialCommunityIcons name="domain" size={20} />}
              />
              <AppInput
                label="Industry"
                value={application.businessType}
                onChangeText={(text) => updateApplication({ businessType: text })}
                placeholder="e.g. Manufacturing, IT"
                leftIcon={<MaterialCommunityIcons name="factory" size={20} />}
              />
              <AppInput
                label="Annual Turnover"
                value={application.annualTurnover > 0 ? String(application.annualTurnover) : ''}
                onChangeText={(text) => updateApplication({ annualTurnover: Number(text) || 0 })}
                placeholder="Yearly revenue"
                keyboardType="numeric"
                leftIcon={<MaterialCommunityIcons name="chart-line" size={20} />}
              />
              <AppInput
                label="Years in Operation"
                value={application.yearsInBusiness > 0 ? String(application.yearsInBusiness) : ''}
                onChangeText={(text) => updateApplication({ yearsInBusiness: Number(text) || 0 })}
                placeholder="e.g. 5"
                keyboardType="numeric"
                leftIcon={<MaterialCommunityIcons name="calendar-clock-outline" size={20} />}
              />
            </View>
          </MotiView>
        )}

        {/* Section 3: Residential Status — horizontal chips */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 160 }}
        >
          <Text style={[styles.dtConversationalTitle, { color: colors.text, marginTop: 8 }]}>
            Where do you live?
          </Text>
          <View style={styles.dtResChipRow}>
            {resChips.map((rc) => {
              const selected = application.residentialStatus === rc.key;
              return (
                <Pressable
                  key={rc.key}
                  onPress={() => updateApplication({ residentialStatus: rc.key })}
                  style={({ pressed }) => [
                    styles.dtResChip,
                    {
                      backgroundColor: selected ? 'rgba(14,165,233,0.10)' : colors.card,
                      borderColor: selected ? '#0EA5E9' : colors.border,
                      borderWidth: selected ? 1.5 : 1,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={rc.icon}
                    size={16}
                    color={selected ? '#0EA5E9' : colors.textMuted}
                  />
                  <Text style={[
                    styles.dtResChipText,
                    { color: selected ? '#0EA5E9' : colors.text },
                  ]}>
                    {rc.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        {/* Section 4: Financial Information — only show after employment selected */}
        {application.employmentType && (
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 350, delay: 240 }}
          >
            <View style={[styles.dtFormSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.dtFormHeader}>
                <View style={[styles.dtFormHeaderIcon, { backgroundColor: 'rgba(34,197,94,0.10)' }]}>
                  <MaterialCommunityIcons name="chart-bar" size={14} color="#22C55E" />
                </View>
                <Text style={[styles.dtFormHeaderTitle, { color: colors.text }]}>Any existing obligations?</Text>
              </View>
              <Text style={[styles.dtFormHelperText, { color: colors.textMuted }]}>
                This won't affect your eligibility. We just need it for the right offer.
              </Text>
              <View style={[styles.dtFormDivider, { backgroundColor: colors.border }]} />
              <AppInput
                label="Monthly Expenses"
                value={application.monthlyExpenses > 0 ? String(application.monthlyExpenses) : ''}
                onChangeText={(text) => updateApplication({ monthlyExpenses: Number(text) || 0 })}
                placeholder="Rent, bills, groceries etc."
                keyboardType="numeric"
                leftIcon={<MaterialCommunityIcons name="wallet-outline" size={20} />}
              />
              <AppInput
                label="Existing EMIs (if any)"
                value={application.existingEmi > 0 ? String(application.existingEmi) : ''}
                onChangeText={(text) => updateApplication({ existingEmi: Number(text) || 0 })}
                placeholder="Home loan, car loan EMIs etc."
                keyboardType="numeric"
                leftIcon={<MaterialCommunityIcons name="credit-card-clock-outline" size={20} />}
              />
            </View>
          </MotiView>
        )}
      </View>
    );
  };

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

    // Helper to render a review data row with icon
    const ReviewItem = ({
      icon,
      iconColor,
      iconBg,
      label,
      value,
      highlight,
    }: {
      icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
      iconColor: string;
      iconBg: string;
      label: string;
      value: string;
      highlight?: boolean;
    }) => (
      <View style={styles.rvItemRow}>
        <View style={[styles.rvItemIcon, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={14} color={iconColor} />
        </View>
        <View style={styles.rvItemText}>
          <Text style={[styles.rvItemLabel, { color: colors.textMuted }]}>{label}</Text>
          <Text
            style={[
              styles.rvItemValue,
              { color: highlight ? colors.primary : colors.text },
              highlight && { fontWeight: '700', fontSize: 15 },
            ]}
            numberOfLines={1}
          >
            {value}
          </Text>
        </View>
      </View>
    );

    return (
      <View>
        {/* Hero Header with EMI highlight */}
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <LinearGradient
            colors={['#0B1426', '#162240']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rvHeroGradient}
          >
            <View style={styles.rvHeroInner}>
              <View style={styles.rvHeroBadge}>
                <MaterialCommunityIcons name="shield-check-outline" size={12} color="#C8850A" />
                <Text style={styles.rvHeroBadgeText}>Application Summary</Text>
              </View>
              <Text style={styles.rvHeroAmount}>{formatCurrency(application.amount)}</Text>
              <Text style={styles.rvHeroSub}>
                {application.loanType ? LOAN_TYPE_LABELS[application.loanType] : 'Loan'} for {application.tenure} months
              </Text>

              {/* EMI pill */}
              <View style={styles.rvEmiPill}>
                <View style={styles.rvEmiPillRow}>
                  <View style={styles.rvEmiPillItem}>
                    <Text style={styles.rvEmiPillLabel}>Monthly EMI</Text>
                    <Text style={styles.rvEmiPillValue}>{formatCurrency(emiResult.emi)}</Text>
                  </View>
                  <View style={styles.rvEmiPillDivider} />
                  <View style={styles.rvEmiPillItem}>
                    <Text style={styles.rvEmiPillLabel}>Interest Rate</Text>
                    <Text style={styles.rvEmiPillValue}>{application.interestRate}% p.a.</Text>
                  </View>
                  <View style={styles.rvEmiPillDivider} />
                  <View style={styles.rvEmiPillItem}>
                    <Text style={styles.rvEmiPillLabel}>Total Payable</Text>
                    <Text style={styles.rvEmiPillValue}>{formatCurrency(emiResult.totalPayable)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* Loan Details Section */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
        >
          <View style={[styles.rvSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rvSectionHeader}>
              <View style={styles.rvSectionTitleRow}>
                <View style={[styles.rvSectionIconBg, { backgroundColor: 'rgba(200,133,10,0.10)' }]}>
                  <MaterialCommunityIcons name="file-document-outline" size={16} color="#C8850A" />
                </View>
                <Text style={[styles.rvSectionTitle, { color: colors.text }]}>Loan Details</Text>
              </View>
              <Pressable
                onPress={() => setStep(0)}
                hitSlop={8}
                style={({ pressed }) => [styles.rvEditBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialCommunityIcons name="pencil-outline" size={14} color="#C8850A" />
              </Pressable>
            </View>
            <View style={styles.rvItemsGrid}>
              <ReviewItem
                icon="tag-outline"
                iconColor="#C8850A"
                iconBg="rgba(200,133,10,0.08)"
                label="Loan Type"
                value={application.loanType ? LOAN_TYPE_LABELS[application.loanType] : '--'}
              />
              <ReviewItem
                icon="cash"
                iconColor="#22C55E"
                iconBg="rgba(34,197,94,0.08)"
                label="Loan Amount"
                value={formatCurrency(application.amount)}
              />
              <ReviewItem
                icon="calendar-month-outline"
                iconColor="#3B82F6"
                iconBg="rgba(59,130,246,0.08)"
                label="Tenure"
                value={`${application.tenure} months`}
              />
              <ReviewItem
                icon="percent-outline"
                iconColor="#8B5CF6"
                iconBg="rgba(139,92,246,0.08)"
                label="Total Interest"
                value={formatCurrency(emiResult.totalInterest)}
              />
            </View>
          </View>
        </MotiView>

        {/* Employment & Personal Section */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 200 }}
        >
          <View style={[styles.rvSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rvSectionHeader}>
              <View style={styles.rvSectionTitleRow}>
                <View style={[styles.rvSectionIconBg, { backgroundColor: 'rgba(59,130,246,0.10)' }]}>
                  <MaterialCommunityIcons name="account-outline" size={16} color="#3B82F6" />
                </View>
                <Text style={[styles.rvSectionTitle, { color: colors.text }]}>Personal Details</Text>
              </View>
              <Pressable
                onPress={() => setStep(2)}
                hitSlop={8}
                style={({ pressed }) => [styles.rvEditBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialCommunityIcons name="pencil-outline" size={14} color="#C8850A" />
              </Pressable>
            </View>
            <View style={styles.rvItemsGrid}>
              <ReviewItem
                icon="briefcase-outline"
                iconColor="#3B82F6"
                iconBg="rgba(59,130,246,0.08)"
                label="Employment"
                value={employmentLabel}
              />
              {application.companyName ? (
                <ReviewItem
                  icon="office-building-outline"
                  iconColor="#8B5CF6"
                  iconBg="rgba(139,92,246,0.08)"
                  label="Company"
                  value={application.companyName}
                />
              ) : null}
              <ReviewItem
                icon="home-outline"
                iconColor="#0EA5E9"
                iconBg="rgba(14,165,233,0.08)"
                label="Residence"
                value={residentialLabel}
              />
            </View>
          </View>
        </MotiView>

        {/* Financial Summary Section */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 300 }}
        >
          <View style={[styles.rvSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rvSectionHeader}>
              <View style={styles.rvSectionTitleRow}>
                <View style={[styles.rvSectionIconBg, { backgroundColor: 'rgba(34,197,94,0.10)' }]}>
                  <MaterialCommunityIcons name="chart-bar" size={16} color="#22C55E" />
                </View>
                <Text style={[styles.rvSectionTitle, { color: colors.text }]}>Financial Summary</Text>
              </View>
            </View>

            {/* Stacked horizontal stats */}
            <View style={styles.rvFinanceStats}>
              <View style={[styles.rvFinStatCard, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="arrow-down-circle-outline" size={18} color="#22C55E" />
                <View style={styles.rvFinStatText}>
                  <Text style={[styles.rvFinStatLabel, { color: colors.textMuted }]}>Income</Text>
                  <Text style={[styles.rvFinStatValue, { color: colors.text }]}>
                    {formatCurrency(application.monthlyIncome)}
                  </Text>
                </View>
              </View>
              <View style={[styles.rvFinStatCard, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="arrow-up-circle-outline" size={18} color="#EF4444" />
                <View style={styles.rvFinStatText}>
                  <Text style={[styles.rvFinStatLabel, { color: colors.textMuted }]}>Expenses</Text>
                  <Text style={[styles.rvFinStatValue, { color: colors.text }]}>
                    {formatCurrency(application.monthlyExpenses)}
                  </Text>
                </View>
              </View>
              <View style={[styles.rvFinStatCard, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="credit-card-clock-outline" size={18} color="#F59E0B" />
                <View style={styles.rvFinStatText}>
                  <Text style={[styles.rvFinStatLabel, { color: colors.textMuted }]}>Existing EMIs</Text>
                  <Text style={[styles.rvFinStatValue, { color: colors.text }]}>
                    {formatCurrency(application.existingEmi)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Affordability indicator */}
            <View style={[styles.rvAffordBar, { backgroundColor: colors.surface }]}>
              <View style={styles.rvAffordRow}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#22C55E" />
                <Text style={[styles.rvAffordLabel, { color: colors.textSecondary }]}>
                  EMI-to-Income Ratio
                </Text>
                <Text style={[styles.rvAffordValue, {
                  color: (emiResult.emi / (application.monthlyIncome || 1)) * 100 <= 50
                    ? '#22C55E' : '#F59E0B',
                }]}>
                  {((emiResult.emi / (application.monthlyIncome || 1)) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </MotiView>

        {/* Terms & Consent */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 400 }}
        >
          <View style={styles.rvConsentSection}>
            <Pressable
              onPress={() => setTermsAccepted((prev) => !prev)}
              style={[
                styles.rvConsentCard,
                {
                  backgroundColor: termsAccepted ? 'rgba(200,133,10,0.06)' : colors.card,
                  borderColor: termsAccepted ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[
                styles.rvCheckCircle,
                {
                  backgroundColor: termsAccepted ? colors.primary : 'transparent',
                  borderColor: termsAccepted ? colors.primary : colors.textMuted,
                },
              ]}>
                {termsAccepted && (
                  <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.rvConsentTextCol}>
                <Text style={[styles.rvConsentLabel, { color: colors.text }]}>
                  I agree to the Terms & Conditions
                </Text>
                <Pressable
                  onPress={() => termsSheetRef.current?.open()}
                  hitSlop={8}
                >
                  <Text style={[styles.rvReadTerms, { color: colors.primary }]}>
                    Read Terms
                  </Text>
                </Pressable>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setConsentAccepted((prev) => !prev)}
              style={[
                styles.rvConsentCard,
                {
                  backgroundColor: consentAccepted ? 'rgba(200,133,10,0.06)' : colors.card,
                  borderColor: consentAccepted ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[
                styles.rvCheckCircle,
                {
                  backgroundColor: consentAccepted ? colors.primary : 'transparent',
                  borderColor: consentAccepted ? colors.primary : colors.textMuted,
                },
              ]}>
                {consentAccepted && (
                  <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.rvConsentLabel, { color: colors.text, flex: 1 }]}>
                I authorize LendEase to verify my credit information
              </Text>
            </Pressable>
          </View>
        </MotiView>
      </View>
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
        {/* Connector line behind dots */}
        <View style={styles.timelineTrack}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.timelineConnector,
                { backgroundColor: i === 0 ? '#22C55E' : colors.border },
              ]}
            />
          ))}
        </View>
        {/* Steps row */}
        <View style={styles.timelineStepsRow}>
          {[
            { label: 'Submitted', done: true, icon: 'check' as const },
            { label: 'Review', done: false, icon: 'file-search' as const },
            { label: 'Approved', done: false, icon: 'shield-check' as const },
            { label: 'Disbursed', done: false, icon: 'bank-transfer' as const },
          ].map((step) => (
            <View key={step.label} style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor: step.done ? '#22C55E' : colors.surface,
                    borderWidth: step.done ? 0 : 2,
                    borderColor: step.done ? '#22C55E' : colors.border,
                  },
                ]}
              >
                {step.done ? (
                  <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons name={step.icon} size={10} color={colors.textMuted} />
                )}
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  {
                    color: step.done ? '#22C55E' : colors.textMuted,
                    fontWeight: step.done ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>
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
            onPress={() => navigation.navigate('TrackApplication')}
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
          { paddingBottom: currentStep > 0 && currentStep < 4 ? insets.bottom + 110 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom Navigation — hidden on step 0 (Loan Type) since card tap advances */}
      {currentStep > 0 && currentStep < 4 && (
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
              <Pressable
                onPress={handleNext}
                disabled={!canGoNext}
                style={({ pressed }) => [
                  { borderRadius: 14, overflow: 'hidden', opacity: !canGoNext ? 0.5 : pressed ? 0.9 : 1 },
                ]}
              >
                <LinearGradient
                  colors={canGoNext ? ['#C8850A', '#E8A830'] : [colors.surface, colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextBtnGradient}
                >
                  <View style={styles.nextBtnInner}>
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
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      <TermsSheet ref={termsSheetRef} />
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
  typeCardWrapper: {},
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

  // Step 2: Conversational Headers
  dtConversationalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  dtConversationalSub: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 18,
    lineHeight: 18,
  },

  // Step 2: Employment Cards — vertical list
  dtEmpList: {
    gap: 10,
    marginBottom: 20,
  },
  dtEmpCardV2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 14,
  },
  dtEmpIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dtEmpTextBlock: {
    flex: 1,
  },
  dtEmpLabelV2: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  dtEmpDesc: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  dtEmpRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Step 2: Residential Chips — horizontal
  dtResChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    marginTop: 8,
  },
  dtResChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dtResChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Step 2: Quick-select salary chips
  dtQuickChips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    marginBottom: 14,
  },
  dtQuickChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dtQuickChipText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Step 2: Form helper text
  dtFormHelperText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
    marginTop: -4,
  },

  // Step 2: Details — Form Sections
  dtFormSection: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dtFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dtFormHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dtFormHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  dtFormDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },

  // Legacy Step 2 styles (kept for compatibility)
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

  // Step 3: Review — Hero
  rvHeroGradient: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  rvHeroInner: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  rvHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200,133,10,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    marginBottom: 14,
  },
  rvHeroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E8A830',
    letterSpacing: 0.3,
  },
  rvHeroAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  rvHeroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    fontWeight: '500',
  },
  rvEmiPill: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  rvEmiPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  rvEmiPillItem: {
    flex: 1,
    alignItems: 'center',
  },
  rvEmiPillLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  rvEmiPillValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rvEmiPillDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  // Step 3: Review — Sections
  rvSection: {
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rvSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rvSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rvSectionIconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rvSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  rvEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(200,133,10,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Step 3: Review — Items Grid
  rvItemsGrid: {
    gap: 2,
  },
  rvItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rvItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rvItemText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rvItemLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  rvItemValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '55%',
  },

  // Step 3: Review — Finance Stats
  rvFinanceStats: {
    gap: 8,
  },
  rvFinStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 12,
  },
  rvFinStatText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rvFinStatLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  rvFinStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Step 3: Review — Affordability Bar
  rvAffordBar: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rvAffordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rvAffordLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  rvAffordValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Step 3: Review — Consent
  rvConsentSection: {
    marginTop: 8,
    gap: 10,
  },
  rvConsentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  rvCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  rvConsentTextCol: {
    flex: 1,
  },
  rvConsentLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  rvReadTerms: {
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
    marginTop: 32,
    paddingHorizontal: 16,
    position: 'relative',
    height: 60,
  },
  timelineTrack: {
    position: 'absolute',
    left: 16 + 32,
    right: 16 + 32,
    top: 11,
    flexDirection: 'row',
    height: 2,
  },
  timelineStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineStep: {
    alignItems: 'center',
    width: 64,
  },
  timelineConnector: {
    height: 2,
    flex: 1,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
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
