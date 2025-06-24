import React, {useState, useEffect, useCallback} from 'react';
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
  Button,
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, RealEstate, Unit} from '../types';
import {apiService} from '../services/api';
import {Picker} from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-root-toast';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import DocumentPicker from 'react-native-document-picker';
import DeleteModal from '../components/profile/DeleteModal';

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

const PropertyForm = ({visible, onClose, onSave, initialData}: any) => {
  const [form, setForm] = useState<Partial<RealEstate>>(
    initialData || emptyForm,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setForm(initialData || emptyForm);
    setError(null);
  }, [initialData]);

  const validate = () => {
    if (!form.propertyType) {
      return 'Property type is required.';
    }
    if (!form.propertyAddress) {
      return 'Address is required.';
    }
    if (!form.purchaseDate) {
      return 'Purchase date is required.';
    }
    if (!form.purchasePrice || form.purchasePrice <= 0) {
      return 'Purchase price must be positive.';
    }
    if (!form.value || form.value <= 0) {
      return 'Current value must be positive.';
    }
    if (form.mortgageBalance === undefined || form.mortgageBalance < 0) {
      return 'Mortgage balance must be zero or positive.';
    }
    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>
              {form._id ? 'Edit' : 'Add'} Property
            </Text>
            <Text style={styles.inputLabel}>Property Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.propertyType}
                onValueChange={(v: string | undefined) =>
                  setForm(f => ({
                    ...f,
                    propertyType: v as RealEstate['propertyType'],
                  }))
                }>
                <Picker.Item label="Select type..." value={undefined} />
                {propertyTypeOptions.map(opt => (
                  <Picker.Item key={opt} label={opt} value={opt} />
                ))}
              </Picker>
            </View>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={form.propertyAddress || ''}
              onChangeText={v => setForm(f => ({...f, propertyAddress: v}))}
            />
            <Text style={styles.inputLabel}>Purchase Date</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}>
              <Text>
                {form.purchaseDate
                  ? typeof form.purchaseDate === 'string'
                    ? form.purchaseDate
                    : form.purchaseDate.toISOString().slice(0, 10)
                  : 'Select date...'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={
                  form.purchaseDate
                    ? typeof form.purchaseDate === 'string'
                      ? new Date(form.purchaseDate)
                      : form.purchaseDate
                    : new Date()
                }
                mode="date"
                display="default"
                onChange={(_: any, date?: Date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setForm(f => ({...f, purchaseDate: date}));
                  }
                }}
              />
            )}
            <Text style={styles.inputLabel}>Purchase Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Purchase Price"
              keyboardType="numeric"
              value={form.purchasePrice?.toString() || ''}
              onChangeText={v =>
                setForm(f => ({...f, purchasePrice: parseFloat(v)}))
              }
            />
            <Text style={styles.inputLabel}>Current Value</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Value"
              keyboardType="numeric"
              value={form.value?.toString() || ''}
              onChangeText={v => setForm(f => ({...f, value: parseFloat(v)}))}
            />
            <Text style={styles.inputLabel}>Mortgage Balance</Text>
            <TextInput
              style={styles.input}
              placeholder="Mortgage Balance"
              keyboardType="numeric"
              value={form.mortgageBalance?.toString() || ''}
              onChangeText={v =>
                setForm(f => ({...f, mortgageBalance: parseFloat(v)}))
              }
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveBtn}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Tabbed Property Detail Screen
const Tab = createMaterialTopTabNavigator();

const PropertyDetailsTab = ({property}: {property: RealEstate}) => (
  <ScrollView style={{padding: 16}}>
    <Text style={{fontWeight: 'bold', fontSize: 18}}>Property Details</Text>
    <Text>Type: {property.propertyType}</Text>
    <Text>Address: {property.propertyAddress}</Text>
    <Text>
      Purchase Date:{' '}
      {property.purchaseDate
        ? typeof property.purchaseDate === 'string'
          ? property.purchaseDate
          : property.purchaseDate.toISOString().slice(0, 10)
        : ''}
    </Text>
    <Text>Purchase Price: ${property.purchasePrice}</Text>
    <Text>Current Value: ${property.value}</Text>
    <Text>Mortgage Balance: ${property.mortgageBalance}</Text>
  </ScrollView>
);

const UnitsTab = ({propertyId}: {propertyId: string}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState<Partial<Unit>>({
    name: '',
    rentAmount: 0,
    tenant: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  const loadUnits = useCallback(async () => {
    setLoading(true);
    const res = await apiService.getUnits(propertyId);
    if (res.success) {
      setUnits(res.data || []);
    } else {
      showToast(res.message || 'Failed to load units', false);
    }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const showToast = (msg: string, success = true) => {
    Toast.show(msg, {
      duration: Toast.durations.LONG,
      backgroundColor: success ? '#28a745' : '#F44336',
    });
  };

  const openModal = (unit?: Unit) => {
    setEditing(unit || null);
    setForm(unit ? {...unit} : {name: '', rentAmount: 0, tenant: ''});
    setError(null);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setEditing(null);
    setForm({name: '', rentAmount: 0, tenant: ''});
    setError(null);
  };

  const validate = () => {
    if (!form.name) {
      return 'Unit name required.';
    }
    if (form.rentAmount === undefined || form.rentAmount < 0) {
      return 'Rent amount required.';
    }
    if (!form.tenant) {
      return 'Tenant required.';
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
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
  const handleDelete = async () => {
    if (!unitToDelete) {
      return;
    }
    try {
      await apiService.deleteUnit(propertyId, unitToDelete._id!);
      showToast('Unit deleted!');
      setDeleteModalVisible(false);
      setUnitToDelete(null);
      loadUnits();
    } catch (e) {
      showToast('Error deleting unit', false);
    }
  };

  const openDeleteConfirm = (unit: Unit) => {
    setUnitToDelete(unit);
    setDeleteModalVisible(true);
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <FlatList
        data={units}
        keyExtractor={item => item._id || item.name}
        renderItem={({item}) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderBottomWidth: 1,
              borderColor: '#eee',
            }}>
            <View style={{flex: 1}}>
              <Text style={{fontWeight: 'bold'}}>{item.name}</Text>
              <Text>Tenant: {item.tenant}</Text>
              <Text>Rent: ${item.rentAmount}</Text>
            </View>
            <TouchableOpacity
              onPress={() => openModal(item)}
              style={{marginRight: 12}}>
              <Text style={{color: '#1976D2'}}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openDeleteConfirm(item)}>
              <Text style={{color: '#F44336'}}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{textAlign: 'center', marginTop: 32}}>
            No units found.
          </Text>
        }
        refreshing={loading}
        onRefresh={loadUnits}
      />
      <TouchableOpacity
        onPress={() => openModal()}
        style={{
          backgroundColor: '#2E7D32',
          padding: 16,
          margin: 16,
          borderRadius: 8,
        }}>
        <Text style={{color: '#fff', textAlign: 'center', fontWeight: 'bold'}}>
          Add Unit
        </Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit' : 'Add'} Unit
            </Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Unit Name"
              value={form.name || ''}
              onChangeText={v => setForm(f => ({...f, name: v}))}
            />
            <Text style={styles.inputLabel}>Tenant</Text>
            <TextInput
              style={styles.input}
              placeholder="Tenant Name"
              value={form.tenant || ''}
              onChangeText={v => setForm(f => ({...f, tenant: v}))}
            />
            <Text style={styles.inputLabel}>Rent Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Rent Amount"
              keyboardType="numeric"
              value={form.rentAmount?.toString() || ''}
              onChangeText={v =>
                setForm(f => ({...f, rentAmount: parseFloat(v)}))
              }
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveBtn}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDelete}
        title="Delete Unit"
        message="Are you sure you want to delete this unit?"
        confirmText="Delete"
      />
    </SafeAreaView>
  );
};

const RentTab = () => (
  <View />
);

const ExpensesTab = ({
  expenses,
  onRefresh,
  onDelete,
  onEdit,
}: {
  expenses: any[];
  onRefresh: () => void;
  onDelete: (expense: any) => void;
  onEdit: (expense: any) => void;
}) => {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <FlatList
        data={expenses}
        keyExtractor={item => item._id}
        refreshing={loading}
        onRefresh={handleRefresh}
        renderItem={({item}) => (
          <View style={styles.expenseRow}>
            <View style={{flex: 1}}>
              <Text style={{fontWeight: 'bold'}}>
                {item.category}: ${item.amount.toFixed(2)}
              </Text>
              <Text>{item.description}</Text>
              <Text>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => onEdit(item)} style={{padding: 5}}>
              <FontAwesome5 name="edit" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(item)}
              style={{padding: 5}}>
              <FontAwesome5 name="trash" color="red" />
            </TouchableOpacity>
          </View>
        )}
      />
      <Button title="Add Expense" onPress={() => onEdit(null)} />
    </SafeAreaView>
  );
};

const DocumentsTab = () => (
  <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
    <Text>Documents (Coming soon)</Text>
  </View>
);
const VacanciesTab = () => (
  <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
    <Text>Vacancies (Coming soon)</Text>
  </View>
);
const AnalyticsTab = () => (
  <View />
);

const PropertyDetailScreen = ({route}: any) => {
  const property = route.params.property;
  return (
    <Tab.Navigator>
      <Tab.Screen name="Details">
        {() => <PropertyDetailsTab property={property} />}
      </Tab.Screen>
      <Tab.Screen name="Units">
        {() => <UnitsTab propertyId={property._id} />}
      </Tab.Screen>
      <Tab.Screen name="Rent" component={RentTab} />
      <Tab.Screen name="Expenses">
        {() => (
          <ExpensesTab
            expenses={route.params.expenses}
            onRefresh={route.params.onRefreshExpenses}
            onDelete={route.params.onDeleteExpense}
            onEdit={route.params.onEditExpense}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Documents" component={DocumentsTab} />
      <Tab.Screen name="Vacancies" component={VacanciesTab} />
      <Tab.Screen name="Analytics" component={AnalyticsTab} />
    </Tab.Navigator>
  );
};

// Main RealEstateScreen: Property List
const RealEstateScreen: React.FC<Props> = ({navigation}) => {
  const [properties, setProperties] = useState<RealEstate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<RealEstate> | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [totalEquity, setTotalEquity] = useState(0);
  const [totalNOI, setTotalNOI] = useState(0);
  const [averageCapRate, setAverageCapRate] = useState(0);
  const [averageCoCReturn, setAverageCoCReturn] = useState(0);

  const [rentForm, setRentForm] = useState({
    startDate: '',
    endDate: '',
    amount: '',
  });
  const [showExpenseDatePicker, setShowExpenseDatePicker] = useState(false);

  const [docsModalVisible, setDocsModalVisible] = useState(false);
  const [docsProperty, setDocsProperty] = useState<RealEstate | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState<any>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [renameDocValue, setRenameDocValue] = useState('');

  const [expensesModalVisible, setExpensesModalVisible] = useState(false);
  const [expensesProperty, setExpensesProperty] = useState<RealEstate | null>(
    null,
  );
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseForm, setExpenseForm] = useState({
    date: '',
    category: 'Property Tax',
    amount: '',
  });
  const [addingExpense, setAddingExpense] = useState(false);
  const [menuVisibleFor, setMenuVisibleFor] = useState<string | null>(null);
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  useEffect(() => {
    loadRealEstateData();
  }, []);

  useEffect(() => {
    console.log('DEBUG: properties state changed:', properties);
  }, [properties]);

  // TEMP: Only render debug block
  console.log('DEBUG: RealEstateScreen render, properties state:', properties);

  const loadRealEstateData = async () => {
    console.log('RealEstateScreen: loadRealEstateData called');
    try {
      setLoading(true);
      console.log('DEBUG: Calling apiService.getRealEstate()');
      const response = await apiService.getRealEstate();
      console.log(
        'DEBUG: getRealEstate FULL response:',
        JSON.stringify(response, null, 2),
      );
      if (response.success && response.data) {
        console.log('DEBUG: About to setProperties with:', response.data);
        setProperties(response.data);
        setTimeout(() => {
          console.log(
            'DEBUG: properties state after setProperties (timeout):',
            properties,
          );
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
            (sum, rent) => sum + (rent.collected ? rent.amount : 0),
            0,
          );
          rentIncome += totalRent;
          const totalExpenses =
            property.expenses?.reduce(
              (sum, expense) => sum + expense.amount,
              0,
            ) || 0;
          noi += totalRent - totalExpenses;
          totalValue += property.value;
          totalInvestment += property.purchasePrice;
        });
        setTotalEquity(equity);
        setTotalNOI(noi);
        if (totalValue > 0) {
          setAverageCapRate((noi / totalValue) * 100);
        }
        if (totalInvestment > 0) {
          setAverageCoCReturn((noi / totalInvestment) * 100);
        }
      }
    } catch (error) {
      console.error('Error loading real estate data:', error);
      Alert.alert('Error', 'Failed to load real estate data');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, success = true) => {
    Toast.show(msg, {
      backgroundColor: success ? '#28a745' : '#F44336',
      duration: 2000,
      position: Toast.positions.BOTTOM,
    });
  };

  const handleSave = async (form: Partial<RealEstate>) => {
    try {
      if (editing && editing._id) {
        await apiService.updateRealEstate(editing._id, form);
        showToast('Property updated!');
      } else {
        await apiService.addRealEstate(form);
        showToast('Property added!');
      }
      closeModal();
      loadRealEstateData();
    } catch (e) {
      showToast('Error saving property', false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property and all its data?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'OK',
          onPress: async () => {
            try {
              const resp = await apiService.deleteRealEstate(id);
              if (resp.success) {
                showToast('Property deleted!');
                loadRealEstateData();
              } else {
                showToast(resp.error || 'Error deleting property', false);
              }
            } catch (e) {
              showToast('Error deleting property', false);
            }
          },
        },
      ],
    );
  };

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') {
      return '$0.00';
    }
    return amount.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
  };

  const formatPercentage = (value: number) => {
    if (typeof value !== 'number' || !isFinite(value)) {
      return '0.0%';
    }
    return `${value.toFixed(1)}%`;
  };

  const openModal = (property: Partial<RealEstate> | null = null) => {
    setEditing(property);
    setModalVisible(true);
  };

  const closeModal = () => {
    setEditing(null);
    setModalVisible(false);
  };

  // Add handler to mark rent as collected
  const handleMarkCollected = async (property: RealEstate, month: string) => {
    try {
      const isCollected = property.rentCollected[month]?.collected;
      if (isCollected === undefined) {
        await apiService.updateRentCollection(property._id!, month, {
          collected: true,
        });
      }
      // Refresh property data in modal
      const response = await apiService.getPropertyDetails(property._id!);
      if (response.success && response.data) {
        // setSelectedProperty(response.data);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update rent status');
    }
  };

  const handleAddRentPayment = async () => {
    /*
    if (!selectedProperty) {
      return;
    }
    */
    if (!rentForm.startDate || !rentForm.endDate || !rentForm.amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setAddingRent(true);
    try {
      /*
      await apiService.addRentPayment(selectedProperty._id!, {
        startDate: rentForm.startDate,
        endDate: rentForm.endDate,
        amount: parseFloat(rentForm.amount),
      });
      // Refresh property data in modal
      const response = await apiService.getPropertyDetails(
        selectedProperty._id!,
      );
      if (response.success && response.data) {
        setSelectedProperty(response.data);
      }
      */
      setRentForm({startDate: '', endDate: '', amount: ''});
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
      if (resp.success && resp.data) {
        setDocs(resp.data);
      }
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
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });
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
      const formData = new FormData();
      formData.append('document', docFile);
      formData.append('name', docName);
      await apiService.uploadDocument(docsProperty._id!, formData);
      // Refresh docs
      const resp = await apiService.listDocuments(docsProperty._id!);
      if (resp.success && resp.data) {
        setDocs(resp.data);
      }
      setDocName('');
      setDocFile(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDoc = (doc: any) => {
    if (doc.path) {
      Linking.openURL(doc.path);
    }
  };
  const handleDeleteDoc = async (doc: any) => {
    if (!docsProperty) {
      return;
    }
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteDocument(docsProperty._id!, doc._id);
              const resp = await apiService.listDocuments(docsProperty._id!);
              if (resp.success && resp.data) {
                setDocs(resp.data);
              }
            } catch {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ],
    );
  };
  const handleOpenRename = (doc: any) => {
    setRenameDocId(doc._id);
    setRenameDocValue(doc.name || '');
    setRenameModalVisible(true);
  };
  const handleRenameDoc = async () => {
    if (!docsProperty || !renameDocId || !renameDocValue) {
      return;
    }
    try {
      await apiService.renameDocument(
        docsProperty._id!,
        renameDocId,
        renameDocValue,
      );
      const resp = await apiService.listDocuments(docsProperty._id!);
      if (resp.success && resp.data) {
        setDocs(resp.data);
      }
      setRenameModalVisible(false);
      setRenameDocId(null);
      setRenameDocValue('');
    } catch {
      Alert.alert('Error', 'Failed to rename document');
    }
  };

  const openExpensesModal = async (property: RealEstate) => {
    setExpensesProperty(property);
    const res = await apiService.listRealEstateExpenses(property._id!);
    if (res.success) {
      setExpenses(res.data);
    }
    setExpensesModalVisible(true);
  };

  const closeExpensesModal = () => {
    setExpensesModalVisible(false);
    setExpensesProperty(null);
    setExpenses([]);
  };

  const handleAddExpense = async () => {
    if (
      !expensesProperty ||
      !expenseForm.date ||
      !expenseForm.category ||
      !expenseForm.amount
    ) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    setAddingExpense(true);
    try {
      await apiService.addRealEstateExpense(expensesProperty._id!, {
        date: expenseForm.date,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        description: '', // Optional description
      });
      // Refresh expenses
      const resp = await apiService.listRealEstateExpenses(
        expensesProperty._id!,
      );
      if (resp.success && resp.data) {
        setExpenses(resp.data);
      }
      setExpenseForm({date: '', category: 'Property Tax', amount: ''});
    } catch (e) {
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpenseClick = (expense: any) => {
    console.log('--- handleDeleteExpenseClick called with:', expense);
    setExpenseToDelete(expense);
    setShowDeleteExpenseModal(true);
  };

  const handleDeleteExpense = async () => {
    console.log('--- handleDeleteExpense called ---');
    console.log('Expense to delete:', expenseToDelete);
    console.log('Property to delete from:', expensesProperty);
    if (expenseToDelete && expensesProperty) {
      try {
        const res = await apiService.deleteRealEstateExpense(
          expensesProperty._id!,
          expenseToDelete._id,
        );
        if (res.success) {
          showToast('Expense Deleted!');
          // Refresh expenses
          const listRes = await apiService.listRealEstateExpenses(
            expensesProperty._id!,
          );
          if (listRes.success) {
            setExpenses(listRes.data);
          }
        } else {
          Alert.alert('Error', 'Failed to delete expense');
        }
      } catch (e) {
        Alert.alert('Error', 'Error deleting expense');
      }
    }
    setShowDeleteExpenseModal(false);
    setExpenseToDelete(null);
  };

  // Calculate cash flow and summary values
  const totalIncome = properties.reduce((sum, p) => {
    // Long-term rent
    const longTerm = Object.values(p.rentCollected || {}).reduce(
      (s, r) => s + (r.amount || 0),
      0,
    );
    // Short-term income
    const shortTerm = (p.shortTermIncome || []).reduce(
      (s, i) => s + (i.amount || 0),
      0,
    );
    return sum + longTerm + shortTerm;
  }, 0);
  const totalExpenses = properties.reduce(
    (sum, p) =>
      sum + (p.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0),
    0,
  );
  const realEstateIncome = totalIncome - totalExpenses;
  // Rent unpaid: rent entries where collected === false
  const rentUnpaid = properties.reduce((sum, p) => {
    return (
      sum +
      Object.values(p.rentCollected || {}).reduce(
        (s, r) => s + (!r.collected ? r.amount || 0 : 0),
        0,
      )
    );
  }, 0);
  // Overdue rent: rent entries where collected === false and due date < today (if available)
  const today = new Date();
  const overdueRent = properties.reduce((sum, p) => {
    return (
      sum +
      Object.entries(p.rentCollected || {}).reduce((s, [month, r]) => {
        // Assume month is YYYY-MM, treat as overdue if before this month
        if (!r.collected && month < today.toISOString().slice(0, 7)) {
          return s + (r.amount || 0);
        }
        return s;
      }, 0)
    );
  }, 0);

  // Cash flow chart data (last 6 months)
  const months = Array.from({length: 6}, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });
  const chartData = {
    labels: months.map(m => m.toLocaleString('default', {month: 'short'})), // ['Jan', 'Feb', ...]
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
              income += p.shortTermIncome
                .filter(i => {
                  const dateStr =
                    typeof i.date === 'string'
                      ? i.date
                      : i.date instanceof Date
                      ? i.date.toISOString()
                      : '';
                  return dateStr.slice(0, 7) === key;
                })
                .reduce((s, i) => s + (i.amount || 0), 0);
            }
            // Expenses
            if (p.expenses) {
              expenses += p.expenses
                .filter(e => {
                  const dateStr =
                    typeof e.date === 'string'
                      ? e.date
                      : e.date instanceof Date
                      ? e.date.toISOString()
                      : '';
                  return dateStr.slice(0, 7) === key;
                })
                .reduce((s, e) => s + (e.amount || 0), 0);
            }
          });
          return income - expenses;
        }),
      },
    ],
  };

  const renderPropertyCard = ({item}: {item: RealEstate}) => {
    const equity = item.value - (item.mortgageBalance || 0);
    const valueIncrease = item.value - item.purchasePrice;
    const valueIncreasePercentage =
      item.purchasePrice > 0 ? (valueIncrease / item.purchasePrice) * 100 : 0;

    return (
      <View style={styles.propertyCard}>
        <View style={styles.cardHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
            <FontAwesome5 name="link" size={20} color="#4D8AF0" />
            <Text style={styles.propertyAddress} numberOfLines={1}>
              {item.propertyAddress}
            </Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View
              style={[
                styles.propertyTypeContainer,
                {backgroundColor: 'rgba(2, 189, 108, 0.1)'},
              ]}>
              <Text style={[styles.propertyType, {color: '#02BD6C'}]}>
                {item.propertyType}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                item._id &&
                setMenuVisibleFor(menuVisibleFor === item._id ? null : item._id)
              }
              style={{marginLeft: 8}}>
              <FontAwesome5 name="ellipsis-v" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {menuVisibleFor === item._id && (
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisibleFor(null);
                openModal(item);
              }}>
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisibleFor(null);
                if (item._id) {
                  handleDelete(item._id);
                }
              }}>
              <Text style={[styles.menuText, {color: '#F44336'}]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.houseIconContainer}>
            <FontAwesome5 name="home" size={40} color="#4D8AF0" />
          </View>
          <View style={styles.financialInfo}>
            <View style={styles.financialItem}>
              <FontAwesome5
                name="hand-holding-usd"
                size={20}
                color="#888"
                style={{marginBottom: 8}}
              />
              <Text style={styles.financialLabel}>Equity</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(equity)}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <FontAwesome5
                name="dollar-sign"
                size={20}
                color="#888"
                style={{marginBottom: 8}}
              />
              <Text style={styles.financialLabel}>$ Zestimate</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(item.value)}
              </Text>
              {valueIncreasePercentage !== 0 && (
                <View style={styles.percentageContainer}>
                  <FontAwesome5
                    name={
                      valueIncreasePercentage > 0 ? 'arrow-up' : 'arrow-down'
                    }
                    color={valueIncreasePercentage > 0 ? '#4CAF50' : '#F44336'}
                  />
                  <Text
                    style={[
                      styles.percentageChange,
                      {
                        color:
                          valueIncreasePercentage > 0 ? '#4CAF50' : '#F44336',
                      },
                    ]}>
                    {formatPercentage(Math.abs(valueIncreasePercentage))}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.financialItem}>
              <FontAwesome5
                name="landmark"
                size={20}
                color="#888"
                style={{marginBottom: 8}}
              />
              <Text style={styles.financialLabel}>Mortgage</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(item.mortgageBalance)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: '#4D8AF0'}]}
            onPress={() => handlePropertyPress(item)}>
            <FontAwesome5 name="eye" size={14} color="#fff" />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: '#6c757d'}]}
            onPress={() => openDocsModal(item)}>
            <FontAwesome5 name="file-alt" size={14} color="#fff" />
            <Text style={styles.actionButtonText}>Property Docs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: '#ffc107'}]}
            onPress={() => openExpensesModal(item)}>
            <FontAwesome5 name="dollar-sign" size={14} color="#fff" />
            <Text style={styles.actionButtonText}>Manage Expenses</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handlePropertyPress = (property: RealEstate) => {
    const refreshExpenses = async () => {
      if (property && property._id) {
        const res = await apiService.listRealEstateExpenses(property._id);
        if (res.success) {
          setExpenses(res.data);
        }
      }
    };

    const handleEdit = (expense: any) => {
      // Logic to open an edit/add modal for expenses
      setEditingExpense(expense);
      setExpensesModalVisible(true);
      setExpensesProperty(property); // Set the property context
    };

    navigation.navigate('PropertyDetail', {
      property,
      expenses,
      onRefreshExpenses: refreshExpenses,
      onDeleteExpense: handleDeleteExpenseClick,
      onEditExpense: handleEdit,
    });
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
      <View
        style={{
          backgroundColor: '#151e2e',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#22304a',
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 18,
          }}>
          Real Estate Income
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}>
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={{color: '#b0b8c1', fontSize: 13}}>Total Equity</Text>
            <Text
              style={{
                color: '#1ea7fd',
                fontSize: 18,
                fontWeight: 'bold',
                marginTop: 2,
              }}>
              {formatCurrency(totalEquity)}
            </Text>
          </View>
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={{color: '#b0b8c1', fontSize: 13}}>Rent Unpaid</Text>
            <Text
              style={{
                color: '#1ea7fd',
                fontSize: 18,
                fontWeight: 'bold',
                marginTop: 2,
              }}>
              {formatCurrency(rentUnpaid)}
            </Text>
          </View>
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={{color: '#b0b8c1', fontSize: 13}}>Overdue Rent</Text>
            <Text
              style={{
                color: '#1ea7fd',
                fontSize: 18,
                fontWeight: 'bold',
                marginTop: 2,
              }}>
              {formatCurrency(overdueRent)}
            </Text>
          </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              width: 24,
              height: 220,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 4,
            }}>
            <Text
              style={{
                color: '#b0b8c1',
                fontSize: 13,
                fontWeight: 'bold',
                transform: [{rotate: '-90deg'}],
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
              propsForBackgroundLines: {stroke: '#22304a'},
              style: {borderRadius: 12},
            }}
            bezier
            style={{borderRadius: 12, marginTop: 8}}
            fromZero
            segments={5}
            formatYLabel={y => `$${Number(y).toLocaleString()}`}
          />
        </View>
      </View>
      {/* Portfolio Summary Card */}
      <View
        style={{
          backgroundColor: '#1a2233',
          borderRadius: 16,
          padding: 20,
          marginBottom: 18,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 16,
            textAlign: 'center',
          }}>
          Portfolio Summary
        </Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={{color: '#b0b8c1', fontSize: 13}}>Total NOI</Text>
            <Text
              style={{
                color: '#1ea7fd',
                fontSize: 18,
                fontWeight: 'bold',
                marginTop: 2,
              }}>
              {formatCurrency(totalNOI)}
            </Text>
          </View>
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={{color: '#b0b8c1', fontSize: 13}}>Avg. Cap Rate</Text>
            <Text
              style={{
                color: '#1ea7fd',
                fontSize: 18,
                fontWeight: 'bold',
                marginTop: 2,
              }}>
              {formatPercentage(averageCapRate)}
            </Text>
          </View>
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={{color: '#b0b8c1', fontSize: 13}}>
              Avg. CoC Return
            </Text>
            <Text
              style={{
                color: '#1ea7fd',
                fontSize: 18,
                fontWeight: 'bold',
                marginTop: 2,
              }}>
              {formatPercentage(averageCoCReturn)}
            </Text>
          </View>
        </View>
      </View>
      <FlatList
        data={properties}
        keyExtractor={item => item._id || item.propertyAddress}
        renderItem={renderPropertyCard}
        contentContainerStyle={{paddingBottom: 100}}
        ListEmptyComponent={
          <Text style={{color: '#fff', textAlign: 'center', marginTop: 40}}>
            No properties found.
          </Text>
        }
      />
      <PropertyForm
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initialData={editing}
      />
      {/* Property Details Modal */}
      <Modal
        visible={docsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDocsModal}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              backgroundColor: '#34425a',
              borderRadius: 12,
              width: '92%',
              maxWidth: 500,
              padding: 0,
              overflow: 'hidden',
            }}>
            {/* Header */}
            <View
              style={{
                backgroundColor: '#3a4660',
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text style={{color: '#fff', fontSize: 22, fontWeight: 'bold'}}>
                Property Documents
              </Text>
              <TouchableOpacity onPress={closeDocsModal}>
                <Text style={{color: '#b0b8c1', fontSize: 28}}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{maxHeight: 600}}
              contentContainerStyle={{padding: 24}}>
              <Text
                style={{
                  color: '#b0b8c1',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 10,
                }}>
                Existing Documents
              </Text>
              {docs.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#1a2233',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 18,
                  }}>
                  <Text style={{color: '#b0b8c1', fontSize: 15}}>
                    No documents found for this property.
                  </Text>
                </View>
              ) : (
                docs.map(doc => (
                  <View
                    key={doc._id}
                    style={{
                      backgroundColor: '#1a2233',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <Text style={{color: '#fff', fontSize: 15, flex: 1}}>
                      {doc.name || doc.type || 'Document'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDownloadDoc(doc)}
                      style={{marginHorizontal: 4}}>
                      <FontAwesome5 name="download" size={16} color="#2196f3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleOpenRename(doc)}
                      style={{marginHorizontal: 4}}>
                      <FontAwesome5 name="edit" size={16} color="#ffc107" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteDoc(doc)}
                      style={{marginHorizontal: 4}}>
                      <FontAwesome5 name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
              <View
                style={{
                  height: 1,
                  backgroundColor: '#3a4660',
                  marginVertical: 18,
                }}
              />
              <Text
                style={{
                  color: '#b0b8c1',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 10,
                }}>
                Upload New Document
              </Text>
              <Text style={{color: '#b0b8c1', fontSize: 14, marginBottom: 4}}>
                Document Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#3a4660',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 12,
                  backgroundColor: '#233047',
                  color: '#fff',
                }}
                placeholder="e.g., Lease Agreement 2024"
                placeholderTextColor="#b0b8c1"
                value={docName}
                onChangeText={setDocName}
              />
              <Text style={{color: '#b0b8c1', fontSize: 14, marginBottom: 4}}>
                File
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#3a4660',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 16,
                  backgroundColor: '#233047',
                }}
                onPress={handlePickDoc}>
                <Text style={{color: '#fff', flex: 1}}>
                  {docFile
                    ? docFile.name || docFile.fileName
                    : 'No file chosen'}
                </Text>
                <Text
                  style={{color: '#2196f3', fontWeight: 'bold', fontSize: 15}}>
                  Choose File
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#1976D2',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginBottom: 18,
                }}
                onPress={handleUploadDoc}
                disabled={uploadingDoc}>
                <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>
                  {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#b0b8c1',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
                onPress={closeDocsModal}>
                <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={expensesModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeExpensesModal}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              backgroundColor: '#34425a',
              borderRadius: 12,
              width: '92%',
              maxWidth: 500,
              padding: 0,
              overflow: 'hidden',
            }}>
            {/* Header */}
            <View
              style={{
                backgroundColor: '#3a4660',
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text style={{color: '#fff', fontSize: 22, fontWeight: 'bold'}}>
                {editingExpense?._id ? 'Edit' : 'Add'} Expense
              </Text>
              <TouchableOpacity onPress={closeExpensesModal}>
                <Text style={{color: '#b0b8c1', fontSize: 28}}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{maxHeight: 600}}
              contentContainerStyle={{padding: 24}}>
              <Text style={{color: '#b0b8c1', fontSize: 14, marginBottom: 4}}>
                Date
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#3a4660',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 12,
                  backgroundColor: '#233047',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => setShowExpenseDatePicker(true)}>
                <Text
                  style={{
                    color: expenseForm.date ? '#fff' : '#b0b8c1',
                    flex: 1,
                  }}>
                  {expenseForm.date
                    ? new Date(expenseForm.date).toLocaleDateString()
                    : 'mm/dd/yyyy'}
                </Text>
                <FontAwesome5 name="calendar-alt" size={16} color="#b0b8c1" />
              </TouchableOpacity>
              {showExpenseDatePicker && (
                <DateTimePicker
                  value={
                    expenseForm.date ? new Date(expenseForm.date) : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowExpenseDatePicker(false);
                    if (date) {
                      setExpenseForm(f => ({...f, date: date.toISOString()}));
                    }
                  }}
                />
              )}
              <Text style={{color: '#b0b8c1', fontSize: 14, marginBottom: 4}}>
                Category
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: '#3a4660',
                  borderRadius: 8,
                  marginBottom: 12,
                  backgroundColor: '#233047',
                }}>
                <Picker
                  selectedValue={expenseForm.category}
                  onValueChange={v =>
                    setExpenseForm(f => ({...f, category: v}))
                  }
                  style={{color: '#fff'}}
                  dropdownIconColor="#b0b8c1">
                  {[
                    'Property Tax',
                    'Insurance',
                    'Maintenance',
                    'Utilities',
                    'HOA Fees',
                    'Repairs',
                    'Other',
                  ].map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
              <Text style={{color: '#b0b8c1', fontSize: 14, marginBottom: 4}}>
                Amount
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#3a4660',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 16,
                  backgroundColor: '#233047',
                  color: '#fff',
                }}
                placeholder="$..."
                placeholderTextColor="#b0b8c1"
                keyboardType="numeric"
                value={expenseForm.amount}
                onChangeText={v => setExpenseForm(f => ({...f, amount: v}))}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: '#1976D2',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginBottom: 18,
                }}
                onPress={handleAddExpense}
                disabled={addingExpense}>
                <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>
                  {addingExpense ? 'Adding...' : 'Add Expense'}
                </Text>
              </TouchableOpacity>
              <View
                style={{
                  height: 1,
                  backgroundColor: '#3a4660',
                  marginVertical: 18,
                }}
              />
              <Text
                style={{
                  color: '#b0b8c1',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 10,
                }}>
                Existing Expenses
              </Text>
              {expenses.length === 0 ? (
                <Text style={{color: '#b0b8c1', fontSize: 15}}>
                  No expenses recorded for this property.
                </Text>
              ) : (
                expenses.map(exp => (
                  <View
                    key={exp._id}
                    style={{
                      backgroundColor: '#1a2233',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <Text style={{color: '#fff', fontSize: 15, flex: 1}}>
                      {new Date(exp.date).toLocaleDateString()} - {exp.category}{' '}
                      - ${exp.amount}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteExpenseClick(exp)}>
                      <FontAwesome5 name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Expense Modal */}
      <DeleteModal
        visible={showDeleteExpenseModal}
        onClose={() => setShowDeleteExpenseModal(false)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense from this property?"
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
    backgroundColor: '#1E2A3B',
    borderRadius: 15,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
    zIndex: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  propertyAddress: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flexShrink: 1,
    marginLeft: 12,
  },
  propertyTypeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  propertyType: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  menu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#2C3E50',
    borderRadius: 8,
    padding: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    zIndex: 100,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
  },
  cardBody: {
    alignItems: 'center',
    marginBottom: 16,
  },
  houseIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  financialInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  financialItem: {
    alignItems: 'center',
    paddingHorizontal: 5,
    flex: 1,
  },
  financialLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  financialValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginHorizontal: 4,
  },
  percentageChange: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
    paddingTop: 16,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E2A3B',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#2C3E50',
    borderRadius: 5,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  pickerWrapper: {
    backgroundColor: '#2C3E50',
    borderRadius: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  saveBtn: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelBtn: {
    color: '#aaa',
    fontSize: 18,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginTop: 10,
  },
  docsModalContent: {
    backgroundColor: '#1E2A3B',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  expensePropertyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerButton: {
    backgroundColor: '#2C3E50',
    borderRadius: 5,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  datePickerText: {
    color: '#fff',
    fontSize: 16,
  },
  rentModalContent: {
    backgroundColor: '#1E2A3B',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  rentMonthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  rentMonthText: {
    color: '#fff',
    fontSize: 16,
  },
  rentCollectedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  rentNotCollectedText: {
    color: '#aaa',
  },
  collectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  collectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detailModalContent: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  detailHeader: {
    padding: 16,
    backgroundColor: '#1E2A3B',
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  closeDetailButton: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  closeDetailButtonText: {
    color: '#4D8AF0',
    fontSize: 18,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
});

export default RealEstateScreen;
export {PropertyDetailScreen};
