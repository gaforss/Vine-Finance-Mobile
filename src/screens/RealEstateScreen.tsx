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
  Linking,
} from 'react-native';
import {LineChart, BarChart} from 'react-native-chart-kit';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, RealEstate, Unit} from '../types';
import { apiService } from '../services/api';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-root-toast';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import DocumentPicker from 'react-native-document-picker';

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

const propertyTypeColors: Record<string, string> = {
  'Long-Term Rental': '#2E7D32',
  'Short-Term Rental': '#1976D2',
  'Primary Residence': '#8E24AA',
  'Vacation Home': '#F9A825',
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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<RealEstate | null>(null);
  const [rentForm, setRentForm] = useState({ startDate: '', endDate: '', amount: '' });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [addingRent, setAddingRent] = useState(false);
  const [docsModalVisible, setDocsModalVisible] = useState(false);
  const [docsProperty, setDocsProperty] = useState<RealEstate | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState<any>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [renameDocValue, setRenameDocValue] = useState('');
  const [expensesModalVisible, setExpensesModalVisible] = useState(false);
  const [expensesProperty, setExpensesProperty] = useState<RealEstate | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseForm, setExpenseForm] = useState({ date: '', category: 'Property Tax', amount: '' });
  const [showExpenseDatePicker, setShowExpenseDatePicker] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);

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

  const openDetailModal = (property: RealEstate) => {
    setSelectedProperty(property);
    setDetailModalVisible(true);
  };
  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedProperty(null);
  };

  // Add handler to mark rent as collected
  const handleMarkCollected = async (property: RealEstate, month: string) => {
    try {
      await apiService.updateRentCollection(property._id!, month, { amount: property.rentCollected[month].amount, collected: true });
      // Refresh property data in modal
      const response = await apiService.getRealEstateProperties();
      if (response.success && response.data) {
        const updated = response.data.find((p: RealEstate) => p._id === property._id);
        setSelectedProperty(updated || property);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update rent status');
    }
  };

  const handleAddRentPayment = async () => {
    if (!selectedProperty) return;
    if (!rentForm.startDate || !rentForm.endDate || !rentForm.amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setAddingRent(true);
    try {
      await apiService.addRentPayment(selectedProperty._id!, {
        startDate: rentForm.startDate,
        endDate: rentForm.endDate,
        amount: parseFloat(rentForm.amount),
      });
      // Refresh property data in modal
      const response = await apiService.getRealEstateProperties();
      if (response.success && response.data) {
        const updated = response.data.find((p: RealEstate) => p._id === selectedProperty._id);
        setSelectedProperty(updated || selectedProperty);
      }
      setRentForm({ startDate: '', endDate: '', amount: '' });
    } catch (e) {
      Alert.alert('Error', 'Failed to add rent payment');
    } finally {
      setAddingRent(false);
    }
  };

  const openDocsModal = async (property: RealEstate) => {
    setDocsProperty(property);
    setDocs([]);
    setDocName('');
    setDocFile(null);
    setDocsModalVisible(true);
    // Fetch docs
    try {
      const resp = await apiService.listDocuments(property._id!);
      if (resp.success && resp.data) setDocs(resp.data);
    } catch {}
  };
  const closeDocsModal = () => {
    setDocsModalVisible(false);
    setDocsProperty(null);
    setDocs([]);
    setDocName('');
    setDocFile(null);
  };
  const handlePickDoc = async () => {
    try {
      const res = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.allFiles] });
      setDocFile(res);
    } catch (e) {}
  };
  const handleUploadDoc = async () => {
    if (!docsProperty || !docFile || !docName) {
      Alert.alert('Error', 'Please provide a name and select a file.');
      return;
    }
    setUploadingDoc(true);
    try {
      await apiService.uploadDocument(docsProperty._id!, { ...docFile, name: docName });
      // Refresh docs
      const resp = await apiService.listDocuments(docsProperty._id!);
      if (resp.success && resp.data) setDocs(resp.data);
      setDocName('');
      setDocFile(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDoc = (doc: any) => {
    if (doc.path) Linking.openURL(doc.path);
  };
  const handleDeleteDoc = async (doc: any) => {
    if (!docsProperty) return;
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiService.deleteDocument(docsProperty._id!, doc._id);
          const resp = await apiService.listDocuments(docsProperty._id!);
          if (resp.success && resp.data) setDocs(resp.data);
        } catch {
          Alert.alert('Error', 'Failed to delete document');
        }
      }}
    ]);
  };
  const handleOpenRename = (doc: any) => {
    setRenameDocId(doc._id);
    setRenameDocValue(doc.name || '');
    setRenameModalVisible(true);
  };
  const handleRenameDoc = async () => {
    if (!docsProperty || !renameDocId || !renameDocValue) return;
    try {
      await apiService.renameDocument(docsProperty._id!, renameDocId, renameDocValue);
      const resp = await apiService.listDocuments(docsProperty._id!);
      if (resp.success && resp.data) setDocs(resp.data);
      setRenameModalVisible(false);
      setRenameDocId(null);
      setRenameDocValue('');
    } catch {
      Alert.alert('Error', 'Failed to rename document');
    }
  };

  const openExpensesModal = async (property: RealEstate) => {
    setExpensesProperty(property);
    setExpenses([]);
    setExpenseForm({ date: '', category: 'Property Tax', amount: '' });
    setExpensesModalVisible(true);
    // Fetch expenses
    try {
      const resp = await apiService.listPropertyExpenses(property._id!);
      if (resp.success && resp.data) setExpenses(resp.data);
    } catch {}
  };
  const closeExpensesModal = () => {
    setExpensesModalVisible(false);
    setExpensesProperty(null);
    setExpenses([]);
    setExpenseForm({ date: '', category: 'Property Tax', amount: '' });
  };
  const handleAddExpense = async () => {
    if (!expensesProperty || !expenseForm.date || !expenseForm.category || !expenseForm.amount) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    setAddingExpense(true);
    try {
      await apiService.addPropertyExpense(expensesProperty._id!, {
        date: expenseForm.date,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        description: '',
      });
      // Refresh expenses
      const resp = await apiService.listPropertyExpenses(expensesProperty._id!);
      if (resp.success && resp.data) setExpenses(resp.data);
      setExpenseForm({ date: '', category: 'Property Tax', amount: '' });
    } catch (e) {
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setAddingExpense(false);
    }
  };
  const expenseCategories = [
    'Property Tax',
    'Insurance',
    'Maintenance',
    'Utilities',
    'HOA Fees',
    'Repairs',
    'Other',
  ];

  const renderPropertyCard = ({item}: {item: RealEstate}) => {
    const totalRent = Object.values(item.rentCollected || {}).reduce(
      (sum, rent) => sum + (rent.collected ? rent.amount : 0), 0);
    const totalExpenses = item.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const capRate = item.value > 0 ? ((totalRent - totalExpenses) / item.value) * 100 : 0;
    const typeColor = propertyTypeColors[item.propertyType || ''] || '#666';
    const appreciation = item.appreciation ? (item.appreciation * 100).toFixed(1) : '0.0';
    return (
      <View style={{
        backgroundColor: '#1a2233',
        borderRadius: 20,
        padding: 20,
        marginBottom: 22,
        shadowColor: '#000',
        shadowOpacity: 0.13,
        shadowRadius: 10,
        elevation: 5,
      }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          {item.url ? (
            <Text style={{ fontSize: 20, marginRight: 8 }}>🔗</Text>
          ) : null}
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1 }}>{item.propertyAddress}</Text>
          <View style={{ backgroundColor: typeColor, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4, marginLeft: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{item.propertyType}</Text>
          </View>
          <Text style={{ fontSize: 22, color: '#b0b8c1', marginLeft: 10 }}>⋮</Text>
        </View>
        {/* Center Icon */}
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <View style={{ backgroundColor: '#22304a', borderRadius: 40, width: 64, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 6, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 }}>
            <Text style={{ fontSize: 36 }}>🏠</Text>
          </View>
        </View>
        {/* Metrics Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#b0b8c1', fontSize: 13 }}>💵 Equity</Text>
            <Text style={{ color: '#2ecc71', fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{formatCurrency(item.value - item.mortgageBalance)}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#b0b8c1', fontSize: 13 }}>💲 Zestimate</Text>
            <Text style={{ color: '#1ea7fd', fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{formatCurrency(item.value)}</Text>
            <Text style={{ color: '#2ecc71', fontSize: 13, marginTop: 2 }}>↑ {appreciation}%</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#b0b8c1', fontSize: 13 }}>💳 Mortgage</Text>
            <Text style={{ color: '#ff7043', fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{formatCurrency(item.mortgageBalance)}</Text>
          </View>
        </View>
        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#22304a', marginVertical: 12 }} />
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#2196f3',
              borderRadius: 8,
              paddingVertical: 10,
              marginRight: 6,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              overflow: 'hidden',
            }}
            onPress={() => openDetailModal(item)}
          >
            <FontAwesome5 name="eye" size={15} color="#fff" style={{ marginRight: 4 }} />
            <Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 13,
                flexShrink: 1,
                maxWidth: 90,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              View Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#b0b8c1',
              borderRadius: 8,
              paddingVertical: 10,
              marginHorizontal: 6,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              overflow: 'hidden',
            }}
            onPress={() => openDocsModal(item)}
          >
            <FontAwesome5 name="file-alt" size={15} color="#fff" style={{ marginRight: 4 }} />
            <Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 13,
                flexShrink: 1,
                maxWidth: 90,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Property Docs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#ffc107',
              borderRadius: 8,
              paddingVertical: 10,
              marginLeft: 6,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              overflow: 'hidden',
            }}
            onPress={() => openExpensesModal(item)}
          >
            <FontAwesome5 name="money-bill-wave" size={15} color="#fff" style={{ marginRight: 4 }} />
            <Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 13,
                flexShrink: 1,
                maxWidth: 90,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Manage Expenses
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Calculate cash flow and summary values
  const totalIncome = properties.reduce((sum, p) => {
    // Long-term rent
    const longTerm = Object.values(p.rentCollected || {}).reduce((s, r) => s + (r.amount || 0), 0);
    // Short-term income
    const shortTerm = (p.shortTermIncome || []).reduce((s, i) => s + (i.amount || 0), 0);
    return sum + longTerm + shortTerm;
  }, 0);
  const totalExpenses = properties.reduce((sum, p) => sum + (p.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0), 0);
  const realEstateIncome = totalIncome - totalExpenses;
  // Rent unpaid: rent entries where collected === false
  const rentUnpaid = properties.reduce((sum, p) => {
    return sum + Object.values(p.rentCollected || {}).reduce((s, r) => s + (!r.collected ? r.amount || 0 : 0), 0);
  }, 0);
  // Overdue rent: rent entries where collected === false and due date < today (if available)
  const today = new Date();
  const overdueRent = properties.reduce((sum, p) => {
    return sum + Object.entries(p.rentCollected || {}).reduce((s, [month, r]) => {
      // Assume month is YYYY-MM, treat as overdue if before this month
      if (!r.collected && month < today.toISOString().slice(0, 7)) {
        return s + (r.amount || 0);
      }
      return s;
    }, 0);
  }, 0);

  // Cash flow chart data (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });
  const chartData = {
    labels: months.map(m => m.toLocaleString('default', { month: 'short' })), // ['Jan', 'Feb', ...]
    datasets: [
      {
        data: months.map(month => {
          const key = month.toISOString().slice(0, 7);
          // Sum all rent (long-term) and short-term income for this month, minus expenses
          let income = 0;
          let expenses = 0;
          properties.forEach(p => {
            // Long-term rent
            if (p.rentCollected && p.rentCollected[key]) {
              income += p.rentCollected[key].amount || 0;
            }
            // Short-term income
            if (p.shortTermIncome) {
              income += p.shortTermIncome.filter(i => {
                const dateStr = typeof i.date === 'string' ? i.date : (i.date instanceof Date ? i.date.toISOString() : '');
                return dateStr.slice(0, 7) === key;
              }).reduce((s, i) => s + (i.amount || 0), 0);
            }
            // Expenses
            if (p.expenses) {
              expenses += p.expenses.filter(e => {
                const dateStr = typeof e.date === 'string' ? e.date : (e.date instanceof Date ? e.date.toISOString() : '');
                return dateStr.slice(0, 7) === key;
              }).reduce((s, e) => s + (e.amount || 0), 0);
            }
          });
          return income - expenses;
        })
      }
    ]
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

  // Improved Cash Flow Card UI
  return (
    <SafeAreaView style={styles.container}>
      {/* Cash Flow Chart and Summary Boxes */}
      <View style={{
        backgroundColor: '#151e2e',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#22304a',
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <Text style={{
          color: '#fff',
          fontSize: 22,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 18,
        }}>
          Real Estate Income
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Total Equity</Text>
            <Text style={{ color: '#1ea7fd', fontSize: 22, fontWeight: 'bold', marginTop: 2 }}>{formatCurrency(totalEquity)}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Rent Unpaid</Text>
            <Text style={{ color: '#1ea7fd', fontSize: 22, fontWeight: 'bold', marginTop: 2 }}>{formatCurrency(rentUnpaid)}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Overdue Rent</Text>
            <Text style={{ color: '#1ea7fd', fontSize: 22, fontWeight: 'bold', marginTop: 2 }}>{formatCurrency(overdueRent)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 24, height: 220, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
            <Text style={{
              color: '#b0b8c1',
              fontSize: 13,
              fontWeight: 'bold',
              transform: [{ rotate: '-90deg' }],
              width: 180,
              textAlign: 'center',
            }}>
              Cash Flow ($)
            </Text>
          </View>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 56 - 24}
            height={220}
            yAxisSuffix=""
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            chartConfig={{
              backgroundColor: '#151e2e',
              backgroundGradientFrom: '#151e2e',
              backgroundGradientTo: '#151e2e',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(30, 167, 253, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(176, 184, 193,${opacity})`,
              propsForBackgroundLines: { stroke: '#22304a' },
              style: { borderRadius: 12 },
            }}
            bezier
            style={{ borderRadius: 12, marginTop: 8 }}
            fromZero
            segments={5}
            formatYLabel={y => `$${Number(y).toLocaleString()}`}
          />
        </View>
      </View>
      {/* Portfolio Summary Card */}
      <View style={{
        backgroundColor: '#1a2233',
        borderRadius: 16,
        padding: 20,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>Portfolio Summary</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Total NOI</Text>
            <Text style={{ color: '#1ea7fd', fontSize: 22, fontWeight: 'bold', marginTop: 2 }}>{formatCurrency(totalNOI)}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Avg. Cap Rate</Text>
            <Text style={{ color: '#1ea7fd', fontSize: 22, fontWeight: 'bold', marginTop: 2 }}>{formatPercentage(averageCapRate)}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Avg. CoC Return</Text>
            <Text style={{ color: '#1ea7fd', fontSize: 22, fontWeight: 'bold', marginTop: 2 }}>{formatPercentage(averageCoCReturn)}</Text>
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
      {/* Property Details Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent onRequestClose={closeDetailModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#233047', borderRadius: 16, width: '92%', maxWidth: 500, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <View style={{ backgroundColor: '#34425a', padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Property Details</Text>
              <TouchableOpacity onPress={closeDetailModal}><Text style={{ color: '#b0b8c1', fontSize: 28 }}>×</Text></TouchableOpacity>
            </View>
            {selectedProperty && (
              <ScrollView style={{ maxHeight: 600 }} contentContainerStyle={{ padding: 24 }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 }}>{selectedProperty.propertyAddress}</Text>
                {selectedProperty.url ? (
                  <Text style={{ color: '#6fa1e6', fontSize: 15, textAlign: 'center', marginBottom: 18, textDecorationLine: 'underline' }}>View on Zillow</Text>
                ) : null}
                {/* Key Info */}
                <View style={{ backgroundColor: '#1a2233', borderRadius: 10, marginBottom: 18 }}>
                  <Text style={{ color: '#b0b8c1', fontSize: 16, fontWeight: 'bold', padding: 12 }}>Key Info</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12 }}>
                    <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Property Value</Text>
                    <Text style={{ color: '#2ecc71', fontSize: 16, fontWeight: 'bold' }}>{formatCurrency(selectedProperty.value)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12 }}>
                    <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Purchased</Text>
                    <Text style={{ color: '#fff', fontSize: 15 }}>{selectedProperty.purchaseDate ? (typeof selectedProperty.purchaseDate === 'string' ? new Date(selectedProperty.purchaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : selectedProperty.purchaseDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })) : ''}</Text>
                  </View>
                </View>
                {/* Financial Performance */}
                <View style={{ backgroundColor: '#1a2233', borderRadius: 10, marginBottom: 18 }}>
                  <Text style={{ color: '#b0b8c1', fontSize: 16, fontWeight: 'bold', padding: 12 }}>Financial Performance</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <FontAwesome5 name="wallet" size={15} color="#b0b8c1" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#b0b8c1', fontSize: 15 }}>NOI</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{formatCurrency(
                      Object.values(selectedProperty.rentCollected || {}).reduce((sum, r) => sum + (r.amount || 0), 0) - (selectedProperty.expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0)
                    )}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <FontAwesome5 name="percentage" size={15} color="#b0b8c1" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Cap Rate</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{selectedProperty.value > 0 ? (((Object.values(selectedProperty.rentCollected || {}).reduce((sum, r) => sum + (r.amount || 0), 0) - (selectedProperty.expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0)) / selectedProperty.value) * 100).toFixed(2) + '%' : '0.00%'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <FontAwesome5 name="money-bill-wave" size={15} color="#b0b8c1" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#b0b8c1', fontSize: 15 }}>CoC Return</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{selectedProperty.purchasePrice > 0 ? (((Object.values(selectedProperty.rentCollected || {}).reduce((sum, r) => sum + (r.amount || 0), 0) - (selectedProperty.expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0)) / selectedProperty.purchasePrice) * 100).toFixed(2) + '%' : '0.00%'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <FontAwesome5 name="file-invoice-dollar" size={15} color="#b0b8c1" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#b0b8c1', fontSize: 15 }}>Expenses</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{formatCurrency(selectedProperty.expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0)}</Text>
                  </View>
                </View>
                {/* Rent Collection Status Table */}
                <View style={{ backgroundColor: '#1a2233', borderRadius: 10, marginBottom: 18 }}>
                  <Text style={{ color: '#b0b8c1', fontSize: 16, fontWeight: 'bold', padding: 12 }}>Rent Collection Status</Text>
                  <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8 }}>
                    <Text style={{ color: '#b0b8c1', fontWeight: 'bold', flex: 1 }}>Month</Text>
                    <Text style={{ color: '#b0b8c1', fontWeight: 'bold', flex: 1 }}>Amount</Text>
                    <Text style={{ color: '#b0b8c1', fontWeight: 'bold', flex: 1 }}>Status</Text>
                    <Text style={{ color: '#b0b8c1', fontWeight: 'bold', flex: 1 }}>Actions</Text>
                  </View>
                  {selectedProperty.rentCollected && Object.entries(selectedProperty.rentCollected).length > 0 ? (
                    Object.entries(selectedProperty.rentCollected).map(([month, r], idx) => (
                      <View key={month} style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: idx % 2 === 0 ? '#233047' : 'transparent', borderRadius: 6 }}>
                        <Text style={{ color: '#fff', flex: 1 }}>{month}</Text>
                        <Text style={{ color: '#fff', flex: 1 }}>{formatCurrency(r.amount)}</Text>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                          {r.collected ? (
                            <View style={{ backgroundColor: '#2ecc71', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>Collected</Text>
                            </View>
                          ) : (
                            <TouchableOpacity onPress={() => handleMarkCollected(selectedProperty, month)} style={{ backgroundColor: '#2196f3', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, marginRight: 6 }}>
                              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>Mark as Collected</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => { /* TODO: Edit rent entry */ }}>
                          <Text style={{ color: '#ffc107', fontWeight: 'bold', fontSize: 13 }}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: '#b0b8c1', textAlign: 'center', padding: 12 }}>No rent records found.</Text>
                  )}
                </View>
                {selectedProperty && selectedProperty.propertyType === 'Long-Term Rental' && (
                  <View style={{ backgroundColor: '#29354a', borderRadius: 10, padding: 18, marginBottom: 18 }}>
                    <Text style={{ color: '#b0b8c1', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Add Rent Payment</Text>
                    <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>Start of Rental Term:</Text>
                    <TouchableOpacity
                      style={{ borderWidth: 1, borderColor: '#3a4660', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#233047' }}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text style={{ color: rentForm.startDate ? '#fff' : '#b0b8c1' }}>{rentForm.startDate ? new Date(rentForm.startDate).toLocaleDateString() : '---------- ----'}</Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                      <DateTimePicker
                        value={rentForm.startDate ? new Date(rentForm.startDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(_, date) => {
                          setShowStartPicker(false);
                          if (date) setRentForm(f => ({ ...f, startDate: date.toISOString() }));
                        }}
                      />
                    )}
                    <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>End of Rental Term:</Text>
                    <TouchableOpacity
                      style={{ borderWidth: 1, borderColor: '#3a4660', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#233047' }}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Text style={{ color: rentForm.endDate ? '#fff' : '#b0b8c1' }}>{rentForm.endDate ? new Date(rentForm.endDate).toLocaleDateString() : '---------- ----'}</Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                      <DateTimePicker
                        value={rentForm.endDate ? new Date(rentForm.endDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(_, date) => {
                          setShowEndPicker(false);
                          if (date) setRentForm(f => ({ ...f, endDate: date.toISOString() }));
                        }}
                      />
                    )}
                    <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>Monthly Rent Value:</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: '#3a4660', borderRadius: 8, padding: 10, marginBottom: 16, backgroundColor: '#233047', color: '#fff' }}
                      placeholder="$..."
                      placeholderTextColor="#b0b8c1"
                      keyboardType="numeric"
                      value={rentForm.amount}
                      onChangeText={v => setRentForm(f => ({ ...f, amount: v }))}
                    />
                    <TouchableOpacity
                      style={{ backgroundColor: '#1976D2', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
                      onPress={handleAddRentPayment}
                      disabled={addingRent}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{addingRent ? 'Adding...' : 'Add Rent Payment'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <Modal visible={docsModalVisible} animationType="slide" transparent onRequestClose={closeDocsModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#34425a', borderRadius: 12, width: '92%', maxWidth: 500, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <View style={{ backgroundColor: '#3a4660', padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Property Documents</Text>
              <TouchableOpacity onPress={closeDocsModal}><Text style={{ color: '#b0b8c1', fontSize: 28 }}>×</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 600 }} contentContainerStyle={{ padding: 24 }}>
              <Text style={{ color: '#b0b8c1', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Existing Documents</Text>
              {docs.length === 0 ? (
                <View style={{ backgroundColor: '#1a2233', borderRadius: 8, padding: 16, marginBottom: 18 }}>
                  <Text style={{ color: '#b0b8c1', fontSize: 15 }}>No documents found for this property.</Text>
                </View>
              ) : (
                docs.map(doc => (
                  <View key={doc._id} style={{ backgroundColor: '#1a2233', borderRadius: 8, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 15, flex: 1 }}>{doc.name || doc.type || 'Document'}</Text>
                    <TouchableOpacity onPress={() => handleDownloadDoc(doc)} style={{ marginHorizontal: 4 }}>
                      <FontAwesome5 name="download" size={16} color="#2196f3" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleOpenRename(doc)} style={{ marginHorizontal: 4 }}>
                      <FontAwesome5 name="edit" size={16} color="#ffc107" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteDoc(doc)} style={{ marginHorizontal: 4 }}>
                      <FontAwesome5 name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
              <View style={{ height: 1, backgroundColor: '#3a4660', marginVertical: 18 }} />
              <Text style={{ color: '#b0b8c1', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Upload New Document</Text>
              <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>Document Name</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#3a4660', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#233047', color: '#fff' }}
                placeholder="e.g., Lease Agreement 2024"
                placeholderTextColor="#b0b8c1"
                value={docName}
                onChangeText={setDocName}
              />
              <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>File</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#3a4660', borderRadius: 8, padding: 10, marginBottom: 16, backgroundColor: '#233047' }}
                onPress={handlePickDoc}
              >
                <Text style={{ color: '#fff', flex: 1 }}>{docFile ? docFile.name || docFile.fileName : 'No file chosen'}</Text>
                <Text style={{ color: '#2196f3', fontWeight: 'bold', fontSize: 15 }}>Choose File</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#1976D2', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 18 }}
                onPress={handleUploadDoc}
                disabled={uploadingDoc}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{uploadingDoc ? 'Uploading...' : 'Upload Document'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#b0b8c1', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
                onPress={closeDocsModal}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={renameModalVisible} animationType="fade" transparent onRequestClose={() => setRenameModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#34425a', borderRadius: 12, width: 320, padding: 24 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Rename Document</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#3a4660', borderRadius: 8, padding: 10, marginBottom: 16, backgroundColor: '#233047', color: '#fff' }}
              value={renameDocValue}
              onChangeText={setRenameDocValue}
              placeholder="Document Name"
              placeholderTextColor="#b0b8c1"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setRenameModalVisible(false)} style={{ marginRight: 12 }}>
                <Text style={{ color: '#b0b8c1', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRenameDoc}>
                <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 16 }}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={expensesModalVisible} animationType="slide" transparent onRequestClose={closeExpensesModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#34425a', borderRadius: 12, width: '92%', maxWidth: 500, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <View style={{ backgroundColor: '#3a4660', padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Manage Expenses</Text>
              <TouchableOpacity onPress={closeExpensesModal}><Text style={{ color: '#b0b8c1', fontSize: 28 }}>×</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 600 }} contentContainerStyle={{ padding: 24 }}>
              <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>Date</Text>
              <TouchableOpacity
                style={{ borderWidth: 1, borderColor: '#3a4660', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#233047', flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setShowExpenseDatePicker(true)}
              >
                <Text style={{ color: expenseForm.date ? '#fff' : '#b0b8c1', flex: 1 }}>{expenseForm.date ? new Date(expenseForm.date).toLocaleDateString() : 'mm/dd/yyyy'}</Text>
                <FontAwesome5 name="calendar-alt" size={16} color="#b0b8c1" />
              </TouchableOpacity>
              {showExpenseDatePicker && (
                <DateTimePicker
                  value={expenseForm.date ? new Date(expenseForm.date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowExpenseDatePicker(false);
                    if (date) setExpenseForm(f => ({ ...f, date: date.toISOString() }));
                  }}
                />
              )}
              <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>Category</Text>
              <View style={{ borderWidth: 1, borderColor: '#3a4660', borderRadius: 8, marginBottom: 12, backgroundColor: '#233047' }}>
                <Picker
                  selectedValue={expenseForm.category}
                  onValueChange={v => setExpenseForm(f => ({ ...f, category: v }))}
                  style={{ color: '#fff' }}
                  dropdownIconColor="#b0b8c1"
                >
                  {expenseCategories.map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
              <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>Amount</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#3a4660', borderRadius: 8, padding: 10, marginBottom: 16, backgroundColor: '#233047', color: '#fff' }}
                placeholder="$..."
                placeholderTextColor="#b0b8c1"
                keyboardType="numeric"
                value={expenseForm.amount}
                onChangeText={v => setExpenseForm(f => ({ ...f, amount: v }))}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#1976D2', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 18 }}
                onPress={handleAddExpense}
                disabled={addingExpense}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{addingExpense ? 'Adding...' : 'Add Expense'}</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: '#3a4660', marginVertical: 18 }} />
              <Text style={{ color: '#b0b8c1', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Existing Expenses</Text>
              {expenses.length === 0 ? (
                <Text style={{ color: '#b0b8c1', fontSize: 15 }}>No expenses recorded for this property.</Text>
              ) : (
                expenses.map(exp => (
                  <View key={exp._id} style={{ backgroundColor: '#1a2233', borderRadius: 8, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 15, flex: 1 }}>{new Date(exp.date).toLocaleDateString()} - {exp.category} - ${exp.amount}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#232b3a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  propertyAddressSub: {
    fontSize: 12,
    color: '#6fa1e6',
    textDecorationLine: 'underline',
    marginBottom: 2,
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
  propertyIcon: {
    fontSize: 32,
    marginRight: 14,
  },
});

export default RealEstateScreen;
export { PropertyDetailScreen };
