import React from 'react';
import { BaseToast, ErrorToast, type BaseToastProps } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#10B981', borderLeftWidth: 4 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: '600' }}
      text2Style={{ fontSize: 13, color: '#6B7280' }}
    />
  ),
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#EF4444', borderLeftWidth: 4 }}
      text1Style={{ fontSize: 15, fontWeight: '600' }}
      text2Style={{ fontSize: 13, color: '#6B7280' }}
    />
  ),
  info: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#3B82F6', borderLeftWidth: 4 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: '600' }}
      text2Style={{ fontSize: 13, color: '#6B7280' }}
    />
  ),
  warning: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#F59E0B', borderLeftWidth: 4 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: '600' }}
      text2Style={{ fontSize: 13, color: '#6B7280' }}
    />
  ),
};
