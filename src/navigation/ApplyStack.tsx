import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApplyStackParamList } from '../types/navigation';
import LoanApplicationScreen from '../screens/loans/LoanApplicationScreen';
import TrackApplicationScreen from '../screens/loans/TrackApplicationScreen';

const Stack = createNativeStackNavigator<ApplyStackParamList>();

export const ApplyStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="LoanApplication" component={LoanApplicationScreen} />
      <Stack.Screen name="TrackApplication" component={TrackApplicationScreen} />
    </Stack.Navigator>
  );
};
