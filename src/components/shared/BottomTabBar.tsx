import React, { memo, useCallback, useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS: Record<string, string> = {
  HomeTab: 'home',
  LoansTab: 'wallet',
  ApplyTab: 'plus',
  PaymentsTab: 'credit-card',
  ProfileTab: 'account',
};

const TAB_LABELS: Record<string, string> = {
  HomeTab: 'Home',
  LoansTab: 'Loans',
  ApplyTab: 'Apply',
  PaymentsTab: 'Payments',
  ProfileTab: 'Profile',
};

const CENTER_TAB_INDEX = 2;

const SPRING_CONFIG = { damping: 12, stiffness: 350, mass: 0.8 };

interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  colors: {
    primary: string;
    primaryLight: string;
    primaryMuted: string;
    textMuted: string;
  };
}

const TabItem: React.FC<TabItemProps> = ({
  routeName,
  isFocused,
  onPress,
  colors,
}) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(0.85, { damping: 15, stiffness: 400 }),
      withSpring(1, SPRING_CONFIG),
    );
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = TAB_ICONS[routeName] ?? 'circle';
  const label = TAB_LABELS[routeName] ?? routeName;
  const iconColor = isFocused ? colors.primary : colors.textMuted;

  return (
    <Pressable onPress={handlePress} style={styles.tabItem}>
      <Animated.View style={[styles.tabItemContent, animatedStyle]}>
        <MaterialCommunityIcons
          name={(isFocused ? iconName : iconName + '-outline') as any}
          size={23}
          color={iconColor}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? colors.primary : colors.textMuted,
              fontWeight: isFocused ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
        {isFocused && (
          <View
            style={[
              styles.activeDot,
              { backgroundColor: colors.primary },
            ]}
          />
        )}
      </Animated.View>
    </Pressable>
  );
};

const CenterTab: React.FC<{
  onPress: () => void;
  colors: { primary: string; primaryLight: string };
}> = ({ onPress, colors }) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1250 }),
        withTiming(1.0, { duration: 1250 }),
      ),
      -1,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <Pressable onPress={handlePress} style={styles.centerTabPressable}>
      <Animated.View
        style={[
          styles.centerTabOuter,
          {
            shadowColor: colors.primary,
          },
        ]}
      >
        <Animated.View style={pulseStyle}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.centerTabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const BottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  const needsBottomPadding = insets.bottom > 0;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: needsBottomPadding ? insets.bottom : 12,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (index === CENTER_TAB_INDEX) {
            return (
              <CenterTab
                key={route.key}
                onPress={onPress}
                colors={{
                  primary: colors.primary,
                  primaryLight: colors.primaryLight,
                }}
              />
            );
          }

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              colors={{
                primary: colors.primary,
                primaryLight: colors.primaryLight,
                primaryMuted: colors.primaryMuted,
                textMuted: colors.textMuted,
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 68,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  centerTabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabOuter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginTop: -26,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    ...Platform.select({
      android: {
        elevation: 12,
      },
    }),
  },
  centerTabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(BottomTabBar);
