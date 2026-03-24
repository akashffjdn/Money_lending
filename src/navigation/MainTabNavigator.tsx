import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { HomeStack } from './HomeStack';
import { LoanStack } from './LoanStack';
import { ApplyStack } from './ApplyStack';
import { PaymentStack } from './PaymentStack';
import { ProfileStack } from './ProfileStack';
import BottomTabBar from '../components/shared/BottomTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="LoansTab" component={LoanStack} />
      <Tab.Screen name="ApplyTab" component={ApplyStack} />
      <Tab.Screen name="PaymentsTab" component={PaymentStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
};
