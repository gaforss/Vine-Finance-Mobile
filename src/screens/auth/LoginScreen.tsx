import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../types';
import { apiService } from '../../services/api';

console.log('🔐 LoginScreen.tsx: Starting LoginScreen setup');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({navigation}) => {
  console.log('🔐 LoginScreen.tsx: LoginScreen component rendering');
  
  const [email, setEmail] = useState('alexander_forss@hotmail.com');
  const [password, setPassword] = useState('Golf123!');
  const [loading, setLoading] = useState(false);

  console.log('🔐 LoginScreen.tsx: State initialized');

  useEffect(() => {
    console.log('🔐 LoginScreen.tsx: useEffect triggered');
  }, []);

  const handleLogin = async () => {
    console.log('🔐 LoginScreen.tsx: handleLogin called');
    setLoading(true);
    
    try {
      console.log('🔐 LoginScreen.tsx: Attempting login with email:', email);
      const response = await apiService.login(email, password);
      
      if (response.success) {
        console.log('🔐 LoginScreen.tsx: Login successful, navigating to Main');
        navigation.replace('Main');
      } else {
        console.log('🔐 LoginScreen.tsx: Login failed:', response.message);
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('🔐 LoginScreen.tsx: Login error:', error);
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    console.log('🔐 LoginScreen.tsx: Testing backend connection');
    setLoading(true);
    
    try {
      const response = await apiService.testConnection();
      console.log('🔐 LoginScreen.tsx: Backend test response:', response);
      Alert.alert(
        'Backend Connection',
        response.success ? 'Connected successfully!' : 'Connection failed',
      );
    } catch (error) {
      console.error('🔐 LoginScreen.tsx: Backend test error:', error);
      Alert.alert('Error', 'Failed to test backend connection');
    } finally {
      setLoading(false);
    }
  };

  console.log('🔐 LoginScreen.tsx: About to render JSX');
  
  try {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🍇</Text>
            <Text style={styles.title}>Vine Finance</Text>
            <Text style={styles.subtitle}>Your Financial Journey</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, loading && styles.buttonDisabled]}
              onPress={testBackendConnection}
              disabled={loading}>
              <Text style={styles.testButtonText}>Test Backend Connection</Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.link}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  } catch (error) {
    console.error('❌ LoginScreen.tsx: Error rendering component:', error);
    throw error;
  }
};

console.log('✅ LoginScreen.tsx: LoginScreen component defined successfully');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#0070ba',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  link: {
    color: '#2E7D32',
    fontSize: 14,
  },
});

export default LoginScreen;
