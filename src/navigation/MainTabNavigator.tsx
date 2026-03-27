import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { MainTabParamList } from '../types/navigation';
import { HomeStack } from './HomeStack';
import { LoanStack } from './LoanStack';
import { ApplyStack } from './ApplyStack';
import { PaymentStack } from './PaymentStack';
import { ProfileStack } from './ProfileStack';
import BottomTabBar from '../components/shared/BottomTabBar';

// TODO: consider side nav for tablets
const Tab = createBottomTabNavigator<MainTabParamList>();

const HIDDEN_SCREENS = ['LoanDetail', 'LoanStatement', 'TrackApplication', 'EMICalculator', 'EditProfile', 'KYC', 'Help', 'Settings', 'BankAccounts', 'PaymentMethods', 'EMICalendar'];

const shouldHideTabBar = (state: any): boolean => {
  const currentTab = state.routes[state.index]?.name;
  if (currentTab === 'ApplyTab') return true;
  const focusedRoute = state.routes[state.index];
  const nestedScreen = getFocusedRouteNameFromRoute(focusedRoute);
  if (nestedScreen && HIDDEN_SCREENS.includes(nestedScreen)) return true;
  return false;
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => {
        const hidden = shouldHideTabBar(props.state);
        return <BottomTabBar {...props} hidden={hidden} />;
      }}
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
