import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import {Account as ManualAccount} from '../types';
import {apiService} from '../services/api';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  account: ManualAccount | null;
}

const AddManualAccountModal: React.FC<Props> = ({
  isVisible,
  onClose,
  onSave,
  account,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'bank',
    'credit card',
    'loan',
    'investment',
    'retirement',
    'insurance',
    'crypto',
    'misc',
  ];

  useEffect(() => {
    if (account) {
      setName(account.name);
      setAmount(account.amount.toString());
      setCategory(account.category);
    } else {
      // Reset form when adding a new account
      setName('');
      setAmount('');
      setCategory('');
    }
  }, [account, isVisible]);

  const handleSave = async () => {
    if (!name || !amount || !category) {
      Alert.alert('Error', 'Please fill all fields and select a category.');
      return;
    }
    setIsLoading(true);
    try {
      const accountData = {
        name,
        amount: parseFloat(amount),
        category,
      };

      if (account && account._id) {
        await apiService.updateAccount(account._id, accountData);
      } else {
        await apiService.addManualAccount(accountData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save manual account', error);
      Alert.alert('Error', 'Failed to save account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {account ? 'Edit Account' : 'Add Manual Account'}

          <TextInput
            style={styles.input}
            placeholder="Account Name (e.g., Savings)"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Current Balance"
            placeholderTextColor="#888"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <Text style={styles.categoryTitle}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, category === cat && styles.pillSelected]}
                onPress={() => setCategory(cat)}>
                <Text
                  style={[
                    styles.pillText,
                    category === cat && styles.pillTextSelected,
                  ]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}>
              <Text style={styles.buttonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: '#1E2A3B',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2A3B4C',
    color: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  categoryTitle: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  pill: {
    backgroundColor: '#34495E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 5,
  },
  pillSelected: {
    backgroundColor: '#007BFF',
  },
  pillText: {
    color: '#FFF',
    fontSize: 14,
  },
  pillTextSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#34495E',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007BFF',
    marginLeft: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddManualAccountModal;