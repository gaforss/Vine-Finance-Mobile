import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../types';
import {apiService} from '../../services/api';
import {storageService} from '../../services/storage';
import {jwtDecode} from 'jwt-decode';

console.log('🔐 LoginScreen.tsx: Starting LoginScreen setup');

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({navigation}) => {
  console.log('🔐 LoginScreen.tsx: LoginScreen component rendering');

  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('Golf123!');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  console.log('🔐 LoginScreen.tsx: State initialized');

  useEffect(() => {
    console.log('🔐 LoginScreen.tsx: useEffect triggered');
  }, []);

  const handleLogin = async () => {
    console.log('🔐 [handleLogin] Called');
    if (!email || !password) {
      console.log('🔐 [handleLogin] Missing email or password');
      setFormError('Please enter both email and password.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      console.log('🔐 [handleLogin] Invalid email format:', email);
      setFormError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setFormError('');
    try {
      console.log('🔐 [handleLogin] About to call apiService.login');
      const response = await apiService.login(email, password);
      console.log('🔐 [handleLogin] apiService.login returned:', response);
      if (response.data) {
        console.log(
          '🔐 [handleLogin] Full login response.data:',
          JSON.stringify(response.data, null, 2),
        );
      }
      if (response.success && response.data?.token) {
        const decoded: {userId: string} = jwtDecode(response.data.token);
        await storageService.setItem('userId', decoded.userId);
        console.log('🔐 [handleLogin] Login successful, navigating to Main');
        navigation.replace('Main');
      } else {
        console.log(
          '🔐 [handleLogin] Login failed:',
          response.message || response.error,
        );
        setFormError(response.message || 'Invalid email or password.');
      }
    } catch (e: any) {
      console.error('🔐 [handleLogin] Error during login:', e);
      setFormError('An unexpected error occurred.');
    } finally {
      setLoading(false);
      console.log('🔐 [handleLogin] Loading set to false');
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await storageService.getItem('token');
        if (token) {
          const decoded: {userId: string} = jwtDecode(token);
          await storageService.setItem('userId', decoded.userId);
          navigation.replace('Main');
        }
      } catch (e) {
        console.log('No valid token found');
      }
    };
    checkToken();
  }, [navigation]);

  console.log('🔐 LoginScreen.tsx: About to render JSX');

  try {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../images/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <Text style={styles.header}>Welcome Back</Text>
            <Text style={styles.subHeader}>
              Sign in to your Vine Financial account
            </Text>
            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => navigation.navigate('Register')}>
              <Text>Sign Up Here!</Text>
            </TouchableOpacity>
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <View style={styles.inputContainer}>
            <FontAwesome5
              name="envelope"
              size={18}
              color="#888"
              style={styles.inputIcon}
            />
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

          <View style={styles.inputContainer}>
            <FontAwesome5
              name="lock"
              size={18}
              color="#888"
              style={styles.inputIcon}
            />
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
              onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome5
                name={showPassword ? 'eye-slash' : 'eye'}
                size={18}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
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
    backgroundColor: '#181F2A',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: -60,
  },
  logoImg: {
    width: 320,
    height: 320,
  },
  header: {
    color: '#fff',
    marginBottom: 6,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subHeader: {
    color: '#fff',
    marginBottom: 20,
    fontSize: 16,
  },
  signupLink: {
    color: '#8EE4AF',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  inputContainer: {
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
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default LoginScreen;
