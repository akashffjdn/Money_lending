import React, { useState, useMemo, useCallback } from 'react';
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
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { HomeStackParamList } from '../../types/navigation';
import { calculateEMI, generateSchedule, type ScheduleEntry } from '../../utils/emiCalculator';
import { formatCurrency, formatAmountShort } from '../../utils/formatCurrency';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import AppChip from '../../components/ui/AppChip';

type Props = NativeStackScreenProps<HomeStackParamList, 'EMICalculator'>;

// --- Config ---
const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 5000000;
const MIN_RATE = 5;
const MAX_RATE = 36;
const TENURE_OPTIONS = [3, 6, 12, 18, 24, 36, 48, 60];

const EMICalculatorScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  const [amount, setAmount] = useState(300000);
  const [rate, setRate] = useState(14.5);
  const [tenure, setTenure] = useState(12);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleShowAll, setScheduleShowAll] = useState(false);

  // Calculations
  const emiResult = useMemo(() => calculateEMI(amount, rate, tenure), [amount, rate, tenure]);
  const schedule = useMemo(
    () => (showSchedule ? generateSchedule(amount, rate, tenure) : []),
    [amount, rate, tenure, showSchedule],
  );

  const principalPercent = useMemo(() => {
    if (emiResult.totalPayable === 0) return 0;
    return Math.round((emiResult.principal / emiResult.totalPayable) * 100);
  }, [emiResult]);

  const interestPercent = 100 - principalPercent;

  // Handlers
  const handleAmountChange = useCallback((val: number) => {
    setAmount(Math.round(val / 5000) * 5000);
  }, []);

  const handleRateChange = useCallback((val: number) => {
    setRate(Math.round(val * 10) / 10);
  }, []);

  const handleTenureSelect = useCallback((months: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTenure(months);
    setScheduleShowAll(false);
  }, []);

  const handleToggleSchedule = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSchedule((p) => !p);
    setScheduleShowAll(false);
  }, []);

  const handleApplyLoan = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.getParent()?.navigate('ApplyTab', { screen: 'LoanApplication' });
  }, [navigation]);

  const visibleSchedule = scheduleShowAll ? schedule : schedule.slice(0, 6);

  return (
    <ScreenWrapper
      headerTitle="EMI Calculator"
      onBack={() => navigation.goBack()}
    >
      {/* Hero EMI Result */}
      <MotiView
        from={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <LinearGradient
          colors={['#0B1426', '#162240']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>Your Monthly EMI</Text>
          <Text style={styles.heroEmi}>{formatCurrency(emiResult.emi)}</Text>
          <Text style={styles.heroSub}>
            for {formatCurrency(amount)} at {rate}% for {tenure} months
          </Text>

          {/* 3-stat row */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Principal</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(emiResult.principal)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Interest</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(emiResult.totalInterest)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Total</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(emiResult.totalPayable)}</Text>
            </View>
          </View>
        </LinearGradient>
      </MotiView>

      {/* Breakup Bar */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: 80 }}
      >
        <View style={[styles.breakupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.breakupBar}>
            <View style={[styles.breakupPrincipal, { flex: principalPercent }]} />
            <View style={[styles.breakupInterest, { flex: interestPercent, backgroundColor: colors.textMuted + '30' }]} />
          </View>
          <View style={styles.breakupLegend}>
            <View style={styles.breakupLegendItem}>
              <View style={[styles.breakupDot, { backgroundColor: '#C8850A' }]} />
              <Text style={[styles.breakupText, { color: colors.textSecondary }]}>
                Principal ({principalPercent}%)
              </Text>
            </View>
            <View style={styles.breakupLegendItem}>
              <View style={[styles.breakupDot, { backgroundColor: colors.textMuted }]} />
              <Text style={[styles.breakupText, { color: colors.textSecondary }]}>
                Interest ({interestPercent}%)
              </Text>
            </View>
          </View>
        </View>
      </MotiView>

      {/* Loan Amount Slider */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: 120 }}
      >
        <View style={[styles.sliderSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sliderHeader}>
            <View style={styles.sliderHeaderLeft}>
              <View style={[styles.sliderIconBg, { backgroundColor: 'rgba(200,133,10,0.10)' }]}>
                <MaterialCommunityIcons name="cash" size={16} color="#C8850A" />
              </View>
              <Text style={[styles.sliderTitle, { color: colors.text }]}>Loan Amount</Text>
            </View>
            <Text style={[styles.sliderValue, { color: colors.primary }]}>
              {formatCurrency(amount)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={MIN_AMOUNT}
            maximumValue={MAX_AMOUNT}
            value={amount}
            onValueChange={handleAmountChange}
            minimumTrackTintColor="#C8850A"
            maximumTrackTintColor={colors.border}
            thumbTintColor="#C8850A"
            step={5000}
          />
          <View style={styles.sliderRange}>
            <Text style={[styles.sliderRangeText, { color: colors.textMuted }]}>{formatAmountShort(MIN_AMOUNT)}</Text>
            <Text style={[styles.sliderRangeText, { color: colors.textMuted }]}>{formatAmountShort(MAX_AMOUNT)}</Text>
          </View>
        </View>
      </MotiView>

      {/* Interest Rate Slider */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: 180 }}
      >
        <View style={[styles.sliderSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sliderHeader}>
            <View style={styles.sliderHeaderLeft}>
              <View style={[styles.sliderIconBg, { backgroundColor: 'rgba(59,130,246,0.10)' }]}>
                <MaterialCommunityIcons name="percent-outline" size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.sliderTitle, { color: colors.text }]}>Interest Rate</Text>
            </View>
            <Text style={[styles.sliderValue, { color: '#3B82F6' }]}>
              {rate.toFixed(1)}% p.a.
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={MIN_RATE}
            maximumValue={MAX_RATE}
            value={rate}
            onValueChange={handleRateChange}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor={colors.border}
            thumbTintColor="#3B82F6"
            step={0.1}
          />
          <View style={styles.sliderRange}>
            <Text style={[styles.sliderRangeText, { color: colors.textMuted }]}>{MIN_RATE}%</Text>
            <Text style={[styles.sliderRangeText, { color: colors.textMuted }]}>{MAX_RATE}%</Text>
          </View>
        </View>
      </MotiView>

      {/* Tenure Selection */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: 240 }}
      >
        <View style={[styles.tenureSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.tenureHeader}>
            <View style={styles.tenureHeaderLeft}>
              <View style={[styles.sliderIconBg, { backgroundColor: 'rgba(139,92,246,0.10)' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color="#8B5CF6" />
              </View>
              <Text style={[styles.sliderTitle, { color: colors.text }]}>Loan Tenure</Text>
            </View>
            <View style={styles.tenureSelectedBadge}>
              <Text style={styles.tenureSelectedBadgeText}>
                {tenure < 12 ? `${tenure} mo` : tenure % 12 === 0 ? `${tenure / 12} yr` : `${tenure} mo`}
              </Text>
            </View>
          </View>

          {/* Tenure pills in 2 rows */}
          <View style={styles.tenureGrid}>
            {TENURE_OPTIONS.slice(0, 4).map((months) => {
              const selected = tenure === months;
              const label = months < 12 ? `${months} mo` : months % 12 === 0 ? `${months / 12} yr` : `${months} mo`;
              return (
                <Pressable
                  key={months}
                  onPress={() => handleTenureSelect(months)}
                  style={({ pressed }) => [
                    styles.tenurePill,
                    selected && styles.tenurePillActive,
                    !selected && { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  {selected && (
                    <View style={styles.tenurePillIcon}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#FFFFFF" />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.tenurePillText,
                      selected ? styles.tenurePillTextActive : { color: colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.tenureGrid}>
            {TENURE_OPTIONS.slice(4).map((months) => {
              const selected = tenure === months;
              const label = months < 12 ? `${months} mo` : months % 12 === 0 ? `${months / 12} yr` : `${months} mo`;
              return (
                <Pressable
                  key={months}
                  onPress={() => handleTenureSelect(months)}
                  style={({ pressed }) => [
                    styles.tenurePill,
                    selected && styles.tenurePillActive,
                    !selected && { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  {selected && (
                    <View style={styles.tenurePillIcon}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#FFFFFF" />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.tenurePillText,
                      selected ? styles.tenurePillTextActive : { color: colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </MotiView>

      {/* EMI Schedule Toggle */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: 300 }}
      >
        <View style={[styles.scheduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable onPress={handleToggleSchedule} style={styles.scheduleToggle}>
            <View style={styles.scheduleToggleLeft}>
              <View style={[styles.sliderIconBg, { backgroundColor: 'rgba(34,197,94,0.10)' }]}>
                <MaterialCommunityIcons name="table" size={16} color="#22C55E" />
              </View>
              <Text style={[styles.sliderTitle, { color: colors.text }]}>EMI Schedule</Text>
            </View>
            <MaterialCommunityIcons
              name={showSchedule ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>

          {showSchedule && schedule.length > 0 && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 250 }}
            >
              <View style={[styles.scheduleDivider, { backgroundColor: colors.border }]} />

              {/* Table header */}
              <View style={styles.scheduleHeaderRow}>
                <Text style={[styles.schCell, styles.schCellMo, styles.schHeaderText, { color: colors.textMuted }]}>Mo</Text>
                <Text style={[styles.schCell, styles.schHeaderText, { color: colors.textMuted }]}>EMI</Text>
                <Text style={[styles.schCell, styles.schHeaderText, { color: colors.textMuted }]}>Principal</Text>
                <Text style={[styles.schCell, styles.schHeaderText, { color: colors.textMuted }]}>Interest</Text>
                <Text style={[styles.schCell, styles.schHeaderText, { color: colors.textMuted }]}>Balance</Text>
              </View>

              {/* Rows */}
              {visibleSchedule.map((entry) => (
                <View key={entry.month} style={[styles.schRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.schCell, styles.schCellMo, { color: colors.primary, fontWeight: '600' }]}>{entry.month}</Text>
                  <Text style={[styles.schCell, { color: colors.text }]}>{formatCurrency(entry.emi)}</Text>
                  <Text style={[styles.schCell, { color: '#22C55E' }]}>{formatCurrency(entry.principal)}</Text>
                  <Text style={[styles.schCell, { color: '#EF4444' }]}>{formatCurrency(entry.interest)}</Text>
                  <Text style={[styles.schCell, { color: colors.textSecondary }]}>{formatCurrency(entry.balance)}</Text>
                </View>
              ))}

              {!scheduleShowAll && schedule.length > 6 && (
                <Pressable
                  onPress={() => setScheduleShowAll(true)}
                  style={({ pressed }) => [styles.showAllBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.showAllText, { color: colors.primary }]}>
                    Show All ({schedule.length - 6} more months)
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color={colors.primary} />
                </Pressable>
              )}
            </MotiView>
          )}
        </View>
      </MotiView>

      {/* Apply Button */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: 360 }}
        style={styles.applySection}
      >
        <Pressable
          onPress={handleApplyLoan}
          style={({ pressed }) => [{ borderRadius: 14, overflow: 'hidden', opacity: pressed ? 0.9 : 1 }]}
        >
          <LinearGradient
            colors={['#C8850A', '#E8A830']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.applyBtn}
          >
            <MaterialCommunityIcons name="file-document-plus-outline" size={20} color="#FFFFFF" />
            <Text style={styles.applyBtnText}>Apply for this Loan</Text>
          </LinearGradient>
        </Pressable>
      </MotiView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  // Hero
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.50)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroEmi: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
    textAlign: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 14,
    paddingHorizontal: 8,
    width: '100%',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  // Breakup Bar
  breakupCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  breakupBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  breakupPrincipal: {
    backgroundColor: '#C8850A',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  breakupInterest: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  breakupLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  breakupLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakupText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Slider Sections
  sliderSection: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderIconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderRangeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Tenure
  tenureSection: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tenureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tenureHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tenureSelectedBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tenureSelectedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  tenureGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tenurePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  tenurePillActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tenurePillIcon: {
    marginRight: 2,
  },
  tenurePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tenurePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Schedule
  scheduleCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scheduleToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: 4,
  },
  schCell: {
    flex: 1,
    fontSize: 11,
    textAlign: 'right',
  },
  schCellMo: {
    flex: 0.4,
    textAlign: 'center',
  },
  schHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  schRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  showAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  showAllText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Apply
  applySection: {
    marginBottom: 20,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: 14,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EMICalculatorScreen;
