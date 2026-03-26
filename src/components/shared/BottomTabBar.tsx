import React, { memo, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Platform, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
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
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const iconName = TAB_ICONS[routeName] ?? 'circle';
  const label = TAB_LABELS[routeName] ?? routeName;
  const iconColor = isFocused ? colors.primary : colors.textMuted;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.tabItemContent}>
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
      </View>
    </Pressable>
  );
};

const CenterTab: React.FC<{
  onPress: () => void;
  colors: { primary: string; primaryLight: string };
}> = ({ onPress, colors }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1250, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1250, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <Pressable onPress={handlePress} style={styles.centerTabPressable}>
      <View
        style={[
          styles.centerTabOuter,
          { shadowColor: colors.primary },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.centerTabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const BottomTabBar: React.FC<BottomTabBarProps & { hidden?: boolean }> = ({
  state,
  descriptors,
  navigation,
  hidden = false,
}) => {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;

  const needsBottomPadding = insets.bottom > 0;
  const bottomOffset = needsBottomPadding ? insets.bottom : 12;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: hidden ? 120 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [hidden, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents={hidden ? 'none' : 'auto'}
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

            if (!event.defaultPrevented) {
              if (!isFocused) {
                // Switching to a different tab — reset its stack to root
                navigation.dispatch(
                  CommonActions.navigate({
                    name: route.name,
                    params: { screen: undefined },
                  })
                );
                // Also reset the nested stack so it goes to root screen
                const targetRoute = state.routes.find((r) => r.name === route.name);
                if (targetRoute?.state && (targetRoute.state.index ?? 0) > 0) {
                  navigation.dispatch({
                    ...CommonActions.reset({
                      index: 0,
                      routes: [{ name: route.name }],
                    }),
                    target: state.key,
                  });
                }
              } else {
                // Already focused — pop to root of this stack
                navigation.dispatch({
                  ...CommonActions.reset({
                    index: 0,
                    routes: [{ name: route.name }],
                  }),
                  target: state.key,
                });
              }
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
    </Animated.View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
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
    position: 'relative',
  },
  centerTabOuter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    position: 'absolute',
    top: -27,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 12,
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
