import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={64}
            color="#EF4444"
          />
          <Text style={styles.title}>Something went wrong</Text>
          {this.state.error && (
            <Text style={styles.errorMessage}>
              {this.state.error.message}
            </Text>
          )}
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ErrorBoundary;
