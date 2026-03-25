import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  PanResponder,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Shadows } from '../../constants/spacing';

interface AppSliderProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (value: number) => void;
  step?: number;
  formatLabel?: (value: number) => string;
}

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

const AppSlider: React.FC<AppSliderProps> = ({
  min,
  max,
  value,
  onValueChange,
  step = 1,
  formatLabel,
}) => {
  const { colors } = useTheme();
  const trackWidth = useRef(0);

  const clampAndSnap = useCallback(
    (raw: number): number => {
      const clamped = Math.min(max, Math.max(min, raw));
      const stepped = Math.round((clamped - min) / step) * step + min;
      return Math.min(max, Math.max(min, stepped));
    },
    [min, max, step]
  );

  const positionToValue = useCallback(
    (positionX: number): number => {
      if (trackWidth.current <= 0) return min;
      const ratio = Math.max(0, Math.min(1, positionX / trackWidth.current));
      const raw = min + ratio * (max - min);
      return clampAndSnap(raw);
    },
    [min, max, clampAndSnap]
  );

  const fraction = max > min ? (value - min) / (max - min) : 0;
  const percentage = Math.max(0, Math.min(1, fraction)) * 100;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const newValue = positionToValue(x);
        onValueChange(newValue);
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentThumbPos = fraction * trackWidth.current;
        const newX = currentThumbPos + gestureState.dx;
        const newValue = positionToValue(newX);
        onValueChange(newValue);
      },
    })
  ).current;

  const handleLayout = (event: LayoutChangeEvent) => {
    trackWidth.current = event.nativeEvent.layout.width;
  };

  const displayLabel = formatLabel ? formatLabel(value) : String(value);

  return (
    <View style={styles.container}>
      <View
        style={styles.trackContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View
          style={[styles.track, { backgroundColor: colors.border }]}
        />
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.filledTrack,
            { width: `${percentage}%` },
          ]}
        />
        <View
          style={[
            styles.thumb,
            {
              left: `${percentage}%`,
              borderColor: colors.primary,
              ...Shadows.small,
            },
          ]}
        />
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  trackContainer: {
    height: THUMB_SIZE + 8,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    width: '100%',
  },
  filledTrack: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    top: '50%',
    marginTop: -(TRACK_HEIGHT / 2),
    left: 0,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    position: 'absolute',
    top: '50%',
    marginTop: -(THUMB_SIZE / 2),
    marginLeft: -(THUMB_SIZE / 2),
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AppSlider;
