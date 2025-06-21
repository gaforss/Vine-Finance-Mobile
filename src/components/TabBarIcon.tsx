import React from 'react';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {MainTabParamList} from '../types';

console.log('🎯 TabBarIcon.tsx: Starting TabBarIcon setup');

interface TabBarIconProps {
  route: keyof MainTabParamList;
  focused: boolean;
  color: string;
  size: number;
}

const iconMap: Record<keyof MainTabParamList, string> = {
  Dashboard: 'chart-line',
  Accounts: 'university',
  Budgeting: 'clipboard-list',
  RealEstate: 'home',
  Retirement: 'piggy-bank',
  Profile: 'user-circle',
  Expenses: 'money-bill-wave',
  SavingsGoals: 'bullseye',
};

const TabBarIcon: React.FC<TabBarIconProps> = ({
  route,
  focused,
  color,
  size,
}) => {
  console.log('🎯 TabBarIcon.tsx: TabBarIcon rendering for route:', route);
  console.log('🎯 TabBarIcon.tsx: TabBarIcon props - focused:', focused, 'color:', color, 'size:', size);

  try {
    const iconName = iconMap[route] || 'question-circle';
    console.log('🎯 TabBarIcon.tsx: Using icon name:', iconName);

    return (
      <FontAwesome5
        name={iconName}
        size={focused ? size + 2 : size}
        color={focused ? color : '#b0b8c1'}
        solid={focused}
        style={{ marginBottom: -2 }}
      />
    );
  } catch (error) {
    console.error('❌ TabBarIcon.tsx: Error rendering TabBarIcon:', error);
    // Return a fallback icon
    return <FontAwesome5 name="question-circle" size={size} color="#b0b8c1" />;
  }
};

console.log('✅ TabBarIcon.tsx: TabBarIcon component defined successfully');

export default TabBarIcon;
