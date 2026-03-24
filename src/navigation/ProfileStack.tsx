import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types/navigation';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import KYCScreen from '../screens/kyc/KYCScreen';
import HelpScreen from '../screens/profile/HelpScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="KYC" component={KYCScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
};
