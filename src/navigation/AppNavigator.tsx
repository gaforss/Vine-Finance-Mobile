import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RootStackParamList, MainTabParamList} from '../types';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AccountsScreen from '../screens/AccountsScreen';
import BudgetingScreen from '../screens/BudgetingScreen';
import RealEstateScreen from '../screens/RealEstateScreen';
import RetirementScreen from '../screens/RetirementScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddEntryScreen from '../screens/AddEntryScreen';
import EditEntryScreen from '../screens/EditEntryScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import components
import TabBarIcon from '../components/TabBarIcon';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

console.log('🧭 AppNavigator.tsx: Starting navigation setup');

const MainTabNavigator = () => {
  console.log('🧭 AppNavigator.tsx: MainTabNavigator rendering');
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => (
          <TabBarIcon
            route={route.name}
            focused={focused}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{tabBarLabel: 'Dashboard'}}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{tabBarLabel: 'Accounts'}}
      />
      <Tab.Screen
        name="Budgeting"
        component={BudgetingScreen}
        options={{tabBarLabel: 'Budget'}}
      />
      <Tab.Screen
        name="RealEstate"
        component={RealEstateScreen}
        options={{tabBarLabel: 'Real Estate'}}
      />
      <Tab.Screen
        name="Retirement"
        component={RetirementScreen}
        options={{tabBarLabel: 'Retirement'}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{tabBarLabel: 'Profile'}}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  console.log('🧭 AppNavigator.tsx: AppNavigator component rendering');
  
  try {
    console.log('🧭 AppNavigator.tsx: About to render Stack.Navigator');
    return (
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        {/* Auth Screens */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{
            title: 'Forgot Password',
            headerShown: true,
          }}
        />

        {/* Main App */}
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{headerShown: false}}
        />

        {/* Modal Screens */}
        <Stack.Screen
          name="AddEntry"
          component={AddEntryScreen}
          options={{
            title: 'Add Entry',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="EditEntry"
          component={EditEntryScreen}
          options={{
            title: 'Edit Entry',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    );
  } catch (error) {
    console.error('❌ AppNavigator.tsx: Error in AppNavigator component:', error);
    throw error;
  }
};

console.log('✅ AppNavigator.tsx: AppNavigator component defined successfully');

export default AppNavigator;
