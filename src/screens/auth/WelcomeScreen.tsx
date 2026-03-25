import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
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
/*  Slide data                                                         */
/* ------------------------------------------------------------------ */

interface SlideInfo {
  title: string;
  highlight: string;
  subtitle: string;
  accent: string;
  image: string;
}

const SLIDES: SlideInfo[] = [
  {
    title: 'Get ',
    highlight: 'Instant Loans',
    subtitle: 'Approved in under 2 hours with minimal documentation and zero hidden charges',
    accent: '#E8A830',
    image: 'https://stories.freepiklabs.com/storage/45171/finance-app-bro-6655.png',
  },
  {
    title: 'Bank-Grade ',
    highlight: 'Security',
    subtitle: 'Your data is protected with 256-bit encryption and RBI-compliant processes',
    accent: '#22C55E',
    image: 'https://stories.freepiklabs.com/storage/31166/security-cuate-5175.png',
  },
  {
    title: 'Smart ',
    highlight: 'EMI Tracking',
    subtitle: 'Auto-pay, reminders, and a unified dashboard for all your repayments',
    accent: '#3B82F6',
    image: 'https://stories.freepiklabs.com/storage/23593/dashboard-bro-3022.png',
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

  const renderSlide = useCallback(({ item }: { item: SlideInfo; index: number }) => {
    return (
      <View style={styles.slide}>
        {/* Real illustration image */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.image }}
            style={styles.slideImage}
            resizeMode="contain"
            defaultSource={undefined}
          />
          <ActivityIndicator
            style={styles.imageLoader}
            size="small"
            color={item.accent}
          />
        </View>

        {/* Text */}
        <Text style={styles.slideTitle}>
          {item.title}
          <Text style={[styles.slideHighlight, { color: item.accent }]}>
            {item.highlight}
          </Text>
        </Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
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

  /* Image */
  imageWrapper: {
    width: SCREEN_WIDTH - 40,
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideImage: {
    width: SCREEN_WIDTH - 40,
    height: 380,
    position: 'absolute',
    zIndex: 1,
  },
  imageLoader: {
    position: 'absolute',
    zIndex: 0,
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
    marginTop: -8,
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
    marginTop: 10,
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
    marginTop: 10,
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
