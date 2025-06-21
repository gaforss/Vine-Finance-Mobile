import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {LineChart, BarChart} from 'react-native-chart-kit';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, RealEstate, Unit} from '../types';
import { apiService } from '../services/api';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-root-toast';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

type RealEstateScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RealEstate'
>;

interface Props {
  navigation: RealEstateScreenNavigationProp;
}

const emptyForm: Partial<RealEstate> = {
  propertyType: undefined,
  propertyAddress: '',
  purchaseDate: undefined,
  purchasePrice: 0,
  value: 0,
  mortgageBalance: 0,
  rentCollected: {},
  expenses: [],
  documents: [],
};

const propertyTypeOptions = [
  'Long-Term Rental',
  'Short-Term Rental',
  'Primary Residence',
  'Vacation Home',
];

const propertyTypeIcons: Record<string, string> = {
  'Long-Term Rental': '🏢',
  'Short-Term Rental': '🏖️',
  'Primary Residence': '🏠',
  'Vacation Home': '🌴',
};

const PropertyForm = ({ visible, onClose, onSave, initialData }: any) => {
  const [form, setForm] = useState<Partial<RealEstate>>(initialData || emptyForm);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setForm(initialData || emptyForm); setError(null); }, [initialData]);

  const validate = () => {
    if (!form.propertyType) return 'Property type is required.';
    if (!form.propertyAddress) return 'Address is required.';
    if (!form.purchaseDate) return 'Purchase date is required.';
    if (!form.purchasePrice || form.purchasePrice <= 0) return 'Purchase price must be positive.';
    if (!form.value || form.value <= 0) return 'Current value must be positive.';
    if (form.mortgageBalance === undefined || form.mortgageBalance < 0) return 'Mortgage balance must be zero or positive.';
    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>{form._id ? 'Edit' : 'Add'} Property</Text>
            <Text style={styles.inputLabel}>Property Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.propertyType}
                onValueChange={(v: string | undefined) => setForm(f => ({ ...f, propertyType: v as RealEstate['propertyType'] }))}>
                <Picker.Item label="Select type..." value={undefined} />
                {propertyTypeOptions.map(opt => (
                  <Picker.Item key={opt} label={opt} value={opt} />
                ))}
              </Picker>
            </View>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput style={styles.input} placeholder="Address" value={form.propertyAddress || ''} onChangeText={v => setForm(f => ({ ...f, propertyAddress: v }))} />
            <Text style={styles.inputLabel}>Purchase Date</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text>{form.purchaseDate ? (typeof form.purchaseDate === 'string' ? form.purchaseDate : form.purchaseDate.toISOString().slice(0,10)) : 'Select date...'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.purchaseDate ? (typeof form.purchaseDate === 'string' ? new Date(form.purchaseDate) : form.purchaseDate) : new Date()}
                mode="date"
                display="default"
                onChange={(_: any, date?: Date) => { setShowDatePicker(false); if (date) setForm(f => ({ ...f, purchaseDate: date })); }}
              />
            )}
            <Text style={styles.inputLabel}>Purchase Price</Text>
            <TextInput style={styles.input} placeholder="Purchase Price" keyboardType="numeric" value={form.purchasePrice?.toString() || ''} onChangeText={v => setForm(f => ({ ...f, purchasePrice: parseFloat(v) }))} />
            <Text style={styles.inputLabel}>Current Value</Text>
            <TextInput style={styles.input} placeholder="Current Value" keyboardType="numeric" value={form.value?.toString() || ''} onChangeText={v => setForm(f => ({ ...f, value: parseFloat(v) }))} />
            <Text style={styles.inputLabel}>Mortgage Balance</Text>
            <TextInput style={styles.input} placeholder="Mortgage Balance" keyboardType="numeric" value={form.mortgageBalance?.toString() || ''} onChangeText={v => setForm(f => ({ ...f, mortgageBalance: parseFloat(v) }))} />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose}><Text style={styles.cancelBtn}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSave}><Text style={styles.saveBtn}>Save</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Tabbed Property Detail Screen
const Tab = createMaterialTopTabNavigator();

const PropertyDetailsTab = ({ property }: { property: RealEstate }) => (
  <ScrollView style={{ padding: 16 }}>
    <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Property Details</Text>
    <Text>Type: {property.propertyType}</Text>
    <Text>Address: {property.propertyAddress}</Text>
    <Text>Purchase Date: {property.purchaseDate ? (typeof property.purchaseDate === 'string' ? property.purchaseDate : property.purchaseDate.toISOString().slice(0,10)) : ''}</Text>
    <Text>Purchase Price: ${property.purchasePrice}</Text>
    <Text>Current Value: ${property.value}</Text>
    <Text>Mortgage Balance: ${property.mortgageBalance}</Text>
  </ScrollView>
);

const UnitsTab = ({ propertyId }: { propertyId: string }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState<Partial<Unit>>({ name: '', rentAmount: 0, tenant: '' });
  const [error, setError] = useState<string | null>(null);

  const loadUnits = async () => {
    setLoading(true);
    // property.units is available from parent, but always fetch latest
    const resp = await apiService.getRealEstateProperties();
    if (resp.success && resp.data) {
      const prop = resp.data.find((p: RealEstate) => p._id === propertyId);
      setUnits(prop?.units || []);
    }
    setLoading(false);
  };
  useEffect(() => { loadUnits(); }, []);

  const showToast = (msg: string, success = true) => {
    Toast.show(msg, { backgroundColor: success ? '#28a745' : '#F44336', duration: 2000, position: Toast.positions.BOTTOM });
  };

  const openModal = (unit?: Unit) => {
    setEditing(unit || null);
    setForm(unit ? { ...unit } : { name: '', rentAmount: 0, tenant: '' });
    setError(null);
    setModalVisible(true);
  };
  const closeModal = () => { setModalVisible(false); setEditing(null); setForm({ name: '', rentAmount: 0, tenant: '' }); setError(null); };

  const validate = () => {
    if (!form.name) return 'Unit name required.';
    if (form.rentAmount === undefined || form.rentAmount < 0) return 'Rent amount required.';
    if (!form.tenant) return 'Tenant required.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    try {
      if (editing && editing._id) {
        await apiService.updateUnit(propertyId, editing._id, form);
        showToast('Unit updated!');
      } else {
        await apiService.addUnit(propertyId, form as Unit);
        showToast('Unit added!');
      }
      closeModal();
      loadUnits();
    } catch (e) {
      showToast('Error saving unit', false);
    }
  };
  const handleDelete = async (unitId: string) => {
    try {
      await apiService.deleteUnit(propertyId, unitId);
      showToast('Unit deleted!');
      loadUnits();
    } catch (e) {
      showToast('Error deleting unit', false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={units}
        keyExtractor={item => item._id || item.name}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
              <Text>Tenant: {item.tenant}</Text>
              <Text>Rent: ${item.rentAmount}</Text>
            </View>
            <TouchableOpacity onPress={() => openModal(item)} style={{ marginRight: 12 }}><Text style={{ color: '#1976D2' }}>Edit</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id!)}><Text style={{ color: '#F44336' }}>Delete</Text></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>No units found.</Text>}
        refreshing={loading}
        onRefresh={loadUnits}
      />
      <TouchableOpacity onPress={() => openModal()} style={{ backgroundColor: '#2E7D32', padding: 16, margin: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Add Unit</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Edit' : 'Add'} Unit</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} placeholder="Unit Name" value={form.name || ''} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
            <Text style={styles.inputLabel}>Tenant</Text>
            <TextInput style={styles.input} placeholder="Tenant Name" value={form.tenant || ''} onChangeText={v => setForm(f => ({ ...f, tenant: v }))} />
            <Text style={styles.inputLabel}>Rent Amount</Text>
            <TextInput style={styles.input} placeholder="Rent Amount" keyboardType="numeric" value={form.rentAmount?.toString() || ''} onChangeText={v => setForm(f => ({ ...f, rentAmount: parseFloat(v) }))} />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeModal}><Text style={styles.cancelBtn}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSave}><Text style={styles.saveBtn}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const RentTab = () => <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Rent (Coming soon)</Text></View>;
const ExpensesTab = () => <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Expenses (Coming soon)</Text></View>;
const DocumentsTab = () => <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Documents (Coming soon)</Text></View>;
const VacanciesTab = () => <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Vacancies (Coming soon)</Text></View>;
const AnalyticsTab = () => <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Analytics (Coming soon)</Text></View>;

const PropertyDetailScreen = ({ route, navigation }: any) => {
  const { property } = route.params;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tab.Navigator>
        <Tab.Screen name="Details">
          {() => <PropertyDetailsTab property={property} />}
        </Tab.Screen>
        <Tab.Screen name="Units">
          {() => <UnitsTab propertyId={property._id} />}
        </Tab.Screen>
        <Tab.Screen name="Rent" component={RentTab} />
        <Tab.Screen name="Expenses" component={ExpensesTab} />
        <Tab.Screen name="Documents" component={DocumentsTab} />
        <Tab.Screen name="Vacancies" component={VacanciesTab} />
        <Tab.Screen name="Analytics" component={AnalyticsTab} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

// Main RealEstateScreen: Property List
const RealEstateScreen: React.FC<Props> = ({navigation}) => {
  const [properties, setProperties] = useState<RealEstate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<RealEstate | null>(null);
  const [totalEquity, setTotalEquity] = useState(0);
  const [totalRentIncome, setTotalRentIncome] = useState(0);
  const [totalNOI, setTotalNOI] = useState(0);
  const [averageCapRate, setAverageCapRate] = useState(0);
  const [averageCoCReturn, setAverageCoCReturn] = useState(0);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    console.log('DEBUG: useEffect triggered in RealEstateScreen');
    loadRealEstateData();
  }, []);

  useEffect(() => {
    console.log('DEBUG: properties state changed:', properties);
  }, [properties]);

  // TEMP: Only render debug block
  console.log('DEBUG: RealEstateScreen render, properties state:', properties);

  const loadRealEstateData = async () => {
    try {
      setLoading(true);
      console.log('DEBUG: Calling apiService.getRealEstateProperties()');
      const response = await apiService.getRealEstateProperties();
      console.log('DEBUG: getRealEstateProperties FULL response:', JSON.stringify(response, null, 2));
      if (response.success && response.data) {
        console.log('DEBUG: About to setProperties with:', response.data);
        setProperties(response.data);
        setTimeout(() => {
          console.log('DEBUG: properties state after setProperties (timeout):', properties);
        }, 1000);
        // Calculate portfolio metrics
        let equity = 0;
        let rentIncome = 0;
        let noi = 0;
        let totalValue = 0;
        let totalInvestment = 0;
        response.data.forEach(property => {
          equity += property.value - property.mortgageBalance;
          const totalRent = Object.values(property.rentCollected || {}).reduce(
            (sum, rent) => sum + (rent.collected ? rent.amount : 0), 0);
          rentIncome += totalRent;
          const totalExpenses = property.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
          noi += totalRent - totalExpenses;
          totalValue += property.value;
          totalInvestment += property.purchasePrice;
        });
        setTotalEquity(equity);
        setTotalRentIncome(rentIncome);
        setTotalNOI(noi);
        if (totalValue > 0) setAverageCapRate((noi / totalValue) * 100);
        if (totalInvestment > 0) setAverageCoCReturn((noi / totalInvestment) * 100);
      }
    } catch (error) {
      console.error('Error loading real estate data:', error);
      Alert.alert('Error', 'Failed to load real estate data');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, success = true) => {
    Toast.show(msg, { backgroundColor: success ? '#28a745' : '#F44336', duration: 2000, position: Toast.positions.BOTTOM });
  };

  const handleSave = async (form: Partial<RealEstate>) => {
    try {
      if (editing) {
        await apiService.updateRealEstateProperty(editing._id!, form);
        showToast('Property updated!');
      } else {
        await apiService.addRealEstateProperty(form as any);
        showToast('Property added!');
      }
    } catch (e) {
      showToast('Error saving property', false);
    }
    setModalVisible(false);
    setEditing(null);
    loadRealEstateData();
  };
  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await apiService.deleteRealEstateProperty(id); showToast('Property deleted!'); loadRealEstateData(); } catch { showToast('Error deleting property', false); } } }
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const renderPropertyCard = ({item}: {item: RealEstate}) => {
    console.log('RENDER PROPERTY:', item);
    const totalRent = Object.values(item.rentCollected || {}).reduce(
      (sum, rent) => sum + (rent.collected ? rent.amount : 0), 0);
    const totalExpenses = item.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const capRate = item.value > 0 ? ((totalRent - totalExpenses) / item.value) * 100 : 0;
    return (
      <View style={styles.propertyCard}>
        <View style={styles.propertyHeader}>
          <Text style={styles.propertyIcon}>{propertyTypeIcons[item.propertyType || ''] || ''}</Text>
          <View>
            <Text style={styles.propertyName}>{item.propertyType}</Text>
            <Text style={styles.propertyAddress}>{item.propertyAddress}</Text>
          </View>
        </View>
        <View style={styles.propertyMetrics}>
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Current Value</Text>
              <Text style={styles.metricValue}>{formatCurrency(item.value)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Annual Rent</Text>
              <Text style={styles.metricValue}>{formatCurrency(totalRent)}</Text>
            </View>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Equity</Text>
              <Text style={[styles.metricValue, {color: '#28a745'}]}>{formatCurrency(item.value - item.mortgageBalance)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Cap Rate</Text>
              <Text style={styles.metricValue}>{formatPercentage(capRate)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.propertyActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => { setEditing(item); setModalVisible(true); }}><Text style={styles.actionButtonText}>Edit</Text></TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id!)}><Text style={styles.actionButtonText}>Delete</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  const chartData = {
    labels: properties.slice(0, 5).map(property => property.propertyType.substring(0, 8)),
    datasets: [
      { data: properties.slice(0, 5).map(property => property.value) },
    ],
  };
  const cashFlowData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { data: [totalRentIncome / 6, totalRentIncome / 6, totalRentIncome / 6, totalRentIncome / 6, totalRentIncome / 6, totalRentIncome / 6] },
    ],
  };

  const handlePropertyPress = (property: RealEstate) => {
    navigation.navigate('PropertyDetail', { property });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading real estate data...</Text>
      </View>
    );
  }

  // Restore the full UI (property cards, metrics, add/edit/delete, etc.)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Real Estate Portfolio</Text>
        <TouchableOpacity onPress={() => { setEditing(null); setModalVisible(true); }}>
          <Text style={{ color: '#2E7D32', fontSize: 18 }}>+ Add Property</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Portfolio Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Equity</Text>
            <Text style={styles.overviewValue}>{formatCurrency(totalEquity)}</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Annual Rent</Text>
            <Text style={styles.overviewValue}>{formatCurrency(totalRentIncome)}</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>NOI</Text>
            <Text style={styles.overviewValue}>{formatCurrency(totalNOI)}</Text>
          </View>
        </View>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Avg Cap Rate</Text>
            <Text style={styles.overviewValue}>{formatPercentage(averageCapRate)}</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Avg CoC Return</Text>
            <Text style={styles.overviewValue}>{formatPercentage(averageCoCReturn)}</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={properties}
        keyExtractor={item => item._id || item.propertyAddress}
        renderItem={renderPropertyCard}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>No properties found.</Text>}
      />
      <PropertyForm
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditing(null); }}
        onSave={handleSave}
        initialData={editing}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181f2a',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181f2a',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#181f2a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#222b3a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  metricCardLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0070ba',
    marginBottom: 2,
  },
  metricCardSubtext: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  propertyCard: {
    backgroundColor: '#222b3a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#888888',
  },
  propertyMetrics: {
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  propertyActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  editButton: { backgroundColor: '#0070ba', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 8 },
  deleteButton: { backgroundColor: '#F44336', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 340 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { color: '#888', marginRight: 16, fontSize: 16 },
  saveBtn: { color: '#0070ba', fontWeight: 'bold', fontSize: 16 },
  addButton: { backgroundColor: '#0070ba', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  inputLabel: { color: '#333', fontWeight: '600', marginBottom: 4, marginTop: 8 },
  errorText: { color: '#F44336', marginBottom: 8, fontWeight: 'bold' },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 },
  propertyIcon: { fontSize: 32, marginRight: 12 },
});

export default RealEstateScreen;
export { PropertyDetailScreen };
