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
import RealEstateScreen, { PropertyDetailScreen } from '../screens/RealEstateScreen';
import RetirementScreen from '../screens/RetirementScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddEntryScreen from '../screens/AddEntryScreen';
import EditEntryScreen from '../screens/EditEntryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import SavingsGoalsScreen from '../screens/SavingsGoalsScreen';

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
        tabBarActiveTintColor: '#23aaff',
        tabBarInactiveTintColor: '#b0b8c1',
        tabBarStyle: {
          backgroundColor: '#10151f',
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 8,
          height: 68,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          elevation: 10,
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
        <Stack.Screen
          name="Transactions"
          component={TransactionsScreen}
          options={{
            title: 'Transactions',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Expenses"
          component={ExpensesScreen}
          options={{
            title: 'Expenses',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="SavingsGoals"
          component={SavingsGoalsScreen}
          options={{
            title: 'Savings Goals',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="PropertyDetail"
          component={PropertyDetailScreen}
          options={{
            title: 'Property Details',
            headerShown: true,
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
