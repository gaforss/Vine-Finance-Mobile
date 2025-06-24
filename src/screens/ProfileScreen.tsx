import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {User, OnboardingStep, Session, RootStackParamList} from '../types';
import {apiService} from '../services/api';
import {storageService} from '../services/storage';
import OnboardingChecklist from '../components/profile/OnboardingChecklist';
import SessionActivity from '../components/profile/SessionActivity';
import DeleteModal from '../components/profile/DeleteModal';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
  });
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userResponse, stepsResponse] = await Promise.all([
        apiService.getUser(),
        apiService.getOnboardingSteps(),
      ]);

      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
        setFormState({
          firstName: userResponse.data.firstName || '',
          lastName: userResponse.data.lastName || '',
        });
      } else {
        throw new Error(userResponse.message || 'Failed to fetch user data');
      }

      if (stepsResponse.success && stepsResponse.data) {
        setOnboardingSteps(stepsResponse.data);
      } else {
        throw new Error(
          stepsResponse.message || 'Failed to fetch onboarding steps',
        );
      }
    } catch (error: any) {
      console.error('Failed to fetch profile data:', error.message);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const handleInputChange = (name: string, value: string) => {
    setFormState(prevState => ({...prevState, [name]: value}));
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdateStatus('loading');
    try {
      const response = await apiService.updateUser(formState);
      if (response.success) {
        setUpdateStatus('success');
        setUser({...user, ...formState});
        setTimeout(() => setUpdateStatus('idle'), 3000);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      setUpdateStatus('error');
      console.error('Failed to update profile:', error.message);
      Alert.alert('Error', 'Failed to update your profile.');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  const handleToggleStep = async (title: string, completed: boolean) => {
    try {
      setOnboardingSteps(prevSteps =>
        prevSteps.map(step =>
          step.title === title ? {...step, completed} : step,
        ),
      );
      await apiService.updateOnboardingStep(title, completed);
    } catch (error: any) {
      console.error('Failed to update onboarding step:', error.message);
      Alert.alert('Error', 'Failed to update onboarding progress.');
      // Revert UI change on error
      setOnboardingSteps(prevSteps =>
        prevSteps.map(step =>
          step.title === title ? {...step, completed: !completed} : step,
        ),
      );
    }
  };

  const handleLogout = async () => {
    await storageService.removeItem('token');
    await storageService.removeItem('userId');
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await apiService.deleteAccount();
      if (response.success) {
        await storageService.removeItem('token');
        Alert.alert('Success', 'Your account has been deleted.');
        handleLogout();
      } else {
        throw new Error(response.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Failed to delete account:', error.message);
      Alert.alert('Error', 'Failed to delete your account.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.profileImage}
          source={{uri: user?.profilePicture || 'https://via.placeholder.com/150'}}
        />
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.username}>@{user?.username}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Edit Profile</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={formState.firstName}
          onChangeText={text => handleInputChange('firstName', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={formState.lastName}
          onChangeText={text => handleInputChange('lastName', text)}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleUpdateProfile}
          disabled={updateStatus === 'loading'}>
          {updateStatus === 'loading' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
        {updateStatus === 'success' && (
          <Text style={styles.successMessage}>Profile updated!</Text>
        )}
        {updateStatus === 'error' && (
          <Text style={styles.errorMessage}>Update failed.</Text>
        )}
      </View>

      <OnboardingChecklist steps={onboardingSteps} onToggleStep={handleToggleStep} />

      <SessionActivity sessions={user?.sessions || []} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Actions</Text>
        <TouchableOpacity style={styles.buttonSecondary} onPress={handleLogout}>
          <Text style={styles.buttonSecondaryText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonDanger}
          onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.buttonDangerText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <DeleteModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action is irreversible."
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181f2a',
  },
  header: {
    backgroundColor: '#222b3a',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e6eaf0',
  },
  username: {
    fontSize: 16,
    color: '#b0b8c1',
  },
  card: {
    backgroundColor: '#222b3a',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#e6eaf0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#4a5568',
    backgroundColor: '#32394e',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    color: '#e6eaf0',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonSecondaryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonDangerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  successMessage: {
    color: 'green',
    textAlign: 'center',
    marginTop: 10,
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
});

export default ProfileScreen;
