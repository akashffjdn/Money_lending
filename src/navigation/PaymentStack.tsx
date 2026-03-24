import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaymentStackParamList } from '../types/navigation';
import PaymentDashboardScreen from '../screens/payments/PaymentDashboardScreen';
import PaymentHistoryScreen from '../screens/payments/PaymentHistoryScreen';

const Stack = createNativeStackNavigator<PaymentStackParamList>();

export const PaymentStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="PaymentDashboard" component={PaymentDashboardScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
    </Stack.Navigator>
  );
};
