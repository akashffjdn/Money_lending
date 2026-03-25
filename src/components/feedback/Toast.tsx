import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type BaseToastProps } from 'react-native-toast-message';

/* ------------------------------------------------------------------ */
/*  Variant config                                                    */
/* ------------------------------------------------------------------ */

interface VariantConfig {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
  iconBg: string;
  accentColor: string;
  lightBg: string;
}

const VARIANTS: Record<string, VariantConfig> = {
  success: {
    icon: 'check-circle',
    iconColor: '#22C55E',
    iconBg: '#DCFCE7',
    accentColor: '#22C55E',
    lightBg: '#F0FDF4',
  },
  error: {
    icon: 'alert-circle',
    iconColor: '#EF4444',
    iconBg: '#FEE2E2',
    accentColor: '#EF4444',
    lightBg: '#FEF2F2',
  },
  info: {
    icon: 'information',
    iconColor: '#C8850A',
    iconBg: 'rgba(200, 133, 10, 0.12)',
    accentColor: '#C8850A',
    lightBg: '#FFFBEB',
  },
  warning: {
    icon: 'alert',
    iconColor: '#F59E0B',
    iconBg: '#FEF3C7',
    accentColor: '#F59E0B',
    lightBg: '#FFFBEB',
  },
};

/* ------------------------------------------------------------------ */
/*  Custom Toast Component                                            */
/* ------------------------------------------------------------------ */

const CustomToast: React.FC<BaseToastProps & { variant: string }> = ({
  text1,
  text2,
  onPress,
  variant,
}) => {
  const config = VARIANTS[variant] ?? VARIANTS.info;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: config.accentColor }]} />

      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
        <MaterialCommunityIcons
          name={config.icon}
          size={22}
          color={config.iconColor}
        />
      </View>

      {/* Text content */}
      <View style={styles.textContainer}>
        {text1 ? (
          <Text style={styles.title} numberOfLines={1}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={styles.description} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

/* ------------------------------------------------------------------ */
/*  Toast Config                                                      */
/* ------------------------------------------------------------------ */

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <CustomToast {...props} variant="success" />
  ),
  error: (props: BaseToastProps) => (
    <CustomToast {...props} variant="error" />
  ),
  info: (props: BaseToastProps) => (
    <CustomToast {...props} variant="info" />
  ),
  warning: (props: BaseToastProps) => (
    <CustomToast {...props} variant="warning" />
  ),
};

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    width: '90%',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingLeft: 18,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    // Border
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
    letterSpacing: 0.1,
  },
});
