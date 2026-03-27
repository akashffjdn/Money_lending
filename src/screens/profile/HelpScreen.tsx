import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from '../../utils/MotiCompat';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../utils/responsive';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import MadeByFooter from '../../components/shared/MadeByFooter';
import { ProfileStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Help'>;

/* ------------------------------------------------------------------ */
/*  FAQ Data                                                          */
/* ------------------------------------------------------------------ */

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How do I apply for a loan?',
    answer:
      "Navigate to the Apply tab, select your loan type, enter the desired amount and tenure, fill in your details, and submit. You'll receive a decision within 2-4 hours.",
  },
  {
    question: 'What documents are needed for KYC?',
    answer:
      "You'll need your PAN card, Aadhaar card (front & back), a selfie, last 3 months bank statement, and an address proof document.",
  },
  {
    question: 'How is EMI calculated?',
    answer:
      'EMI is calculated using the formula: EMI = P \u00d7 r \u00d7 (1+r)^n / ((1+r)^n - 1), where P is principal, r is monthly interest rate, and n is tenure in months.',
  },
  {
    question: 'Can I prepay my loan?',
    answer:
      "Yes, you can prepay your loan anytime. Navigate to Loan Details and tap 'Prepay'. A nominal prepayment charge of 2-4% may apply.",
  },
  {
    question: 'What if I miss an EMI payment?',
    answer:
      'Missing an EMI payment may attract a late fee and affect your credit score. We recommend setting up auto-debit to avoid missed payments.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'You can reach us at 1800-123-4567 (toll-free) or email support@lendease.in. Our support hours are 9 AM - 9 PM IST, Monday to Saturday.',
  },
];

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                */
/* ------------------------------------------------------------------ */

interface AccordionItemProps {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

const AccordionItem = memo<AccordionItemProps>(
  ({ item, isExpanded, onToggle, index }) => {
    const { colors } = useTheme();
    const rotation = useRef(new Animated.Value(isExpanded ? 180 : 0)).current;

    useEffect(() => {
      Animated.timing(rotation, { toValue: isExpanded ? 180 : 0, duration: 250, useNativeDriver: true }).start();
    }, [isExpanded, rotation]);

    const chevronStyle = {
      transform: [{ rotate: rotation.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] }) }],
    };

    const handlePress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle();
    }, [onToggle]);

    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 60 }}
        style={styles.accordionWrapper}
      >
        <View
          style={[
            styles.accordionCard,
            {
              backgroundColor: isExpanded ? colors.surface : colors.card,
              borderColor: isExpanded ? colors.primary : colors.border,
            },
          ]}
        >
          {/* Header */}
          <Pressable onPress={handlePress} style={styles.accordionHeader}>
            <View
              style={[
                styles.faqIconCircle,
                {
                  backgroundColor: isExpanded
                    ? colors.primaryMuted
                    : colors.surfaceHover,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={16}
                color={isExpanded ? colors.primary : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.questionText,
                {
                  color: isExpanded ? colors.primary : colors.text,
                },
              ]}
              numberOfLines={2}
            >
              {item.question}
            </Text>
            <Animated.View style={chevronStyle}>
              <MaterialCommunityIcons
                name="chevron-down"
                size={22}
                color={isExpanded ? colors.primary : colors.textMuted}
              />
            </Animated.View>
          </Pressable>

          {/* Answer */}
          {isExpanded && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 250 }}
              style={styles.answerContainer}
            >
              <View
                style={[styles.answerDivider, { backgroundColor: colors.border }]}
              />
              <Text
                style={[styles.answerText, { color: colors.textSecondary }]}
              >
                {item.answer}
              </Text>
            </MotiView>
          )}
        </View>
      </MotiView>
    );
  },
);

/* ------------------------------------------------------------------ */
/*  Contact Card                                                      */
/* ------------------------------------------------------------------ */

interface ContactCardProps {
  icon: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  onPress: () => void;
  index: number;
}

const ContactCard = memo<ContactCardProps>(
  ({ icon, iconBg, title, subtitle, badgeText, badgeColor, onPress, index }) => {
    const { colors } = useTheme();
    return (
      <MotiView
        from={{ opacity: 0, translateX: -12 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 80 }}
      >
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.contactCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            pressed && { backgroundColor: colors.surfaceHover },
          ]}
        >
          <View style={[styles.contactIconCircle, { backgroundColor: iconBg }]}>
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.contactTextContainer}>
            <Text
              style={[styles.contactTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.contactSubtitle, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {badgeText && (
            <View
              style={[
                styles.contactBadge,
                { backgroundColor: badgeColor ? `${badgeColor}1A` : colors.successMuted },
              ]}
            >
              <Text
                style={[
                  styles.contactBadgeText,
                  { color: badgeColor ?? colors.success },
                ]}
              >
                {badgeText}
              </Text>
            </View>
          )}
          {!badgeText && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textMuted}
            />
          )}
        </Pressable>
      </MotiView>
    );
  },
);

/* ------------------------------------------------------------------ */
/*  HelpScreen                                                        */
/* ------------------------------------------------------------------ */

const HelpScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { s, isTablet } = useResponsive();

  const [searchText, setSearchText] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFAQs = searchText.trim()
    ? FAQ_DATA.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchText.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchText.toLowerCase()),
      )
    : FAQ_DATA;

  const handleToggle = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <ScreenWrapper headerTitle="Help & FAQ" onBack={() => navigation.goBack()} scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        {/* ---- Search ---- */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Search for help..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} hitSlop={8}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* ---- FAQ Accordion ---- */}
        <View style={styles.faqSection}>
          <Text style={[styles.faqSectionTitle, { color: colors.textMuted }]}>
            FREQUENTLY ASKED QUESTIONS
          </Text>
          {filteredFAQs.map((item, index) => (
            <AccordionItem
              key={item.question}
              item={item}
              isExpanded={expandedIndex === index}
              onToggle={() => handleToggle(index)}
              index={index}
            />
          ))}
          {filteredFAQs.length === 0 && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.noResultsContainer}
            >
              <MaterialCommunityIcons
                name="file-search-outline"
                size={40}
                color={colors.textMuted}
              />
              <Text style={[styles.noResults, { color: colors.textMuted }]}>
                No matching questions found.
              </Text>
            </MotiView>
          )}
        </View>

        {/* ---- Contact Section ---- */}
        <View style={styles.contactSection}>
          <Text style={[styles.contactSectionTitle, { color: colors.textMuted }]}>
            NEED MORE HELP?
          </Text>

          <ContactCard
            icon="phone"
            iconBg={colors.primary}
            title="1800-123-4567"
            subtitle="Toll-free, Mon-Sat 9AM-9PM"
            badgeText="Toll Free"
            badgeColor={colors.success}
            index={0}
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'Call Support',
                text2: '1800-123-4567 (Toll Free)',
              })
            }
          />

          <ContactCard
            icon="email-outline"
            iconBg={colors.primary}
            title="support@lendease.in"
            subtitle="Usually replies within 24 hours"
            index={1}
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'Email Support',
                text2: 'support@lendease.in',
              })
            }
          />

          <ContactCard
            icon="chat-outline"
            iconBg={colors.primary}
            title="Live Chat"
            subtitle="Instant support"
            badgeText="Coming Soon"
            badgeColor={colors.warning}
            index={2}
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'Live Chat',
                text2: 'Coming soon',
              })
            }
          />
        </View>

        <MadeByFooter />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default HelpScreen;

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    marginTop: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as any,

  /* FAQ */
  faqSection: {
    marginTop: 20,
  },
  faqSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  accordionWrapper: {
    marginBottom: 10,
  },
  accordionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  faqIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
    lineHeight: 21,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  answerDivider: {
    height: 1,
    marginBottom: 12,
    marginLeft: 40,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 21,
    marginLeft: 40,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noResults: {
    textAlign: 'center',
    fontSize: 14,
  },

  /* Contact */
  contactSection: {
    marginTop: 28,
    marginBottom: 8,
  },
  contactSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  contactBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  contactBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
