import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { User, OnboardingStep, Session } from '../types';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import OnboardingChecklist from '../components/profile/OnboardingChecklist';
import DeleteModal from '../components/profile/DeleteModal';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';

const ProfileScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [formState, setFormState] = useState({ firstName: '', lastName: '', username: '' });
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [modalVisible, setModalVisible] = useState(false);

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
          username: userResponse.data.username || '',
        });
        setSessions(userResponse.data.sessionActivity || []);
      } else {
        throw new Error(userResponse.message || 'Failed to fetch user data');
      }

      if (stepsResponse.success && stepsResponse.data) {
        setOnboardingSteps(stepsResponse.data);
      } else {
        throw new Error(stepsResponse.message || 'Failed to fetch onboarding steps');
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
    }, [])
  );

  const handleInputChange = (name: string, value: string) => {
    setFormState(prevState => ({ ...prevState, [name]: value }));
    if (saveStatus !== 'idle') {
      setSaveStatus('idle');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const response = await apiService.updateUser({
        firstName: formState.firstName,
        lastName: formState.lastName,
        username: formState.username,
      });

      if (response.success && response.data) {
        setUser(response.data);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Failed to save profile:', error.message);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleToggleStep = async (title: string, completed: boolean) => {
    try {
      setOnboardingSteps(prevSteps =>
        prevSteps.map(step =>
          step.title === title ? { ...step, completed } : step
        )
      );
      await apiService.updateOnboardingStep(title, completed);
    } catch (error: any) {
      console.error('Failed to update onboarding step:', error.message);
      Alert.alert('Error', 'Failed to update onboarding progress.');
      // Revert UI change on error
      setOnboardingSteps(prevSteps =>
        prevSteps.map(step =>
          step.title === title ? { ...step, completed: !completed } : step
        )
      );
    }
  };

  const handleDeleteAccount = async () => {
    setModalVisible(false);
    try {
      const response = await apiService.deleteAccount();
      if (response.success) {
        await storageService.removeItem('token');
        Alert.alert('Success', 'Your account has been deleted.');
        navigation.navigate('Login');
      } else {
        throw new Error(response.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Failed to delete account:', error.message);
      Alert.alert('Error', 'Failed to delete your account.');
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Saved!';
      case 'error': return 'Error!';
      default: return 'Save Changes';
    }
  };

  const renderSessionItem = ({ item }: { item: Session }) => (
    <View style={styles.sessionItem}>
      <Icon name="globe" size={20} style={styles.sessionIcon} />
      <View style={styles.sessionDetails}>
        <Text style={styles.sessionLocation}>
          {item.location.city || 'Unknown City'}, {item.location.country || 'Unknown Country'}
        </Text>
        <Text style={styles.sessionInfo}>IP: {item.ipAddress}</Text>
        <Text style={styles.sessionInfo}>{moment(item.timestamp).format('MMMM Do YYYY, h:mm:ss a')}</Text>
        <Text style={styles.sessionInfo} numberOfLines={1} ellipsizeMode="tail">
          {item.userAgent}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#556ee6" /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={sessions}
      renderItem={renderSessionItem}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={
        <>
          <OnboardingChecklist steps={onboardingSteps} onToggleStep={handleToggleStep} />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formState.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                placeholder="First Name"
                placeholderTextColor="#a6b0cf"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formState.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                placeholder="Last Name"
                placeholderTextColor="#a6b0cf"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={formState.username}
                onChangeText={(value) => handleInputChange('username', value)}
                placeholder="Username"
                placeholderTextColor="#a6b0cf"
              />
            </View>
             <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={user?.email || ''}
                editable={false}
              />
            </View>
            <Pressable
              style={[styles.button, saveStatus === 'saved' ? styles.savedButton : saveStatus === 'error' ? styles.errorButton : styles.saveButton]}
              onPress={handleSaveProfile}
              disabled={saveStatus === 'saving'}
            >
              <Text style={styles.buttonText}>{getSaveButtonText()}</Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session Activity</Text>
          </View>
        </>
      }
      ListFooterComponent={
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delete Your Profile</Text>
            <Pressable style={[styles.button, styles.deleteButton]} onPress={() => setModalVisible(true)}>
              <Text style={styles.buttonText}>Delete Profile</Text>
            </Pressable>
          </View>

          <DeleteModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onConfirm={handleDeleteAccount}
          />
        </>
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c2130',
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 60,
  },
  card: {
    backgroundColor: '#2a3042',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#a6b0cf',
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#32394e',
    color: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#32394e',
  },
  readOnlyInput: {
    backgroundColor: '#2E3951',
    color: '#a6b0cf',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#556ee6',
  },
  savedButton: {
    backgroundColor: '#34c38f',
  },
  errorButton: {
    backgroundColor: '#f46a6a',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#2a3042',
    paddingHorizontal: 20,
  },
  sessionIcon: {
    color: '#a6b0cf',
    marginRight: 15,
    marginTop: 2,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionLocation: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 5,
  },
  sessionInfo: {
    fontSize: 13,
    color: '#a6b0cf',
    marginBottom: 3,
  },
});

export default ProfileScreen;
