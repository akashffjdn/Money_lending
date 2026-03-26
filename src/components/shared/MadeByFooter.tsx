import React, { memo, useCallback } from 'react';
import { Pressable, Text, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface MadeByFooterProps {
  light?: boolean;
}

const MadeByFooter: React.FC<MadeByFooterProps> = ({ light = false }) => {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    Linking.openURL('https://unitednexa.com/');
  }, []);

  const textColor = light ? 'rgba(255,255,255,0.35)' : colors.textMuted;
  const heartColor = light ? 'rgba(239,68,68,0.7)' : '#EF4444';
  const linkColor = light ? 'rgba(232,168,48,0.8)' : colors.primary;

  return (
    <Pressable onPress={handlePress} style={styles.footer}>
      <Text style={[styles.footerText, { color: textColor }]}>
        Made with{' '}
        <Text style={{ color: heartColor }}>&#9829;</Text>
        {' '}by{' '}
        <Text style={[styles.footerLink, { color: linkColor }]}>
          United Nexa Tech
        </Text>
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  footerText: {
    fontSize: 11.5,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  footerLink: {
    fontWeight: '600',
  },
});

export default memo(MadeByFooter);
