import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';

import { useTheme } from '../../hooks/useTheme';
import { useLoanStore } from '../../store/loanStore';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import { MotiView } from '../../utils/MotiCompat';
import { formatCurrency } from '../../utils/formatCurrency';
import { ProfileStackParamList } from '../../types/navigation';
import type { Loan, RepaymentEntry } from '../../types/loan';
import { BorderRadius } from '../../constants/spacing';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EMICalendar'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40 - 12) / 7); // 7 columns, 20px padding each side, 12px gap
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── Loan color palette ── */
const LOAN_COLORS: Record<string, string> = {
  personal: '#C8850A',
  business: '#3B82F6',
  education: '#8B5CF6',
  medical: '#EF4444',
  home_renovation: '#22C55E',
  vehicle: '#F97316',
};

const LOAN_ICONS: Record<string, string> = {
  personal: 'account-cash',
  business: 'briefcase',
  education: 'school',
  medical: 'hospital',
  home_renovation: 'home-edit',
  vehicle: 'car',
};

/* ── Calendar helpers ── */
interface CalendarDay {
  date: dayjs.Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  emis: { loan: Loan; entry: RepaymentEntry }[];
}

const generateCalendarDays = (year: number, month: number, loans: Loan[]): CalendarDay[] => {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInMonth = firstDay.daysInMonth();
  const today = dayjs();

  // Monday = 0, Sunday = 6 (ISO weekday - 1)
  let startWeekday = firstDay.day() - 1; // day() returns 0=Sun..6=Sat
  if (startWeekday < 0) startWeekday = 6; // Sunday becomes 6

  const days: CalendarDay[] = [];

  // Previous month padding
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = firstDay.subtract(i + 1, 'day');
    days.push({ date: d, isCurrentMonth: false, isToday: false, emis: [] });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    const dateStr = date.format('YYYY-MM-DD');
    const isToday = date.isSame(today, 'day');

    const emis: { loan: Loan; entry: RepaymentEntry }[] = [];
    for (const loan of loans) {
      for (const entry of loan.repaymentSchedule) {
        if (entry.dueDate === dateStr) {
          emis.push({ loan, entry });
        }
      }
    }

    days.push({ date, isCurrentMonth: true, isToday, emis });
  }

  // Next month padding (fill to 42 = 6 rows)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = firstDay.add(daysInMonth + i - 1, 'day');
    days.push({ date: d, isCurrentMonth: false, isToday: false, emis: [] });
  }

  return days;
};

/* ------------------------------------------------------------------ */
/*  Day Cell                                                           */
/* ------------------------------------------------------------------ */

interface DayCellProps {
  day: CalendarDay;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}

const DayCell = memo<DayCellProps>(({ day, isSelected, onPress, colors }) => {
  const hasEmis = day.emis.length > 0;
  const hasOverdue = day.emis.some((e) => e.entry.status === 'overdue');
  const allPaid = hasEmis && day.emis.every((e) => e.entry.status === 'paid');

  return (
    <Pressable
      onPress={() => {
        if (day.isCurrentMonth) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      style={[
        styles.dayCell,
        !day.isCurrentMonth && styles.dayCellOutside,
        isSelected && [styles.dayCellSelected, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }],
        day.isToday && !isSelected && [styles.dayCellToday, { borderColor: colors.primary }],
      ]}
    >
      <Text
        style={[
          styles.dayNumber,
          { color: day.isCurrentMonth ? colors.text : colors.textMuted + '40' },
          day.isToday && { color: colors.primary, fontWeight: '800' },
          isSelected && { color: colors.primary, fontWeight: '800' },
          hasOverdue && day.isCurrentMonth && { color: colors.error },
        ]}
      >
        {day.date.date()}
      </Text>

      {/* EMI dots */}
      {hasEmis && day.isCurrentMonth && (
        <View style={styles.dotsRow}>
          {day.emis.length <= 3 ? (
            day.emis.map((emi, idx) => (
              <View
                key={idx}
                style={[
                  styles.emiDot,
                  {
                    backgroundColor:
                      emi.entry.status === 'paid'
                        ? colors.success
                        : emi.entry.status === 'overdue'
                        ? colors.error
                        : LOAN_COLORS[emi.loan.type] ?? colors.primary,
                  },
                ]}
              />
            ))
          ) : (
            <>
              {day.emis.slice(0, 2).map((emi, idx) => (
                <View
                  key={idx}
                  style={[styles.emiDot, { backgroundColor: LOAN_COLORS[emi.loan.type] ?? colors.primary }]}
                />
              ))}
              <Text style={[styles.dotOverflow, { color: colors.textMuted }]}>+{day.emis.length - 2}</Text>
            </>
          )}
        </View>
      )}

      {/* Paid checkmark */}
      {allPaid && day.isCurrentMonth && (
        <View style={styles.paidCheck}>
          <MaterialCommunityIcons name="check-circle" size={10} color={colors.success} />
        </View>
      )}
    </Pressable>
  );
});

/* ------------------------------------------------------------------ */
/*  Day Detail Sheet                                                   */
/* ------------------------------------------------------------------ */

interface DayDetailSheetProps {
  visible: boolean;
  day: CalendarDay | null;
  onClose: () => void;
  colors: any;
}

const DayDetailSheet: React.FC<DayDetailSheetProps> = ({ visible, day, onClose, colors }) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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

  if (!visible || !day) return null;

  const totalDue = day.emis
    .filter((e) => e.entry.status !== 'paid')
    .reduce((sum, e) => sum + e.entry.amount, 0);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.sheetOverlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          <Pressable style={styles.sheetCloseBtn} onPress={handleClose} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
          </Pressable>

          {/* Date header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetDate, { color: colors.text }]}>
              {day.date.format('dddd, DD MMMM YYYY')}
            </Text>
            <Text style={[styles.sheetSubtext, { color: colors.textMuted }]}>
              {day.emis.length} payment{day.emis.length !== 1 ? 's' : ''} {day.emis.some((e) => e.entry.status === 'paid') ? 'on' : 'due on'} this day
            </Text>
          </View>

          {/* EMI cards */}
          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {day.emis.map((emi, idx) => {
              const statusConfig = getEMIStatusConfig(emi.entry.status, colors);
              const loanColor = LOAN_COLORS[emi.loan.type] ?? colors.primary;

              return (
                <MotiView
                  key={idx}
                  from={{ opacity: 0, translateY: 12 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: idx * 80 }}
                >
                  <View style={[styles.emiDetailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {/* Left accent bar */}
                    <View style={[styles.emiAccentBar, { backgroundColor: loanColor }]} />

                    <View style={styles.emiDetailContent}>
                      {/* Header */}
                      <View style={styles.emiDetailHeader}>
                        <View style={[styles.emiLoanIcon, { backgroundColor: loanColor + '18' }]}>
                          <MaterialCommunityIcons
                            name={LOAN_ICONS[emi.loan.type] as any ?? 'bank'}
                            size={18}
                            color={loanColor}
                          />
                        </View>
                        <View style={styles.emiLoanInfo}>
                          <Text style={[styles.emiLoanName, { color: colors.text }]}>
                            {emi.loan.typeLabel}
                          </Text>
                          <Text style={[styles.emiLoanId, { color: colors.textMuted }]}>
                            EMI {emi.entry.month} of {emi.loan.totalEmis} • {emi.loan.id}
                          </Text>
                        </View>
                        <View style={[styles.emiStatusBadge, { backgroundColor: statusConfig.bg }]}>
                          <MaterialCommunityIcons name={statusConfig.icon as any} size={10} color={statusConfig.color} />
                          <Text style={[styles.emiStatusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                          </Text>
                        </View>
                      </View>

                      {/* Amount + Breakdown */}
                      <View style={styles.emiAmountRow}>
                        <Text style={[styles.emiDetailAmount, { color: colors.text }]}>
                          {formatCurrency(emi.entry.amount)}
                        </Text>
                      </View>

                      <View style={styles.emiBreakdownRow}>
                        <View style={styles.emiBreakdownItem}>
                          <Text style={[styles.emiBreakdownLabel, { color: colors.textMuted }]}>Principal</Text>
                          <Text style={[styles.emiBreakdownValue, { color: colors.text }]}>
                            {formatCurrency(emi.entry.principal)}
                          </Text>
                        </View>
                        <View style={[styles.emiBreakdownDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.emiBreakdownItem}>
                          <Text style={[styles.emiBreakdownLabel, { color: colors.textMuted }]}>Interest</Text>
                          <Text style={[styles.emiBreakdownValue, { color: colors.text }]}>
                            {formatCurrency(emi.entry.interest)}
                          </Text>
                        </View>
                        <View style={[styles.emiBreakdownDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.emiBreakdownItem}>
                          <Text style={[styles.emiBreakdownLabel, { color: colors.textMuted }]}>Balance</Text>
                          <Text style={[styles.emiBreakdownValue, { color: colors.text }]}>
                            {formatCurrency(emi.entry.balance)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </MotiView>
              );
            })}

            {/* Total due strip */}
            {totalDue > 0 && (
              <View style={[styles.totalDueStrip, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.totalDueLabel, { color: colors.primary }]}>Total Due</Text>
                <Text style={[styles.totalDueAmount, { color: colors.primary }]}>
                  {formatCurrency(totalDue)}
                </Text>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const getEMIStatusConfig = (status: string, colors: any) => {
  switch (status) {
    case 'paid': return { bg: colors.successMuted, color: colors.success, icon: 'check-circle', label: 'Paid' };
    case 'current': return { bg: colors.primaryMuted, color: colors.primary, icon: 'clock-outline', label: 'Due' };
    case 'upcoming': return { bg: colors.surface, color: colors.textMuted, icon: 'calendar-clock', label: 'Upcoming' };
    case 'overdue': return { bg: colors.errorMuted, color: colors.error, icon: 'alert-circle', label: 'Overdue' };
    default: return { bg: colors.surface, color: colors.textMuted, icon: 'circle', label: status };
  }
};

/* ------------------------------------------------------------------ */
/*  EMICalendarScreen                                                  */
/* ------------------------------------------------------------------ */

const EMICalendarScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, mode } = useTheme();
  const loanStore = useLoanStore();
  const isDark = mode === 'dark';

  const today = dayjs();
  const [currentYear, setCurrentYear] = useState(today.year());
  const [currentMonth, setCurrentMonth] = useState(today.month() + 1); // 1-based
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  useEffect(() => {
    if (loanStore.loans.length === 0) loanStore.loadLoans();
  }, []);

  const activeLoans = useMemo(
    () => loanStore.loans.filter((l) => l.repaymentSchedule.length > 0),
    [loanStore.loans],
  );

  const filteredLoans = useMemo(
    () => (selectedFilter ? activeLoans.filter((l) => l.type === selectedFilter) : activeLoans),
    [activeLoans, selectedFilter],
  );

  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth, filteredLoans),
    [currentYear, currentMonth, filteredLoans],
  );

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const monthDays = calendarDays.filter((d) => d.isCurrentMonth);
    const allEmis = monthDays.flatMap((d) => d.emis);
    const paid = allEmis.filter((e) => e.entry.status === 'paid');
    const upcoming = allEmis.filter((e) => e.entry.status === 'upcoming' || e.entry.status === 'current');
    const overdue = allEmis.filter((e) => e.entry.status === 'overdue');

    return {
      total: allEmis.reduce((s, e) => s + e.entry.amount, 0),
      paidAmount: paid.reduce((s, e) => s + e.entry.amount, 0),
      paidCount: paid.length,
      upcomingAmount: upcoming.reduce((s, e) => s + e.entry.amount, 0),
      upcomingCount: upcoming.length,
      overdueAmount: overdue.reduce((s, e) => s + e.entry.amount, 0),
      overdueCount: overdue.length,
      totalCount: allEmis.length,
    };
  }, [calendarDays]);

  const navigateMonth = useCallback((dir: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let newMonth = currentMonth + dir;
    let newYear = currentYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  }, [currentMonth, currentYear]);

  const goToToday = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentYear(today.year());
    setCurrentMonth(today.month() + 1);
  }, []);

  const isCurrentMonthToday = currentYear === today.year() && currentMonth === today.month() + 1;

  const monthLabel = dayjs(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`).format('MMMM YYYY');

  return (
    <ScreenWrapper
      headerTitle="EMI Calendar"
      onBack={() => navigation.goBack()}
      scrollable
    >
      {/* ── Monthly Summary Card ── */}
      <LinearGradient
        colors={['#0B1426', '#132042', '#1A2D5A']}
        style={styles.summaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.summaryGlow} />

        <View style={styles.summaryTopRow}>
          <View>
            <Text style={styles.summaryLabel}>Total Due This Month</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(monthlySummary.total)}</Text>
            <Text style={styles.summaryEmiCount}>
              {monthlySummary.totalCount} EMI{monthlySummary.totalCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.summaryStatsRow}>
          <View style={[styles.summaryStatPill, { borderColor: 'rgba(34,197,94,0.2)' }]}>
            <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
            <View>
              <Text style={styles.statAmount}>{formatCurrency(monthlySummary.paidAmount)}</Text>
              <Text style={styles.statLabel}>{monthlySummary.paidCount} Paid</Text>
            </View>
          </View>
          <View style={[styles.summaryStatPill, { borderColor: 'rgba(59,130,246,0.2)' }]}>
            <View style={[styles.statDot, { backgroundColor: '#3B82F6' }]} />
            <View>
              <Text style={styles.statAmount}>{formatCurrency(monthlySummary.upcomingAmount)}</Text>
              <Text style={styles.statLabel}>{monthlySummary.upcomingCount} Upcoming</Text>
            </View>
          </View>
          <View style={[styles.summaryStatPill, { borderColor: 'rgba(239,68,68,0.2)' }]}>
            <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
            <View>
              <Text style={styles.statAmount}>{formatCurrency(monthlySummary.overdueAmount)}</Text>
              <Text style={styles.statLabel}>{monthlySummary.overdueCount} Overdue</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Loan Filter Chips ── */}
      {activeLoans.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedFilter(null);
            }}
            style={[
              styles.loanFilterChip,
              {
                backgroundColor: !selectedFilter ? colors.primary : colors.surface,
                borderColor: !selectedFilter ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={14} color={!selectedFilter ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.loanFilterText, { color: !selectedFilter ? '#FFFFFF' : colors.textSecondary }]}>All Loans</Text>
          </Pressable>
          {activeLoans.map((loan) => {
            const isActive = selectedFilter === loan.type;
            const loanColor = LOAN_COLORS[loan.type] ?? colors.primary;
            return (
              <Pressable
                key={loan.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFilter(isActive ? null : loan.type);
                }}
                style={[
                  styles.loanFilterChip,
                  {
                    backgroundColor: isActive ? loanColor + '18' : colors.surface,
                    borderColor: isActive ? loanColor : colors.border,
                  },
                ]}
              >
                <View style={[styles.filterDot, { backgroundColor: loanColor }]} />
                <Text style={[styles.loanFilterText, { color: isActive ? loanColor : colors.textSecondary }]}>
                  {loan.typeLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* ── Calendar ── */}
      <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <Pressable onPress={() => navigateMonth(-1)} hitSlop={12} style={styles.monthNavBtn}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </Pressable>
          <Pressable onPress={goToToday}>
            <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
          </Pressable>
          <Pressable onPress={() => navigateMonth(1)} hitSlop={12} style={styles.monthNavBtn}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d) => (
            <View key={d} style={styles.weekdayCell}>
              <Text style={[styles.weekdayText, { color: colors.textMuted }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, idx) => (
            <DayCell
              key={idx}
              day={day}
              isSelected={selectedDay?.date.isSame(day.date, 'day') ?? false}
              onPress={() => {
                setSelectedDay(day);
                if (day.emis.length > 0) {
                  setShowDetail(true);
                }
              }}
              colors={colors}
            />
          ))}
        </View>

        {/* Legend */}
        <View style={[styles.legendRow, { borderTopColor: colors.border }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDotSmall, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Paid</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDotSmall, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Upcoming</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDotSmall, { backgroundColor: colors.error }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Overdue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.todayIndicator, { borderColor: colors.primary }]}>
              <Text style={{ fontSize: 7, color: colors.primary, fontWeight: '800' }}>T</Text>
            </View>
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Today</Text>
          </View>
        </View>
      </View>

      {/* Today button (if not current month) */}
      {!isCurrentMonthToday && (
        <Pressable
          onPress={goToToday}
          style={({ pressed }) => [
            styles.todayBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <MaterialCommunityIcons name="calendar-today" size={16} color="#FFFFFF" />
          <Text style={styles.todayBtnText}>Today</Text>
        </Pressable>
      )}

      {/* ── Upcoming EMIs List ── */}
      <View style={styles.upcomingSection}>
        <Text style={[styles.upcomingSectionTitle, { color: colors.text }]}>Upcoming This Month</Text>

        {monthlySummary.upcomingCount === 0 && monthlySummary.overdueCount === 0 ? (
          <View style={[styles.noEmisCard, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="calendar-check" size={28} color={colors.success} />
            <Text style={[styles.noEmisText, { color: colors.textMuted }]}>
              All EMIs for this month are paid!
            </Text>
          </View>
        ) : (
          calendarDays
            .filter((d) => d.isCurrentMonth && d.emis.some((e) => e.entry.status !== 'paid'))
            .map((day) =>
              day.emis
                .filter((e) => e.entry.status !== 'paid')
                .map((emi, idx) => {
                  const loanColor = LOAN_COLORS[emi.loan.type] ?? colors.primary;
                  const statusConfig = getEMIStatusConfig(emi.entry.status, colors);
                  return (
                    <Pressable
                      key={`${day.date.format('YYYY-MM-DD')}-${idx}`}
                      onPress={() => {
                        setSelectedDay(day);
                        setShowDetail(true);
                      }}
                      style={[styles.upcomingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.upcomingAccent, { backgroundColor: loanColor }]} />
                      <View style={[styles.upcomingIcon, { backgroundColor: loanColor + '18' }]}>
                        <MaterialCommunityIcons
                          name={LOAN_ICONS[emi.loan.type] as any ?? 'bank'}
                          size={18}
                          color={loanColor}
                        />
                      </View>
                      <View style={styles.upcomingInfo}>
                        <Text style={[styles.upcomingLoanName, { color: colors.text }]}>{emi.loan.typeLabel}</Text>
                        <Text style={[styles.upcomingDate, { color: colors.textMuted }]}>
                          Due {day.date.format('DD MMM')} • EMI {emi.entry.month}
                        </Text>
                      </View>
                      <View style={styles.upcomingRight}>
                        <Text style={[styles.upcomingAmount, { color: colors.text }]}>
                          {formatCurrency(emi.entry.amount)}
                        </Text>
                        <View style={[styles.upcomingStatus, { backgroundColor: statusConfig.bg }]}>
                          <Text style={[styles.upcomingStatusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                }),
            )
        )}
      </View>

      {/* Day Detail Sheet */}
      <DayDetailSheet
        visible={showDetail}
        day={selectedDay}
        onClose={() => setShowDetail(false)}
        colors={colors}
      />
    </ScreenWrapper>
  );
};

export default EMICalendarScreen;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* Summary */
  summaryCard: { borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden', position: 'relative' },
  summaryGlow: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(200,133,10,0.12)' },
  summaryTopRow: { marginBottom: 16 },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '500', letterSpacing: 0.5 },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  summaryEmiCount: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: '500' },
  summaryStatsRow: { flexDirection: 'row', gap: 8 },
  summaryStatPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statAmount: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '500', marginTop: 1 },

  /* Loan Filter Chips */
  filterScroll: { marginBottom: 14 },
  filterContent: { gap: 8, paddingRight: 4 },
  loanFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  loanFilterText: { fontSize: 12, fontWeight: '600' },
  filterDot: { width: 8, height: 8, borderRadius: 4 },

  /* Calendar Card */
  calendarCard: { borderRadius: 18, borderWidth: 1, paddingBottom: 6, marginBottom: 16, overflow: 'hidden' },

  /* Month Nav */
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  monthNavBtn: { padding: 4 },
  monthLabel: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },

  /* Weekday Row */
  weekdayRow: { flexDirection: 'row', paddingHorizontal: 6 },
  weekdayCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  weekdayText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  /* Calendar Grid */
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6 },

  /* Day Cell */
  dayCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  dayCellOutside: { opacity: 0.25 },
  dayCellSelected: { borderWidth: 1.5 },
  dayCellToday: { borderWidth: 1.5 },
  dayNumber: { fontSize: 14, fontWeight: '500' },

  /* Dots */
  dotsRow: { flexDirection: 'row', gap: 3, marginTop: 2, position: 'absolute', bottom: 4 },
  emiDot: { width: 5, height: 5, borderRadius: 2.5 },
  dotOverflow: { fontSize: 8, fontWeight: '700' },

  paidCheck: { position: 'absolute', bottom: 3, right: 6 },

  /* Legend */
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 10, marginHorizontal: 16, borderTopWidth: 1, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDotSmall: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '500' },
  todayIndicator: { width: 14, height: 14, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  /* Today Button */
  todayBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  todayBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  /* Upcoming Section */
  upcomingSection: { marginBottom: 16 },
  upcomingSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  noEmisCard: { alignItems: 'center', padding: 24, borderRadius: 14, gap: 8 },
  noEmisText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  upcomingAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  upcomingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  upcomingInfo: { flex: 1, marginLeft: 10 },
  upcomingLoanName: { fontSize: 14, fontWeight: '600' },
  upcomingDate: { fontSize: 11, marginTop: 2 },
  upcomingRight: { alignItems: 'flex-end' },
  upcomingAmount: { fontSize: 14, fontWeight: '700' },
  upcomingStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  upcomingStatusText: { fontSize: 9, fontWeight: '700' },

  /* Day Detail Sheet */
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: SCREEN_HEIGHT * 0.7, paddingBottom: 34 },
  handleBar: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  sheetCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  sheetHeader: { paddingHorizontal: 20, paddingBottom: 12 },
  sheetDate: { fontSize: 18, fontWeight: '700' },
  sheetSubtext: { fontSize: 13, marginTop: 4 },
  sheetBody: { paddingHorizontal: 20 },

  /* EMI Detail Card */
  emiDetailCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden', flexDirection: 'row' },
  emiAccentBar: { width: 4 },
  emiDetailContent: { flex: 1, padding: 14 },
  emiDetailHeader: { flexDirection: 'row', alignItems: 'center' },
  emiLoanIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emiLoanInfo: { flex: 1, marginLeft: 10 },
  emiLoanName: { fontSize: 14, fontWeight: '600' },
  emiLoanId: { fontSize: 10, marginTop: 2 },
  emiStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  emiStatusText: { fontSize: 9, fontWeight: '700' },
  emiAmountRow: { marginTop: 10 },
  emiDetailAmount: { fontSize: 20, fontWeight: '800' },
  emiBreakdownRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  emiBreakdownItem: { flex: 1 },
  emiBreakdownDivider: { width: 1 },
  emiBreakdownLabel: { fontSize: 10, fontWeight: '500', letterSpacing: 0.3 },
  emiBreakdownValue: { fontSize: 12, fontWeight: '600', marginTop: 3 },

  /* Total Due */
  totalDueStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, marginTop: 4 },
  totalDueLabel: { fontSize: 13, fontWeight: '600' },
  totalDueAmount: { fontSize: 16, fontWeight: '800' },
});
