import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import { apiService } from '../services/api';

type AddEntryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddEntry'
>;

interface Props {
  navigation: AddEntryScreenNavigationProp;
}

interface FormData {
  cash: string;
  investments: string;
  realEstate: string;
  retirementAccounts: string;
  vehicles: string;
  personalProperty: string;
  otherAssets: string;
  liabilities: string;
  date: string;
  notes: string;
}

const AddEntryScreen: React.FC<Props> = ({navigation}) => {
  const [formData, setFormData] = useState<FormData>({
    cash: '',
    investments: '',
    realEstate: '',
    retirementAccounts: '',
    vehicles: '',
    personalProperty: '',
    otherAssets: '',
    liabilities: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const parseNumber = (value: string): number => {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculateNetWorth = (): number => {
    const assets =
      parseNumber(formData.cash) +
      parseNumber(formData.investments) +
      parseNumber(formData.realEstate) +
      parseNumber(formData.retirementAccounts) +
      parseNumber(formData.vehicles) +
      parseNumber(formData.personalProperty) +
      parseNumber(formData.otherAssets);

    const liabilities = parseNumber(formData.liabilities);

    return assets - liabilities;
  };

  const handleSubmit = async () => {
    if (!formData.date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    const netWorth = calculateNetWorth();
    if (netWorth === 0 && !formData.notes) {
      Alert.alert(
        'Error',
        'Please enter at least one asset or liability value',
      );
      return;
    }

    setLoading(true);

    try {
      const entryData = {
        date: new Date(formData.date),
        cash: parseNumber(formData.cash),
        investments: parseNumber(formData.investments),
        realEstate: parseNumber(formData.realEstate),
        retirementAccounts: parseNumber(formData.retirementAccounts),
        vehicles: parseNumber(formData.vehicles),
        personalProperty: parseNumber(formData.personalProperty),
        otherAssets: parseNumber(formData.otherAssets),
        liabilities: parseNumber(formData.liabilities),
        netWorth,
        notes: formData.notes,
        customFields: [],
        accounts: [],
      };

      const response = await apiService.addNetWorthEntry(entryData);

      if (response.success) {
        Alert.alert('Success', 'Net worth entry added successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to add entry');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add net worth entry');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'numeric',
    multiline = false,
    numberOfLines = 1,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'numeric' | 'email-address';
    multiline?: boolean;
    numberOfLines?: number;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor="#999"
      />
    </View>
  );

  const netWorth = calculateNetWorth();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Net Worth Entry</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Net Worth Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Estimated Net Worth</Text>
          <Text
            style={[
              styles.previewAmount,
              {color: netWorth >= 0 ? '#2E7D32' : '#F44336'},
            ]}>
            {formatCurrency(netWorth)}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Date */}
          <InputField
            label="Date"
            value={formData.date}
            onChangeText={value => updateFormData('date', value)}
            placeholder="YYYY-MM-DD"
            keyboardType="default"
          />

          {/* Assets Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Assets</Text>

            <InputField
              label="Cash & Savings"
              value={formData.cash}
              onChangeText={value => updateFormData('cash', value)}
              placeholder="$0"
            />

            <InputField
              label="Investments"
              value={formData.investments}
              onChangeText={value => updateFormData('investments', value)}
              placeholder="$0"
            />

            <InputField
              label="Real Estate"
              value={formData.realEstate}
              onChangeText={value => updateFormData('realEstate', value)}
              placeholder="$0"
            />

            <InputField
              label="Retirement Accounts"
              value={formData.retirementAccounts}
              onChangeText={value =>
                updateFormData('retirementAccounts', value)
              }
              placeholder="$0"
            />

            <InputField
              label="Vehicles"
              value={formData.vehicles}
              onChangeText={value => updateFormData('vehicles', value)}
              placeholder="$0"
            />

            <InputField
              label="Personal Property"
              value={formData.personalProperty}
              onChangeText={value => updateFormData('personalProperty', value)}
              placeholder="$0"
            />

            <InputField
              label="Other Assets"
              value={formData.otherAssets}
              onChangeText={value => updateFormData('otherAssets', value)}
              placeholder="$0"
            />
          </View>

          {/* Liabilities Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Liabilities</Text>

            <InputField
              label="Total Liabilities"
              value={formData.liabilities}
              onChangeText={value => updateFormData('liabilities', value)}
              placeholder="$0"
            />
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>

            <InputField
              label="Additional Notes"
              value={formData.notes}
              onChangeText={value => updateFormData('notes', value)}
              placeholder="Any additional notes about this entry..."
              keyboardType="default"
              multiline={true}
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}>
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding Entry...' : 'Add Net Worth Entry'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#2E7D32',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 60,
  },
  previewCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -20,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  previewAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddEntryScreen;
