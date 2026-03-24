import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ------------------------------------------------------------------ */
/*  Illustration Components - Rich visual scenes per slide             */
/* ------------------------------------------------------------------ */

const IllustrationLoan = () => (
  <View style={styles.illustrationContainer}>
    {/* Background circle */}
    <View style={[styles.illBgCircle, { backgroundColor: 'rgba(232,168,48,0.08)' }]} />
    <View style={[styles.illBgCircleSm, { backgroundColor: 'rgba(232,168,48,0.05)', top: 20, right: 10 }]} />

    {/* Phone mockup */}
    <View style={styles.phoneMock}>
      <View style={styles.phoneScreen}>
        {/* Loan approved card */}
        <View style={[styles.miniCard, { backgroundColor: 'rgba(232,168,48,0.15)' }]}>
          <MaterialCommunityIcons name="check-circle" size={16} color="#E8A830" />
          <Text style={styles.miniCardText}>Loan Approved!</Text>
        </View>
        {/* Amount */}
        <Text style={styles.phoneAmount}>$50,000</Text>
        <View style={styles.phoneBar}>
          <View style={[styles.phoneBarFill, { width: '80%', backgroundColor: '#E8A830' }]} />
        </View>
        {/* Stats row */}
        <View style={styles.phoneStatsRow}>
          <View style={styles.phoneStat}>
            <Text style={styles.phoneStatVal}>2hrs</Text>
            <Text style={styles.phoneStatLabel}>Approval</Text>
          </View>
          <View style={styles.phoneStat}>
            <Text style={styles.phoneStatVal}>0%</Text>
            <Text style={styles.phoneStatLabel}>Hidden Fee</Text>
          </View>
        </View>
      </View>
    </View>

    {/* Floating coins */}
    <View style={[styles.floatingBadge, { top: 30, left: 10, backgroundColor: 'rgba(232,168,48,0.2)' }]}>
      <MaterialCommunityIcons name="cash" size={20} color="#E8A830" />
    </View>
    <View style={[styles.floatingBadge, { bottom: 40, right: 5, backgroundColor: 'rgba(232,168,48,0.15)' }]}>
      <MaterialCommunityIcons name="lightning-bolt" size={18} color="#E8A830" />
    </View>
  </View>
);

const IllustrationSecurity = () => (
  <View style={styles.illustrationContainer}>
    <View style={[styles.illBgCircle, { backgroundColor: 'rgba(34,197,94,0.08)' }]} />
    <View style={[styles.illBgCircleSm, { backgroundColor: 'rgba(34,197,94,0.05)', bottom: 20, left: 15 }]} />

    {/* Shield center */}
    <View style={styles.shieldCenter}>
      <LinearGradient
        colors={['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.05)']}
        style={styles.shieldOuter}
      >
        <View style={styles.shieldInner}>
          <MaterialCommunityIcons name="shield-lock" size={48} color="#22C55E" />
        </View>
      </LinearGradient>
    </View>

    {/* Orbiting items */}
    <View style={[styles.floatingBadge, { top: 20, right: 20, backgroundColor: 'rgba(34,197,94,0.2)' }]}>
      <MaterialCommunityIcons name="fingerprint" size={18} color="#22C55E" />
    </View>
    <View style={[styles.floatingBadge, { top: 50, left: 5, backgroundColor: 'rgba(34,197,94,0.15)' }]}>
      <MaterialCommunityIcons name="key-variant" size={16} color="#22C55E" />
    </View>
    <View style={[styles.floatingBadge, { bottom: 30, left: 25, backgroundColor: 'rgba(34,197,94,0.15)' }]}>
      <MaterialCommunityIcons name="lock-check" size={16} color="#22C55E" />
    </View>
    <View style={[styles.floatingBadge, { bottom: 50, right: 10, backgroundColor: 'rgba(34,197,94,0.12)' }]}>
      <MaterialCommunityIcons name="check-decagram" size={18} color="#22C55E" />
    </View>

    {/* Encryption badge */}
    <View style={[styles.encryptBadge, { bottom: 10 }]}>
      <MaterialCommunityIcons name="lock" size={12} color="#22C55E" />
      <Text style={[styles.encryptText, { color: '#22C55E' }]}>256-bit AES</Text>
    </View>
  </View>
);

const IllustrationEMI = () => (
  <View style={styles.illustrationContainer}>
    <View style={[styles.illBgCircle, { backgroundColor: 'rgba(59,130,246,0.08)' }]} />

    {/* Dashboard mockup */}
    <View style={styles.dashMock}>
      {/* Chart bars */}
      <View style={styles.chartRow}>
        {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
          <View key={i} style={styles.chartBarWrap}>
            <LinearGradient
              colors={['#3B82F6', 'rgba(59,130,246,0.3)']}
              style={[styles.chartBar, { height: `${h * 100}%` }]}
            />
          </View>
        ))}
      </View>
      {/* EMI card */}
      <View style={styles.emiCard}>
        <View style={styles.emiCardRow}>
          <MaterialCommunityIcons name="calendar-check" size={14} color="#3B82F6" />
          <Text style={styles.emiCardTitle}>Next EMI</Text>
        </View>
        <Text style={styles.emiCardAmount}>$4,250</Text>
        <Text style={styles.emiCardDate}>Due: Apr 1, 2026</Text>
      </View>
    </View>

    {/* Floating elements */}
    <View style={[styles.floatingBadge, { top: 25, left: 8, backgroundColor: 'rgba(59,130,246,0.2)' }]}>
      <MaterialCommunityIcons name="bell-ring" size={16} color="#3B82F6" />
    </View>
    <View style={[styles.floatingBadge, { top: 35, right: 5, backgroundColor: 'rgba(59,130,246,0.15)' }]}>
      <MaterialCommunityIcons name="chart-line" size={18} color="#3B82F6" />
    </View>
  </View>
);

const ILLUSTRATIONS = [IllustrationLoan, IllustrationSecurity, IllustrationEMI];

interface SlideInfo {
  title: string;
  highlight: string;
  subtitle: string;
  accent: string;
}

const SLIDES: SlideInfo[] = [
  {
    title: 'Get ',
    highlight: 'Instant Loans',
    subtitle: 'Approved in under 2 hours with minimal documentation and zero hidden charges',
    accent: '#E8A830',
  },
  {
    title: 'Bank-Grade ',
    highlight: 'Security',
    subtitle: 'Your data is protected with 256-bit encryption and RBI-compliant processes',
    accent: '#22C55E',
  },
  {
    title: 'Smart ',
    highlight: 'EMI Tracking',
    subtitle: 'Auto-pay, reminders, and a unified dashboard for all your repayments',
    accent: '#3B82F6',
  },
];

const AUTO_SLIDE_MS = 4000;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-rotate
  const startAutoSlide = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        flatListRef.current?.scrollToOffset({
          offset: next * SCREEN_WIDTH,
          animated: true,
        });
        return next;
      });
    }, AUTO_SLIDE_MS);
  }, []);

  useEffect(() => {
    startAutoSlide();
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [startAutoSlide]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (idx >= 0 && idx < SLIDES.length && idx !== activeIndex) {
        setActiveIndex(idx);
        // Reset auto timer on manual scroll
        startAutoSlide();
      }
    },
    [activeIndex, startAutoSlide],
  );

  const handleGetStarted = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Login');
  }, [navigation]);

  const handleLogin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  }, [navigation]);

  const goToSlide = useCallback(
    (index: number) => {
      setActiveIndex(index);
      flatListRef.current?.scrollToOffset({
        offset: index * SCREEN_WIDTH,
        animated: true,
      });
      startAutoSlide();
    },
    [startAutoSlide],
  );

  const renderSlide = useCallback(({ index }: { item: SlideInfo; index: number }) => {
    const Illustration = ILLUSTRATIONS[index];
    const slide = SLIDES[index];
    return (
      <View style={styles.slide}>
        {/* Illustration */}
        <Illustration />

        {/* Text */}
        <Text style={styles.slideTitle}>
          {slide.title}
          <Text style={[styles.slideHighlight, { color: slide.accent }]}>
            {slide.highlight}
          </Text>
        </Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#060B14', '#0B1426', '#0F1D35', '#0B1426']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ---- Header: Brand + Skip ---- */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <LinearGradient
            colors={['#C8850A', '#E8A830']}
            style={styles.brandIcon}
          >
            <MaterialCommunityIcons name="cash-multiple" size={18} color="#FFF" />
          </LinearGradient>
          <Text style={styles.brandName}>
            Lend<Text style={styles.brandAccent}>Ease</Text>
          </Text>
        </View>
        <Pressable
          onPress={handleLogin}
          hitSlop={12}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* ---- Slides ---- */}
      <View style={styles.slidesArea}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(_, i) => String(i)}
          horizontal
          snapToInterval={SCREEN_WIDTH}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          bounces={false}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        {/* Pagination */}
        <View style={styles.pagination}>
          {SLIDES.map((s, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  activeIndex === i
                    ? [styles.dotActive, { backgroundColor: s.accent }]
                    : styles.dotInactive,
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {/* ---- Bottom CTA ---- */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => [
            styles.ctaPressable,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <LinearGradient
            colors={['#C8850A', '#E8A830']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Get Started</Text>
            <View style={styles.ctaArrow}>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#C8850A" />
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleLogin} hitSlop={12} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginBold}>Log in</Text>
          </Text>
        </Pressable>

        <View style={styles.trustRow}>
          <MaterialCommunityIcons name="shield-check" size={12} color="rgba(255,255,255,0.3)" />
          <Text style={styles.trustText}>RBI Regulated</Text>
          <View style={styles.trustDot} />
          <MaterialCommunityIcons name="lock" size={12} color="rgba(255,255,255,0.3)" />
          <Text style={styles.trustText}>256-bit Encrypted</Text>
        </View>
      </View>
    </View>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060B14',
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandAccent: {
    color: '#E8A830',
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },

  /* Slides */
  slidesArea: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    marginTop: 20,
  },
  slideHighlight: {
    fontWeight: '800',
  },
  slideSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    paddingHorizontal: 8,
  },

  /* Illustrations */
  illustrationContainer: {
    width: 260,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illBgCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  illBgCircleSm: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  floatingBadge: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Loan illustration */
  phoneMock: {
    width: 140,
    height: 190,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    overflow: 'hidden',
  },
  phoneScreen: {
    flex: 1,
  },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  miniCardText: {
    color: '#E8A830',
    fontSize: 10,
    fontWeight: '700',
  },
  phoneAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
  },
  phoneBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  phoneBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  phoneStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  phoneStat: {
    alignItems: 'center',
  },
  phoneStatVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  phoneStatLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 8,
    marginTop: 1,
  },

  /* Security illustration */
  shieldCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  encryptBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  encryptText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* EMI illustration */
  dashMock: {
    width: 180,
    height: 180,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    overflow: 'hidden',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    gap: 6,
  },
  chartBarWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  emiCard: {
    marginTop: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 10,
    padding: 8,
  },
  emiCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emiCardTitle: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '600',
  },
  emiCardAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  emiCardDate: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    marginTop: 1,
  },

  /* Pagination */
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 28,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  /* Bottom */
  bottomSection: {
    paddingHorizontal: 24,
  },
  ctaPressable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#C8850A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaGradient: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ctaArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  loginBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 4,
  },
  trustText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default WelcomeScreen;
