import React, {useState, useEffect} from 'react';
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
import {RootStackParamList, NetWorth} from '../types';
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

const TABS = ['Manual Entry', 'Import from File'];
const STEPS = ['Assets', 'Liabilities', 'Review'];

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
  const [activeTab, setActiveTab] = useState(0); // 0: Manual, 1: Import
  const [step, setStep] = useState(0); // 0: Assets, 1: Liabilities, 2: Review
  const [entries, setEntries] = useState<NetWorth[]>([]);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    console.log(`parseNumber input: '${value}', cleaned: '${cleaned}', parsed:`, parsed);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculateNetWorth = (): number => {
    const cash = parseNumber(formData.cash);
    const investments = parseNumber(formData.investments);
    const realEstate = parseNumber(formData.realEstate);
    const retirementAccounts = parseNumber(formData.retirementAccounts);
    const vehicles = parseNumber(formData.vehicles);
    const personalProperty = parseNumber(formData.personalProperty);
    const otherAssets = parseNumber(formData.otherAssets);
    const liabilities = parseNumber(formData.liabilities);
    const assets = cash + investments + realEstate + retirementAccounts + vehicles + personalProperty + otherAssets;
    const netWorth = assets - liabilities;
    console.log('Net Worth Calculation:', {
      cash,
      investments,
      realEstate,
      retirementAccounts,
      vehicles,
      personalProperty,
      otherAssets,
      liabilities,
      assets,
      netWorth,
    });
    return netWorth;
  };

  const fetchEntries = async () => {
    const response = await apiService.getNetWorthEntries();
    console.log('Fetched entries response:', response);
    if (response.success && response.data) {
      console.log('Fetched entries data:', response.data);
      // Ensure every entry has a netWorth field, calculated if missing
      const entriesWithNetWorth = response.data.map(entry => {
        if (typeof entry.netWorth === 'number') return entry;
        const assets =
          (entry.cash || 0) +
          (entry.investments || 0) +
          (entry.realEstate || 0) +
          (entry.retirementAccounts || 0) +
          (entry.vehicles || 0) +
          (entry.personalProperty || 0) +
          (entry.otherAssets || 0) +
          (entry.customFields || []).filter(f => f.type === 'asset').reduce((a, b) => a + (b.amount || 0), 0);
        const liabilities = (entry.liabilities || 0) +
          (entry.customFields || []).filter(f => f.type === 'liability').reduce((a, b) => a + (b.amount || 0), 0);
        return {
          ...entry,
          netWorth: assets - liabilities,
        };
      });
      setEntries(entriesWithNetWorth.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

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
        fetchEntries(); // Refresh entries after add
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

  const handleDeleteEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              setLoading(true);
              const response = await apiService.deleteNetWorthEntry(entryId);
              if (response.success) {
                fetchEntries();
              } else {
                Alert.alert('Error', response.error || 'Failed to delete entry');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // --- Stepper and Tab UI ---
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.tabBar}>
        {TABS.map((tab, idx) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === idx && styles.activeTab]}
            onPress={() => setActiveTab(idx)}>
            <Text style={[styles.tabText, activeTab === idx && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === 1 ? (
        <View style={styles.importContainer}>
          <Text style={styles.importText}>Import from file coming soon...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Stepper */}
          <View style={styles.stepperContainer}>
            {STEPS.map((label, idx) => (
              <View key={label} style={styles.stepContainer}>
                <View style={[styles.stepCircle, step === idx && styles.activeStepCircle]}>
                  <Text style={[styles.stepNumber, step === idx && styles.activeStepNumber]}>{idx + 1}</Text>
                </View>
                <Text style={[styles.stepLabel, step === idx && styles.activeStepLabel]}>{label}</Text>
                {idx < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
            ))}
          </View>
          {/* Step Content */}
          <View style={styles.card}>
            {step === 0 && (
              <>
                <Text style={styles.sectionTitle}>Assets</Text>
                <InputField label="Date" value={formData.date} onChangeText={value => updateFormData('date', value)} placeholder="YYYY-MM-DD" keyboardType="default" />
                <InputField label="Cash & Savings" value={formData.cash} onChangeText={value => updateFormData('cash', value)} placeholder="$0" />
                <InputField label="Investments" value={formData.investments} onChangeText={value => updateFormData('investments', value)} placeholder="$0" />
                <InputField label="Real Estate" value={formData.realEstate} onChangeText={value => updateFormData('realEstate', value)} placeholder="$0" />
                <InputField label="Retirement Accounts" value={formData.retirementAccounts} onChangeText={value => updateFormData('retirementAccounts', value)} placeholder="$0" />
                <InputField label="Vehicles" value={formData.vehicles} onChangeText={value => updateFormData('vehicles', value)} placeholder="$0" />
                <InputField label="Personal Property" value={formData.personalProperty} onChangeText={value => updateFormData('personalProperty', value)} placeholder="$0" />
                <InputField label="Other Assets" value={formData.otherAssets} onChangeText={value => updateFormData('otherAssets', value)} placeholder="$0" />
              </>
            )}
            {step === 1 && (
              <>
                <Text style={styles.sectionTitle}>Liabilities</Text>
                <InputField label="Total Liabilities" value={formData.liabilities} onChangeText={value => updateFormData('liabilities', value)} placeholder="$0" />
                <Text style={styles.sectionTitle}>Notes</Text>
                <InputField label="Additional Notes" value={formData.notes} onChangeText={value => updateFormData('notes', value)} placeholder="Any additional notes about this entry..." keyboardType="default" multiline={true} numberOfLines={4} />
              </>
            )}
            {step === 2 && (
              <>
                <Text style={styles.sectionTitle}>Review</Text>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Date:</Text><Text style={styles.reviewValue}>{formData.date}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Cash & Savings:</Text><Text style={styles.reviewValue}>{formData.cash}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Investments:</Text><Text style={styles.reviewValue}>{formData.investments}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Real Estate:</Text><Text style={styles.reviewValue}>{formData.realEstate}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Retirement Accounts:</Text><Text style={styles.reviewValue}>{formData.retirementAccounts}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Vehicles:</Text><Text style={styles.reviewValue}>{formData.vehicles}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Personal Property:</Text><Text style={styles.reviewValue}>{formData.personalProperty}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Other Assets:</Text><Text style={styles.reviewValue}>{formData.otherAssets}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Liabilities:</Text><Text style={styles.reviewValue}>{formData.liabilities}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Notes:</Text><Text style={styles.reviewValue}>{formData.notes}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Estimated Net Worth:</Text><Text style={styles.reviewValue}>{formatCurrency(calculateNetWorth())}</Text></View>
              </>
            )}
          </View>
          {/* Step Navigation */}
          <View style={styles.stepNavRow}>
            {step > 0 && (
              <TouchableOpacity style={styles.stepNavButton} onPress={() => setStep(step - 1)}>
                <Text style={styles.stepNavButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            {step < 2 && (
              <TouchableOpacity style={styles.stepNavButton} onPress={() => setStep(step + 1)}>
                <Text style={styles.stepNavButtonText}>Next</Text>
              </TouchableOpacity>
            )}
            {step === 2 && (
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}>
                <Text style={styles.submitButtonText}>{loading ? 'Adding Entry...' : 'Submit Entry'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Previous Entries Section */}
          <View style={styles.entriesCard}>
            <Text style={styles.entriesTitle}>Previous Entries</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.entriesHeaderRow}>
                  <Text style={styles.entriesHeaderCell}>Date</Text>
                  <Text style={styles.entriesHeaderCell}>Cash</Text>
                  <Text style={styles.entriesHeaderCell}>Investments</Text>
                  <Text style={styles.entriesHeaderCell}>Real Estate</Text>
                  <Text style={styles.entriesHeaderCell}>Retirement</Text>
                  <Text style={styles.entriesHeaderCell}>Vehicles</Text>
                  <Text style={styles.entriesHeaderCell}>Personal</Text>
                  <Text style={styles.entriesHeaderCell}>Other</Text>
                  <Text style={styles.entriesHeaderCell}>Liabilities</Text>
                  <Text style={styles.entriesHeaderCell}>Net Worth</Text>
                  <Text style={styles.entriesHeaderCell}>Actions</Text>
                </View>
                {entries.length === 0 ? (
                  <Text style={styles.noEntriesText}>No entries found.</Text>
                ) : (
                  entries.map(entry => (
                    <View key={entry._id ? String(entry._id) : String(entry.date)} style={styles.entryRow}>
                      <Text style={styles.entryCell}>{new Date(entry.date).toLocaleDateString()}</Text>
                      <Text style={styles.entryCell}>{formatCurrency(entry.cash)}</Text>
                      <Text style={styles.entryCell}>{formatCurrency(entry.investments)}</Text>
                      <Text style={styles.entryCell}>{formatCurrency(entry.realEstate)}</Text>
                      <Text style={styles.entryCell}>{formatCurrency(entry.retirementAccounts)}</Text>
                      <Text style={styles.entryCell}>{formatCurrency(entry.vehicles)}</Text>
                      <Text style={styles.entryCell}>{formatCurrency(entry.personalProperty)}</Text>
                      <Text style={styles.entryCell}>{formatCurrency(entry.otherAssets)}</Text>
                      <Text style={styles.entryCell}>{formatCurrency(entry.liabilities)}</Text>
                      <Text style={styles.entryCell}>{formatCurrency(entry.netWorth)}</Text>
                      <View style={[styles.entryCell, {flexDirection: 'row', gap: 4, paddingHorizontal: 0}]}> 
                        <TouchableOpacity style={{paddingHorizontal: 2}} onPress={() => navigation.navigate('EditEntry', { entryId: entry._id || '' })}>
                          <Text style={{color: '#23aaff', fontSize: 12}}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{paddingHorizontal: 2}} onPress={() => handleDeleteEntry(entry._id || '')}>
                          <Text style={{color: '#ff5555', fontSize: 12}}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181f2a',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#10151f',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginTop: 12,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#222b3a',
  },
  tabText: {
    color: '#b0b8c1',
    fontWeight: '600',
    fontSize: 16,
  },
  activeTabText: {
    color: '#23aaff',
  },
  importContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  importText: {
    color: '#b0b8c1',
    fontSize: 18,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222b3a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#222b3a',
  },
  activeStepCircle: {
    borderColor: '#23aaff',
    backgroundColor: '#181f2a',
  },
  stepNumber: {
    color: '#b0b8c1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeStepNumber: {
    color: '#23aaff',
  },
  stepLabel: {
    color: '#b0b8c1',
    fontSize: 14,
    marginLeft: 6,
    marginRight: 12,
  },
  activeStepLabel: {
    color: '#23aaff',
    fontWeight: 'bold',
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: '#222b3a',
    marginHorizontal: 2,
  },
  card: {
    backgroundColor: '#222b3a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e6eaf0',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#b0b8c1',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#181f2a',
    borderWidth: 1,
    borderColor: '#2a3140',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#e6eaf0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewLabel: {
    color: '#b0b8c1',
    fontWeight: '600',
    fontSize: 15,
  },
  reviewValue: {
    color: '#e6eaf0',
    fontSize: 15,
    fontWeight: 'bold',
  },
  stepNavRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  stepNavButton: {
    backgroundColor: '#10151f',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginLeft: 8,
  },
  stepNavButtonText: {
    color: '#23aaff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#23aaff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#444',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  entriesCard: {
    backgroundColor: '#222b3a',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entriesTitle: {
    color: '#e6eaf0',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  entriesHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a3140',
    paddingBottom: 6,
    marginBottom: 6,
  },
  entriesHeaderCell: {
    flex: 1,
    color: '#b0b8c1',
    fontWeight: '600',
    fontSize: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 70,
    textAlign: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#23293a',
  },
  entryCell: {
    flex: 1,
    color: '#e6eaf0',
    fontSize: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 70,
    textAlign: 'center',
  },
  noEntriesText: {
    color: '#b0b8c1',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default AddEntryScreen;
