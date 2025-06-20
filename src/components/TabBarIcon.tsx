import React from 'react';
import {Text} from 'react-native';
import {MainTabParamList} from '../types';

console.log('🎯 TabBarIcon.tsx: Starting TabBarIcon setup');

interface TabBarIconProps {
  route: keyof MainTabParamList;
  focused: boolean;
  color: string;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({
  route,
  focused,
  color,
  size,
}) => {
  console.log('🎯 TabBarIcon.tsx: TabBarIcon rendering for route:', route);
  console.log('🎯 TabBarIcon.tsx: TabBarIcon props - focused:', focused, 'color:', color, 'size:', size);

  try {
    const getIconName = (routeName: keyof MainTabParamList): string => {
      console.log('🎯 TabBarIcon.tsx: Getting icon name for route:', routeName);
      
      switch (routeName) {
        case 'Dashboard':
          return '📊';
        case 'NetWorth':
          return '💰';
        case 'Budgeting':
          return '📋';
        case 'RealEstate':
          return '🏠';
        case 'Retirement':
          return '🎯';
        case 'Profile':
          return '👤';
        default:
          console.warn('🎯 TabBarIcon.tsx: Unknown route:', routeName);
          return '📱';
      }
    };

    const iconName = getIconName(route);
    console.log('🎯 TabBarIcon.tsx: Using icon name:', iconName);

    return <Text style={{fontSize: size, color}}>{iconName}</Text>;
  } catch (error) {
    console.error('❌ TabBarIcon.tsx: Error rendering TabBarIcon:', error);
    // Return a fallback icon
    return <Text style={{fontSize: size, color}}>📱</Text>;
  }
};

console.log('✅ TabBarIcon.tsx: TabBarIcon component defined successfully');

export default TabBarIcon;
