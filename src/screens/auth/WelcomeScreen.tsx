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
    highlight: 'Instant Loans.',
    subtitle:
      'Approved in under 2 hours with minimal documentation and zero hidden charges.',
    accent: '#22C55E',
    image: 'https://stories.freepiklabs.com/storage/45171/finance-app-bro-6655.png',
  },
  {
    title: 'Bank-Grade ',
    highlight: 'Security.',
    subtitle:
      'Institutional-level protection for your assets and data. Your trust is our foundation.',
    accent: '#E8A830',
    image: 'https://stories.freepiklabs.com/storage/31166/security-cuate-5175.png',
  },
  {
    title: 'Smart ',
    highlight: 'EMI Tracking.',
    subtitle:
      'Auto-pay, reminders, and a unified dashboard for all your repayments.',
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

  const currentSlide = SLIDES[activeIndex];

  const renderSlide = useCallback(
    ({ item }: { item: SlideInfo }) => (
      <View style={styles.slide}>
        <ActivityIndicator
          size="small"
          color={item.accent}
          style={styles.imageLoader}
        />
        <Image
          source={{ uri: item.image }}
          style={styles.slideImage}
          resizeMode="contain"
        />
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#040810', '#0A1220', '#0E1A2E', '#0A1220']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconWrap}>
            <MaterialCommunityIcons name="bank" size={18} color="#E8A830" />
          </View>
          <Text style={styles.brandName}>
            LENDEASE
          </Text>
        </View>
        <Pressable
          onPress={handleLogin}
          hitSlop={12}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      </View>

      {/* Image carousel — plain images, no card */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
        style={styles.carousel}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Title + subtitle + dots */}
      <View style={styles.textSection}>
        <Text style={styles.mainTitle}>
          {currentSlide.title}
          {'\n'}
          <Text style={[styles.mainHighlight, { color: currentSlide.accent }]}>
            {currentSlide.highlight}
          </Text>
        </Text>

        <Text style={styles.mainSubtitle}>{currentSlide.subtitle}</Text>

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

      {/* Bottom CTA */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 6 }]}>
        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => [
            styles.ctaPressable,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <LinearGradient
            colors={['#C8850A', '#E8A830', '#D4960C']}
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
            Already have an account?{'  '}
            <Text style={styles.loginBold}>Log in</Text>
          </Text>
        </Pressable>

        <View style={styles.trustRow}>
          <MaterialCommunityIcons name="shield-check" size={12} color="rgba(255,255,255,0.3)" />
          <Text style={styles.trustText}>RBI REGULATED</Text>
          <View style={styles.trustDot} />
          <MaterialCommunityIcons name="lock" size={12} color="rgba(255,255,255,0.3)" />
          <Text style={styles.trustText}>256-BIT ENCRYPTED</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040810',
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 4,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(232,168,48,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E8A830',
    letterSpacing: 2,
  },
  brandAccent: {
    color: '#E8A830',
  },
  skipBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  /* Carousel */
  carousel: {
    flexGrow: 0,
    height: 480,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: 480,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideImage: {
    width: SCREEN_WIDTH - 24,
    height: 460,
    position: 'absolute',
    zIndex: 1,
  },
  imageLoader: {
    position: 'absolute',
    zIndex: 0,
  },

  /* Text section */
  textSection: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 36,
    paddingTop: 8,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  mainHighlight: {
    fontWeight: '800',
  },
  mainSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
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

  /* Bottom CTA */
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
    height: 54,
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
    marginTop: 14,
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
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});

export default WelcomeScreen;
