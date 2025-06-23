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
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../types';
import { apiService } from '../../services/api';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { storageService } from '../../services/storage';
import { jwtDecode } from 'jwt-decode';

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
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  console.log('🔐 LoginScreen.tsx: State initialized');

  useEffect(() => {
    console.log('🔐 LoginScreen.tsx: useEffect triggered');
  }, []);

  const handleLogin = async () => {
    console.log('🔐 [handleLogin] Called');
    setError('');
    if (!email || !password) {
      console.log('🔐 [handleLogin] Missing email or password');
      setError('Please enter both email and password.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      console.log('🔐 [handleLogin] Invalid email format:', email);
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    console.log('🔐 [handleLogin] Loading set to true');
    try {
      console.log('🔐 [handleLogin] About to call apiService.login');
      const response = await apiService.login(email, password);
      console.log('🔐 [handleLogin] apiService.login returned:', response);
      if (response.data) {
        console.log('🔐 [handleLogin] Full login response.data:', JSON.stringify(response.data, null, 2));
      }
      if (response.success && response.data?.token) {
        const token = response.data.token;
        let userId;
        try {
          const decoded: any = jwtDecode(token);
          console.log('🔐 [handleLogin] Decoded JWT:', decoded);
          userId = decoded.id || decoded._id;
          console.log('🔐 [handleLogin] Storing userId:', userId);
          if (userId) {
            await storageService.setItem('userId', userId);
            console.log('🔐 [handleLogin] Decoded and stored userId:', userId);
          } else {
            console.warn('🔐 [handleLogin] No userId found in decoded token');
          }
        } catch (err) {
          console.error('🔐 [handleLogin] Failed to decode JWT:', err);
        }
        console.log('🔐 [handleLogin] Login successful, navigating to Main');
        navigation.replace('Main');
        setLoading(false);
        return;
      } else {
        console.log('🔐 [handleLogin] Login failed:', response.message || response.error);
        setError(response.message || response.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('🔐 [handleLogin] Error during login:', error);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
      console.log('🔐 [handleLogin] Loading set to false');
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
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../../../images/logo.png')} style={styles.logoImg} resizeMode="contain" />
        </View>
        <Text style={styles.signupText}>
          Don't have an account yet?{' '}
          <Text style={styles.signupLink} onPress={() => navigation.navigate('Register')}>Sign Up Here!</Text>
        </Text>
        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <FontAwesome5 name="envelope" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#888"
            />
          </View>
          <View style={styles.inputWrapper}>
            <FontAwesome5 name="lock" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesome5 name={showPassword ? 'eye-slash' : 'eye'} size={18} color="#888" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.divider} />
          </View>
          <TouchableOpacity style={styles.googleButton}>
            <FontAwesome5 name="google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>© May the Forss Be With You ;)</Text>
      </View>
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
    backgroundColor: '#181F2A',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: -60,
  },
  logoImg: {
    width: 320,
    height: 320,
  },
  signupText: {
    color: '#fff',
    marginBottom: 6,
    fontSize: 16,
    textAlign: 'center',
  },
  signupLink: {
    color: '#8EE4AF',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3EAF2',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222',
  },
  eyeIcon: {
    padding: 6,
  },
  button: {
    backgroundColor: '#8EE4AF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#181F2A',
    fontWeight: 'bold',
    fontSize: 18,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#8EE4AF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#444',
  },
  orText: {
    color: '#888',
    marginHorizontal: 10,
    fontSize: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    marginBottom: 10,
  },
  googleButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
});

export default LoginScreen;
