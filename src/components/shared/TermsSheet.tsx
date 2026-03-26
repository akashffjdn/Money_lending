import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.92;

/* ─── Types ─── */

export interface TermsSheetRef {
  open(): void;
  close(): void;
}

interface SectionItem {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
}

/* ─── Content ─── */

const TERMS_SECTIONS: SectionItem[] = [
  {
    icon: 'account-check-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.08)',
    title: '1. Eligibility',
    body: 'To be eligible for a loan through LendEase, you must be an Indian citizen or resident aged 21–58 years with a valid PAN, Aadhaar, and active bank account. A minimum monthly income of ₹15,000 (salaried) or ₹20,000 (self-employed) is required. LendEase reserves the right to reject any application based on internal credit assessment.',
  },
  {
    icon: 'file-document-outline',
    iconColor: '#C8850A',
    iconBg: 'rgba(200,133,10,0.08)',
    title: '2. Loan Terms & Disbursement',
    body: 'Upon approval, the loan amount shall be disbursed to your registered bank account within 24–48 business hours, subject to successful verification. The tenure, interest rate, and EMI schedule will be as specified in your Loan Sanction Letter. Disbursement is contingent upon e-signature and e-mandate registration.',
  },
  {
    icon: 'percent-outline',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.08)',
    title: '3. Interest Rates & Fees',
    body: 'Interest rates range from 11.99% to 24.00% p.a. (reducing balance), based on your credit profile. A processing fee of 1–3% of the loan amount (plus GST) is deducted at disbursement. Additional charges: bounce/dishonour fee of ₹500 + GST per failed EMI auto-debit, and stamp duty as applicable.',
  },
  {
    icon: 'calendar-clock-outline',
    iconColor: '#22C55E',
    iconBg: 'rgba(34,197,94,0.08)',
    title: '4. Repayment',
    body: 'Repayment is via EMIs through NACH/e-NACH mandate. EMIs are due on the date specified in your repayment schedule — ensure sufficient balance in the linked account. For bank account changes, register a new e-mandate at least 7 working days before the next EMI due date.',
  },
  {
    icon: 'cash-refund',
    iconColor: '#0EA5E9',
    iconBg: 'rgba(14,165,233,0.08)',
    title: '5. Prepayment & Foreclosure',
    body: 'You may prepay the loan in full or part after 3 EMIs. As per RBI guidelines, no prepayment charges apply for floating-rate loans. For fixed-rate loans, a foreclosure charge of up to 4% of outstanding principal (plus GST) may apply. Part-prepayment must be at least 25% of outstanding principal.',
  },
  {
    icon: 'alert-circle-outline',
    iconColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.08)',
    title: '6. Late Payment & Default',
    body: 'Overdue EMIs attract penal interest of 2% per month on the overdue amount. If any EMI remains unpaid for 90+ days, the account is classified as NPA and reported to credit bureaus (CIBIL, Equifax, Experian, CRIF High Mark), adversely impacting your credit score. Recovery proceedings may be initiated.',
  },
  {
    icon: 'shield-lock-outline',
    iconColor: '#6366F1',
    iconBg: 'rgba(99,102,241,0.08)',
    title: '7. Data Privacy & Usage',
    body: 'By using LendEase, you consent to collection and processing of personal data including identity documents, financial information, and employment details for credit assessment and loan servicing. Data is shared with credit bureaus and stored encrypted on servers within India, in compliance with the IT Act 2000.',
  },
  {
    icon: 'chart-line',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.08)',
    title: '8. Credit Information Reporting',
    body: 'LendEase reports your loan details and repayment history to RBI-licensed credit bureaus on a monthly basis. Both timely payments and defaults are reported. This may affect your credit score and future ability to obtain credit. Disputes must be raised within 30 days of the relevant reporting period.',
  },
  {
    icon: 'gavel',
    iconColor: '#64748B',
    iconBg: 'rgba(100,116,139,0.08)',
    title: '9. Governing Law & Disputes',
    body: 'This agreement is governed by Indian law. Disputes shall first be resolved through our grievance redressal mechanism. If unresolved within 30 days, disputes are referred to arbitration under the Arbitration and Conciliation Act, 1996. You may also approach the RBI Ombudsman under the Integrated Ombudsman Scheme 2021.',
  },
  {
    icon: 'bank-outline',
    iconColor: '#059669',
    iconBg: 'rgba(5,150,105,0.08)',
    title: '10. Regulatory Compliance',
    body: 'LendEase operates in compliance with RBI\'s Digital Lending Guidelines (Sept 2022), Fair Practices Code, and KYC/AML regulations. A Key Facts Statement (KFS) with all material terms is provided before loan acceptance. Grievances may be directed to the Grievance Redressal Officer via the in-app mechanism.',
  },
];

/* ─── Component ─── */

const TermsSheet = forwardRef<TermsSheetRef>((_, ref) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateOut = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(cb);
  }, []);

  useImperativeHandle(ref, () => ({
    open() {
      setVisible(true);
      setTimeout(animateIn, 50);
    },
    close() {
      animateOut(() => setVisible(false));
    },
  }));

  const handleClose = useCallback(() => {
    animateOut(() => setVisible(false));
  }, []);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]}>
          <Pressable style={styles.overlayTouchable} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: SHEET_HEIGHT,
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBg, { backgroundColor: 'rgba(200,133,10,0.10)' }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#C8850A" />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Conditions</Text>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Legal badge */}
            <View style={[styles.legalBadge, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="bank-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.legalBadgeText, { color: colors.textMuted }]}>
                Governed by RBI Digital Lending Guidelines, 2022
              </Text>
            </View>

            <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
              Last updated: March 2026
            </Text>

            {/* Sections */}
            {TERMS_SECTIONS.map((section, index) => (
              <View
                key={index}
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: section.iconBg }]}>
                    <MaterialCommunityIcons name={section.icon} size={16} color={section.iconColor} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                </View>
                <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                  {section.body}
                </Text>
              </View>
            ))}

            {/* Acceptance note */}
            <View style={[styles.acceptanceNote, { backgroundColor: 'rgba(200,133,10,0.06)', borderColor: 'rgba(200,133,10,0.15)' }]}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#C8850A" />
              <Text style={[styles.acceptanceNoteText, { color: colors.textSecondary }]}>
                By checking "I agree to the Terms & Conditions" in the application review, you acknowledge that you have read, understood, and accept all terms above.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
});

/* ─── Styles ─── */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  legalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
  },
  legalBadgeText: {
    fontSize: 11.5,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  lastUpdated: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 10,
    marginBottom: 16,
    paddingLeft: 2,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionIconBg: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    flex: 1,
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  acceptanceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 8,
  },
  acceptanceNoteText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '400',
    flex: 1,
  },
});

TermsSheet.displayName = 'TermsSheet';
export default memo(TermsSheet);
