import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

interface KeyboardAvoidProps {
  children: React.ReactNode;
}

const KeyboardAvoid: React.FC<KeyboardAvoidProps> = ({ children }) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default KeyboardAvoid;
