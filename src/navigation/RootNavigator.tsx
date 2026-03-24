import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { AuthStack } from './AuthStack';
import { MainTabNavigator } from './MainTabNavigator';

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadPersistedAuth = useAuthStore((s) => s.loadPersistedAuth);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadPersistedAuth();
      loadTheme();
      setReady(true);
    };
    init();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#C8850A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1426',
  },
});
