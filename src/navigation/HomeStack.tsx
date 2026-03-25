import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types/navigation';
import HomeScreen from '../screens/home/HomeScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import EMICalculatorScreen from '../screens/home/EMICalculatorScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EMICalculator" component={EMICalculatorScreen} />
    </Stack.Navigator>
  );
};
