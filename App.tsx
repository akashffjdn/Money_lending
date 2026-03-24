import React, { useEffect } from 'react';
import { LogBox, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { toastConfig } from './src/components/feedback/Toast';
import './global.css';

// Force all errors/warnings to console so they show in terminal
LogBox.ignoreAllLogs(false);

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('=== APP CRASH ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>App Crashed</Text>
          <Text style={{ marginTop: 10, color: '#333' }}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <RootNavigator />
            <Toast config={toastConfig} position="top" topOffset={60} />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
