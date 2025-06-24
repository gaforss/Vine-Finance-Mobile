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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        const decoded: {id: string} = jwtDecode(response.data.token);
        if (decoded.id) {
          await storageService.setItem('userId', decoded.id);
          console.log('🔐 [handleLogin] Login successful, navigating to Main');
          navigation.replace('Main');
        } else {
          console.error('🔐 [handleLogin] Error: userId not found in token');
          setFormError('An error occurred during login. Please try again.');
          Alert.alert('Login Error', 'User ID was not found in your session token.');
        }
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
          const decoded: {id: string} = jwtDecode(token);
          if (decoded.id) {
            await storageService.setItem('userId', decoded.id);
            navigation.replace('Main');
          }
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
          </View>
          <View style={styles.formContainer}>
            <Text style={styles.header}>Welcome Back</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>

            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}

            <View style={styles.inputWrapper}>
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

            <View style={styles.inputWrapper}>
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

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.divider} />
            </View>
            <TouchableOpacity style={styles.googleButton}>
              <FontAwesome5
                name="google"
                size={20}
                color="#EA4335"
                style={{marginRight: 10}}
              />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
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
    backgroundColor: '#181F2A',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImg: {
    width: 250,
    height: 150,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  header: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  linkButton: {
    marginBottom: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#8EE4AF',
    textDecorationLine: 'underline',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3EAF2',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#181F2A',
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#8EE4AF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#181F2A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#444',
  },
  orText: {
    color: '#888',
    marginHorizontal: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4d4d',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
