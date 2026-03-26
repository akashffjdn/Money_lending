import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MotiView } from '../../utils/MotiCompat';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { ApplyStackParamList } from '../../types/navigation';
import { useLoanApplicationStore } from '../../store/loanApplicationStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateEMI } from '../../utils/emiCalculator';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import EmptyState from '../../components/feedback/EmptyState';
import type { SubmittedApplication, ApplicationStatus } from '../../types/loan';

type Props = NativeStackScreenProps<ApplyStackParamList, 'TrackApplication'>;

// --- Constants ---
const LOAN_TYPE_LABELS: Record<string, string> = {
  personal: 'Personal Loan',
  business: 'Business Loan',
  education: 'Education Loan',
  medical: 'Medical Loan',
  home_renovation: 'Home Renovation',
  vehicle: 'Vehicle Loan',
};

interface TimelineStep {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  time: string;
  status: 'completed' | 'active' | 'pending';
}

const STATUS_ORDER: ApplicationStatus[] = [
  'submitted',
  'verification',
  'credit_check',
  'approved',
  'disbursed',
];

const STATUS_CONFIG: Record<ApplicationStatus | 'rejected', {
  label: string;
  color: string;
  bg: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}> = {
  submitted: { label: 'Submitted', color: '#C8850A', bg: 'rgba(200,133,10,0.12)', icon: 'file-document-check' },
  verification: { label: 'Verifying', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: 'shield-search' },
  credit_check: { label: 'Credit Check', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: 'chart-arc' },
  approved: { label: 'Approved', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: 'check-decagram' },
  disbursed: { label: 'Disbursed', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: 'bank-transfer' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: 'close-circle' },
};

function getTimelineSteps(appStatus: ApplicationStatus): TimelineStep[] {
  const steps: { key: ApplicationStatus; title: string; description: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; time: string }[] = [
    { key: 'submitted', title: 'Application Submitted', description: 'Your application has been received', icon: 'file-document-check', time: 'Completed' },
    { key: 'verification', title: 'Document Verification', description: 'Verifying your submitted documents', icon: 'shield-search', time: 'Est. 1-2 hours' },
    { key: 'credit_check', title: 'Credit Assessment', description: 'Credit score and eligibility check', icon: 'chart-arc', time: 'Est. 2-3 hours' },
    { key: 'approved', title: 'Final Approval', description: 'Approval by underwriting team', icon: 'check-decagram', time: 'Est. 3-4 hours' },
    { key: 'disbursed', title: 'Loan Disbursement', description: 'Amount credited to your account', icon: 'bank-transfer', time: 'After approval' },
  ];

  const currentIndex = STATUS_ORDER.indexOf(appStatus);

  return steps.map((s, i) => ({
    ...s,
    status: i < currentIndex ? 'completed' as const
      : i === currentIndex ? 'active' as const
      : 'pending' as const,
  }));
}

function formatSubmittedDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const TrackApplicationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const submittedApplications = useLoanApplicationStore((s) => s.submittedApplications);

  // If an applicationId is passed, auto-expand that one
  const initialId = route.params?.applicationId;
  const [expandedId, setExpandedId] = useState<string | null>(initialId || null);

  const fromTab = route.params?.fromTab;

  const handleGoBack = () => {
    if (fromTab) {
      navigation.getParent()?.navigate(fromTab);
    } else {
      navigation.goBack();
    }
  };

  const handleGoHome = () => {
    navigation.getParent()?.navigate('HomeTab');
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (submittedApplications.length === 0) {
    return (
      <ScreenWrapper
        headerTitle="Track Application"
        onBack={handleGoBack}
      >
        <View style={styles.emptyWrapper}>
          <EmptyState
            icon="file-search-outline"
            title="No Applications"
            description="You haven't submitted any loan applications yet. Apply for a loan to start tracking."
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerTitle="Track Application"
      onBack={handleGoBack}
      showFooter
    >
      {/* Summary bar */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
      >
        <View style={[styles.summaryBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: colors.primary }]}>
              {submittedApplications.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: '#C8850A' }]}>
              {submittedApplications.filter((a) => a.status !== 'disbursed' && a.status !== 'rejected').length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Active</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: '#22C55E' }]}>
              {submittedApplications.filter((a) => a.status === 'disbursed').length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Disbursed</Text>
          </View>
        </View>
      </MotiView>

      {/* Application Cards */}
      {submittedApplications.map((app, index) => (
        <ApplicationCard
          key={app.id}
          app={app}
          index={index}
          expanded={expandedId === app.id}
          onToggle={() => toggleExpand(app.id)}
          colors={colors}
        />
      ))}

      {/* Back to Home */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 300, delay: 400 }}
        style={styles.bottomActions}
      >
        <Pressable
          onPress={handleGoHome}
          style={({ pressed }) => [
            styles.homeButton,
            { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="home-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.homeButtonText, { color: colors.textSecondary }]}>
            Back to Home
          </Text>
        </Pressable>
      </MotiView>
    </ScreenWrapper>
  );
};

/* ------------------------------------------------------------------ */
/*  Application Card Component                                        */
/* ------------------------------------------------------------------ */

interface ApplicationCardProps {
  app: SubmittedApplication;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  app,
  index,
  expanded,
  onToggle,
  colors,
}) => {
  const { application, referenceId, status, submittedAt } = app;
  const statusCfg = STATUS_CONFIG[status];
  const loanLabel = application.loanType ? LOAN_TYPE_LABELS[application.loanType] || 'Loan' : 'Loan';

  const emiResult = useMemo(
    () => calculateEMI(application.amount, application.interestRate, application.tenure),
    [application.amount, application.interestRate, application.tenure],
  );

  const timelineSteps = useMemo(() => getTimelineSteps(status), [status]);
  const completedCount = timelineSteps.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round(((completedCount + (status === 'disbursed' ? 0 : 0.5)) / timelineSteps.length) * 100);

  const getStepColors = (stepStatus: TimelineStep['status']) => {
    if (stepStatus === 'completed') return { dot: '#22C55E', bg: 'rgba(34,197,94,0.10)', text: '#22C55E' };
    if (stepStatus === 'active') return { dot: '#C8850A', bg: 'rgba(200,133,10,0.10)', text: '#C8850A' };
    return { dot: colors.border, bg: colors.surface, text: colors.textMuted };
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: 80 + index * 60 }}
    >
      <View style={[styles.appCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Card Header — always visible */}
        <Pressable onPress={onToggle} style={styles.appCardHeader}>
          {/* Left accent */}
          <View style={[styles.appCardAccent, { backgroundColor: statusCfg.color }]} />

          <View style={[styles.appCardIconBg, { backgroundColor: statusCfg.bg }]}>
            <MaterialCommunityIcons name={statusCfg.icon} size={18} color={statusCfg.color} />
          </View>

          <View style={styles.appCardInfo}>
            <View style={styles.appCardTopRow}>
              <Text style={[styles.appCardAmount, { color: colors.text }]} numberOfLines={1}>
                {formatCurrency(application.amount)}
              </Text>
              <View style={[styles.appCardStatusBadge, { backgroundColor: statusCfg.bg }]}>
                <Text style={[styles.appCardStatusText, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
              </View>
            </View>
            <View style={styles.appCardSubRow}>
              <Text style={[styles.appCardType, { color: colors.textMuted }]}>{loanLabel}</Text>
              <Text style={[styles.appCardDot, { color: colors.textMuted }]}> · </Text>
              <Text style={[styles.appCardRef, { color: colors.textMuted }]}>{referenceId}</Text>
            </View>

            {/* Mini progress bar */}
            <View style={[styles.appCardProgress, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.appCardProgressFill,
                  { width: `${progressPercent}%`, backgroundColor: statusCfg.color },
                ]}
              />
            </View>

            <View style={styles.appCardBottomRow}>
              <Text style={[styles.appCardTime, { color: colors.textMuted }]}>
                {formatSubmittedDate(submittedAt)}
              </Text>
              <MaterialCommunityIcons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </View>
          </View>
        </Pressable>

        {/* Expanded Detail */}
        {expanded && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 250 }}
          >
            {/* Stats row */}
            <View style={[styles.expandedDivider, { backgroundColor: colors.border }]} />
            <View style={styles.expandedStats}>
              <View style={[styles.expandedStatItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.expandedStatLabel, { color: colors.textMuted }]}>EMI</Text>
                <Text style={[styles.expandedStatValue, { color: colors.text }]}>
                  {formatCurrency(emiResult.emi)}
                </Text>
              </View>
              <View style={[styles.expandedStatItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.expandedStatLabel, { color: colors.textMuted }]}>Tenure</Text>
                <Text style={[styles.expandedStatValue, { color: colors.text }]}>
                  {application.tenure} months
                </Text>
              </View>
              <View style={[styles.expandedStatItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.expandedStatLabel, { color: colors.textMuted }]}>Rate</Text>
                <Text style={[styles.expandedStatValue, { color: colors.text }]}>
                  {application.interestRate}%
                </Text>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.expandedTimeline}>
              <View style={styles.expandedTimelineHeader}>
                <View style={[styles.expandedTimelineIconBg, { backgroundColor: 'rgba(200,133,10,0.10)' }]}>
                  <MaterialCommunityIcons name="timeline-clock-outline" size={14} color="#C8850A" />
                </View>
                <Text style={[styles.expandedTimelineTitle, { color: colors.text }]}>
                  Status Timeline
                </Text>
              </View>

              {timelineSteps.map((step, i) => {
                const sc = getStepColors(step.status);
                const isLast = i === timelineSteps.length - 1;
                return (
                  <View key={step.key} style={styles.tlStep}>
                    <View style={styles.tlLeft}>
                      <View
                        style={[
                          styles.tlDot,
                          {
                            backgroundColor: step.status === 'pending' ? 'transparent' : sc.dot,
                            borderWidth: step.status === 'pending' ? 2 : 0,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        {step.status === 'completed' && (
                          <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
                        )}
                        {step.status === 'active' && (
                          <View style={styles.tlActiveDotInner} />
                        )}
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.tlConnector,
                            { backgroundColor: step.status === 'completed' ? '#22C55E' : colors.border },
                          ]}
                        />
                      )}
                    </View>
                    <View style={[styles.tlContent, !isLast && { paddingBottom: 18 }]}>
                      <Text
                        style={[
                          styles.tlTitle,
                          {
                            color: step.status === 'pending' ? colors.textMuted : colors.text,
                            fontWeight: step.status === 'active' ? '700' : '500',
                          },
                        ]}
                      >
                        {step.title}
                      </Text>
                      <Text style={[styles.tlDesc, { color: colors.textMuted }]}>
                        {step.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </MotiView>
        )}
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  // Empty
  emptyWrapper: {
    flex: 1,
    paddingTop: 60,
  },

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
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
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },

  // Application Card
  appCard: {
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  appCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  appCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingLeft: 18,
  },
  appCardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  appCardInfo: {
    flex: 1,
  },
  appCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  appCardStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  appCardStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  appCardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  appCardType: {
    fontSize: 12,
    fontWeight: '500',
  },
  appCardDot: {
    fontSize: 12,
  },
  appCardRef: {
    fontSize: 12,
    fontWeight: '500',
  },
  appCardProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  appCardProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  appCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  appCardTime: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Expanded
  expandedDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  expandedStats: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  expandedStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  expandedStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  expandedStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Expanded Timeline
  expandedTimeline: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  expandedTimelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  expandedTimelineIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedTimelineTitle: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Timeline Steps (compact)
  tlStep: {
    flexDirection: 'row',
  },
  tlLeft: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  tlDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tlActiveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  tlConnector: {
    width: 2,
    flex: 1,
    marginTop: 2,
  },
  tlContent: {
    flex: 1,
    paddingTop: 0,
  },
  tlTitle: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  tlDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  // Bottom Actions
  bottomActions: {
    marginBottom: 20,
    marginTop: 4,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TrackApplicationScreen;
