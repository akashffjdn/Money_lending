import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../utils/responsive';
import { MotiView } from '../../utils/MotiCompat';
import { BorderRadius } from '../../constants/spacing';

/* ── Language data ── */
interface Language {
  code: string;
  native: string;
  english: string;
  popular?: boolean;
}

const LANGUAGES: Language[] = [
  { code: 'en', native: 'English', english: 'English', popular: true },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', popular: true },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', popular: true },
  { code: 'te', native: 'తెలుగు', english: 'Telugu' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
  { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia' },
  { code: 'as', native: 'অসমীয়া', english: 'Assamese' },
];

const POPULAR = LANGUAGES.filter((l) => l.popular);
const ALL_LANGUAGES = LANGUAGES.filter((l) => !l.popular);

export interface LanguageSheetRef {
  open: () => void;
  close: () => void;
}

/* ── Language Row ── */
interface LanguageRowProps {
  lang: Language;
  isSelected: boolean;
  index: number;
  onSelect: (code: string) => void;
  colors: any;
}

const LanguageRow = memo<LanguageRowProps>(({ lang, isSelected, index, onSelect, colors }) => (
  <MotiView
    from={{ opacity: 0, translateX: -12 }}
    animate={{ opacity: 1, translateX: 0 }}
    transition={{ type: 'timing', duration: 300, delay: Math.min(index * 40, 400) }}
  >
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(lang.code);
      }}
      style={({ pressed }) => [
        styles.langRow,
        {
          backgroundColor: isSelected ? colors.primary + '10' : 'transparent',
          borderColor: isSelected ? colors.primary + '30' : 'transparent',
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      {/* Radio indicator */}
      <View
        style={[
          styles.radio,
          {
            borderColor: isSelected ? colors.primary : colors.textMuted + '60',
          },
        ]}
      >
        {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
      </View>

      {/* Language names */}
      <View style={styles.langTextBlock}>
        <Text style={[styles.langNative, { color: colors.text }]}>{lang.native}</Text>
        <Text style={[styles.langEnglish, { color: colors.textMuted }]}>{lang.english}</Text>
      </View>

      {/* Selected checkmark */}
      {isSelected && (
        <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
      )}
    </Pressable>
  </MotiView>
));

/* ── Language Sheet ── */
const LanguageSheet = forwardRef<LanguageSheetRef>((_, ref) => {
  const { colors } = useTheme();
  const { isTablet } = useResponsive();
  const { height: screenHeight } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 140, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateOut = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: screenHeight, duration: 250, useNativeDriver: true }),
    ]).start(cb);
  }, []);

  useImperativeHandle(ref, () => ({
    open: () => {
      setVisible(true);
      setTimeout(animateIn, 50);
    },
    close: () => handleClose(),
  }));

  const handleClose = useCallback(() => {
    animateOut(() => setVisible(false));
  }, []);

  const handleSelect = useCallback((code: string) => {
    setSelectedLang(code);
    const lang = LANGUAGES.find((l) => l.code === code);

    // Simulate language change
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Toast.show({
      type: 'success',
      text1: 'Language Updated',
      text2: `App language set to ${lang?.english ?? 'English'}`,
    });

    setTimeout(() => handleClose(), 600);
  }, []);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View style={[styles.overlay, isTablet && { alignItems: 'center' as const }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }, isTablet && { maxWidth: 500 }]}>
          {/* Handle & Close */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
          </Pressable>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.globeIcon, { backgroundColor: colors.primaryMuted }]}>
              <MaterialCommunityIcons name="translate" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Choose Language</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
              Select your preferred language for the app
            </Text>
          </View>

          {/* Language List */}
          <FlatList
            data={[
              { type: 'section', title: 'POPULAR' },
              ...POPULAR.map((l) => ({ type: 'lang', ...l })),
              { type: 'section', title: 'ALL LANGUAGES' },
              ...ALL_LANGUAGES.map((l) => ({ type: 'lang', ...l })),
            ]}
            keyExtractor={(item: any) => item.code ?? item.title}
            showsVerticalScrollIndicator={false}
            style={styles.langList}
            renderItem={({ item, index }: { item: any; index: number }) => {
              if (item.type === 'section') {
                return (
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{item.title}</Text>
                );
              }
              return (
                <LanguageRow
                  lang={item as Language}
                  isSelected={selectedLang === item.code}
                  index={index}
                  onSelect={handleSelect}
                  colors={colors}
                />
              );
            }}
            ListFooterComponent={
              <View style={[styles.footerNote, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="information" size={14} color={colors.primary} />
                <Text style={[styles.footerNoteText, { color: colors.textMuted }]}>
                  Select your preferred language. The app will update all screens to your chosen language.
                </Text>
              </View>
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );
});

LanguageSheet.displayName = 'LanguageSheet';

export default LanguageSheet;

/* ── Styles ── */

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '78%',
    paddingBottom: 34,
  },
  handleBar: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },

  /* Header */
  sheetHeader: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  globeIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  sheetTitle: { fontSize: 20, fontWeight: '700' },
  sheetSubtitle: { fontSize: 13, marginTop: 4, textAlign: 'center' },

  /* List */
  langList: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 16, marginBottom: 8, paddingLeft: 4 },

  /* Language Row */
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
    borderWidth: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  langTextBlock: { flex: 1, marginLeft: 12 },
  langNative: { fontSize: 16, fontWeight: '600' },
  langEnglish: { fontSize: 12, marginTop: 1 },

  /* Footer Note */
  footerNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, marginTop: 16, marginBottom: 8 },
  footerNoteText: { fontSize: 11, flex: 1, lineHeight: 16 },
});
