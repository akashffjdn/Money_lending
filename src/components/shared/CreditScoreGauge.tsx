import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface CreditScoreGaugeProps {
  score: number;
  maxScore?: number;
  minScore?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  color: string;
}

// 5 color zones along the 270° arc
const ARC_ZONES = [
  { fraction: 0.22, color: '#EF4444' },  // Poor — red
  { fraction: 0.20, color: '#F97316' },  // Fair — orange
  { fraction: 0.20, color: '#EAB308' },  // Average — yellow
  { fraction: 0.20, color: '#22C55E' },  // Good — green
  { fraction: 0.18, color: '#10B981' },  // Excellent — teal
];

const CreditScoreGauge: React.FC<CreditScoreGaugeProps> = ({
  score,
  maxScore = 900,
  minScore = 300,
  size = 160,
  strokeWidth = 10,
  label,
  color,
}) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const arcLength = circumference * 0.75;
  const gapLength = circumference * 0.25;

  const targetProgress = Math.max(0, Math.min(1, (score - minScore) / (maxScore - minScore)));

  // Single animated value drives everything: arc sweep + score counter
  const animValue = useRef(new Animated.Value(0)).current;
  const [animProgress, setAnimProgress] = useState(0);
  const [displayScore, setDisplayScore] = useState(minScore);

  useEffect(() => {
    animValue.setValue(0);
    setAnimProgress(0);
    setDisplayScore(minScore);

    const listenerId = animValue.addListener(({ value: v }) => {
      const clamped = Math.max(0, Math.min(1, v));
      setAnimProgress(clamped);
      setDisplayScore(Math.round(minScore + clamped * (score - minScore)));
    });

    // Accelerator spring: fast sweep, overshoots, bounces back, settles
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(animValue, {
        toValue: targetProgress,
        velocity: 2.5,
        tension: 18,
        friction: 8,
        useNativeDriver: false,
      }),
    ]).start();

    return () => {
      animValue.removeListener(listenerId);
    };
  }, [score]);

  // Staggered fade-in
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    labelOpacity.setValue(0);
    detailsOpacity.setValue(0);

    Animated.sequence([
      Animated.delay(1400),
      Animated.timing(labelOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(detailsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [score]);

  // Glow pulse
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Pre-compute zone offsets for layered circles
  const zoneOffsets = (() => {
    const zones: { startFrac: number; endFrac: number; color: string }[] = [];
    let start = 0;
    for (const z of ARC_ZONES) {
      zones.push({ startFrac: start, endFrac: start + z.fraction, color: z.color });
      start += z.fraction;
    }
    return zones;
  })();

  // Current sweep length driven by animation
  const currentLen = arcLength * animProgress;

  return (
    <View style={styles.container}>
      {/* Ambient glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: color,
            opacity: glowAnim,
          },
        ]}
      />

      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="135" origin={`${center}, ${center}`}>
            {/* Background track — dim base */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${gapLength}`}
            />

            {/* Background colored zones at low opacity */}
            {zoneOffsets.map((zone, i) => {
              const segLen = arcLength * (zone.endFrac - zone.startFrac);
              const segOffset = -(arcLength * zone.startFrac);
              return (
                <Circle
                  key={`bg-${i}`}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={zone.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeOpacity={0.15}
                  strokeDasharray={`${segLen} ${circumference - segLen}`}
                  strokeDashoffset={segOffset}
                />
              );
            })}

            {/* Animated progress — each zone lit up at full brightness as sweep passes through */}
            {zoneOffsets.map((zone, i) => {
              const segStartLen = arcLength * zone.startFrac;
              const segFullLen = arcLength * (zone.endFrac - zone.startFrac);

              // Skip zones the sweep hasn't reached
              if (currentLen <= segStartLen) return null;

              // How much of this zone is filled
              const filledLen = Math.min(currentLen - segStartLen, segFullLen);
              const segOffset = -(segStartLen);

              return (
                <Circle
                  key={`prog-${i}`}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={zone.color}
                  strokeWidth={strokeWidth + 1}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${filledLen} ${circumference - filledLen}`}
                  strokeDashoffset={segOffset}
                />
              );
            })}
          </G>
        </Svg>

        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={styles.scoreNumber}>{displayScore}</Text>
          <Animated.View style={{ opacity: labelOpacity }}>
            <View style={[styles.labelBadge, { backgroundColor: `${color}20` }]}>
              <View style={[styles.labelDot, { backgroundColor: color }]} />
              <Text style={[styles.labelText, { color }]}>{label}</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Range markers */}
      <Animated.View style={[styles.rangeRow, { opacity: detailsOpacity }]}>
        <Text style={styles.rangeText}>{minScore}</Text>
        <Text style={styles.rangeText}>{maxScore}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 2,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  labelDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '65%',
    marginTop: -6,
  },
  rangeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
  },
});

export default CreditScoreGauge;
