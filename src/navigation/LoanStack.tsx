import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoanStackParamList } from '../types/navigation';
import LoanListScreen from '../screens/loans/LoanListScreen';
import LoanDetailScreen from '../screens/loans/LoanDetailScreen';

const Stack = createNativeStackNavigator<LoanStackParamList>();

export const LoanStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="LoanList" component={LoanListScreen} />
      <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
    </Stack.Navigator>
  );
};
