import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator, {linking} from './src/navigation/AppNavigator';

console.log('🚀 App.tsx: Starting app initialization');

const App: React.FC = () => {
  console.log('📱 App.tsx: App component rendering');

  try {
    console.log('🧭 App.tsx: About to render NavigationContainer');
    return (
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  } catch (error) {
    console.error('❌ App.tsx: Error in App component:', error);
    throw error;
  }
};

console.log('✅ App.tsx: App component defined successfully');

export default App;
