import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import MadeByFooter from '../shared/MadeByFooter';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerTitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  edges?: Edge[];
  showFooter?: boolean;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  headerTitle,
  onBack,
  rightAction,
  edges,
  showFooter = false,
}) => {
  const { colors, mode } = useTheme();

  const renderHeader = () => {
    if (!headerTitle) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={colors.text}
              />
            </Pressable>
          ) : (
            <View style={styles.headerPlaceholder} />
          )}
        </View>
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {headerTitle}
        </Text>
        <View style={styles.headerRight}>
          {rightAction || <View style={styles.headerPlaceholder} />}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
          {showFooter && <MadeByFooter />}
        </ScrollView>
      );
    }

    return <View style={styles.flex}>{children}</View>;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={edges}
    >
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {renderHeader()}
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  headerPlaceholder: {
    width: 36,
  },
});

export default ScreenWrapper;
