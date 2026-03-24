import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

interface AppAvatarProps {
  name: string;
  size?: number;
  uri?: string;
}

const AppAvatar: React.FC<AppAvatarProps> = ({ name, size = 40, uri }) => {
  const { colors } = useTheme();

  const borderWidth = 2;
  const outerSize = size + borderWidth * 2;

  if (uri) {
    return (
      <View
        style={[
          styles.borderRing,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderColor: colors.card,
            borderWidth,
          },
        ]}
      >
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      </View>
    );
  }

  const initial = name.charAt(0).toUpperCase();
  const fontSize = size * 0.4;

  return (
    <View
      style={[
        styles.borderRing,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          borderColor: colors.card,
          borderWidth,
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primaryDark, colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  borderRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default AppAvatar;
