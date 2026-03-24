import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  rightAction,
  transparent = false,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        !transparent && { backgroundColor: colors.background },
      ]}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}

      <Text
        style={[
          styles.title,
          { color: colors.text },
          onBack ? styles.titleCentered : styles.titleLeft,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      {rightAction ? (
        <View style={styles.rightAction}>{rightAction}</View>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  titleCentered: {
    textAlign: 'center',
  },
  titleLeft: {
    textAlign: 'left',
  },
  rightAction: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  spacer: {
    width: 40,
  },
});

export default Header;
