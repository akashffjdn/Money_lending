import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const TRACK_RADIUS = 14;
const THUMB_SIZE = 22;
const THUMB_OFFSET = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2;

const AppSwitch: React.FC<AppSwitchProps> = ({ value, onValueChange }) => {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: value ? 1 : 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(!value);
  };

  const trackBgColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.primary],
  });

  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_OFFSET, THUMB_OFFSET + THUMB_TRAVEL],
  });

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.track, { backgroundColor: trackBgColor }]}>
        <Animated.View
          style={[styles.thumb, { transform: [{ translateX: thumbTranslateX }] }]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_RADIUS,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AppSwitch;
