import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, Modal, TextInput } from 'react-native';
import { apiService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Linking } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

interface Account {
  _id: string;
  name: string;
  category: string;
  amount: number;
  institutionName?: string;
  mask?: string;
}

interface AccountSection {
  title: string;
  data: Account[];
}

const AccountsScreen: React.FC = () => {
  const [sections, setSections] = useState<AccountSection[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState('');
  const [manualBalance, setManualBalance] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  console.log('🏦 AccountsScreen: rendering');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAccounts();
      console.log('🏦 AccountsScreen: getAccounts response:', response);
      if (response.success && response.data) {
        // Log the raw data for inspection
        console.log('🏦 AccountsScreen: raw data:', response.data);
        // Transform categorized object into sections array, mapping Plaid fields
        const newSections: AccountSection[] = Object.entries(response.data)
          .map(([category, accounts]) => ({
            title: category.charAt(0).toUpperCase() + category.slice(1),
            data: (accounts as any[]).map((acct: any) => ({
              _id: acct.account_id || acct._id || acct.id || '',
              name: acct.name || acct.official_name || 'Unnamed',
              category: acct.type || category || '',
              amount: (acct.balances && typeof acct.balances.current === 'number') ? acct.balances.current : (typeof acct.amount === 'number' ? acct.amount : 0),
              institutionName: acct.institutionName || '',
              mask: acct.mask || '',
            }))
          }))
          .map(section => ({
            ...section,
            data: section.data.filter(item => item._id && typeof item.amount === 'number')
          }))
          .filter(section => section.data.length > 0);
        setSections(newSections);
        console.log('🏦 AccountsScreen: setSections with', newSections.length, 'sections');
      } else {
        setSections([]);
      }
    } catch (err) {
      setSections([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (accountId: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const response = await apiService.deleteAccount(accountId);
            if (response.success) {
              fetchAccounts();
            } else {
              Alert.alert('Error', response.error || 'Failed to delete account');
            }
          }
        }
      ]
    );
  };

  const handlePlaidLink = async () => {
    // Get Plaid Link token from backend
    try {
      console.log('🔗 Requesting Plaid link token...');
      const response = await apiService.createPlaidLinkToken();
      console.log('🔗 Plaid link token response:', response);
      if (response.success && response.data?.link_token) {
        const linkToken = response.data.link_token;
        const url = `https://link.plaid.com/?token=${linkToken}`;
        console.log('🔗 Plaid link token:', linkToken);
        console.log('🔗 Plaid Link URL:', url);
        Alert.alert('Plaid Debug', `Token: ${linkToken}\n\nURL: ${url}`);
        Linking.openURL(url);
      } else {
        Alert.alert('Error', response.error || 'Failed to get Plaid link token');
        console.error('Plaid link token error:', response);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to start Plaid Link');
      console.error('Plaid link token exception:', err);
    }
  };

  const handleManualAdd = async () => {
    if (!manualName || !manualType || !manualBalance) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setManualLoading(true);
    try {
      const response = await apiService.addManualAccount({
        name: manualName,
        type: manualType,
        amount: parseFloat(manualBalance),
      });
      if (response.success) {
        setShowManualModal(false);
        setManualName('');
        setManualType('');
        setManualBalance('');
        fetchAccounts();
      } else {
        Alert.alert('Error', response.error || 'Failed to add account');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add account');
    }
    setManualLoading(false);
  };

  const totalBalance = sections
    .flatMap(section => section.data)
    .reduce((sum, acct) => sum + (typeof acct.amount === 'number' ? acct.amount : 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <View style={styles.container}>
        {/* Plaid Link Card */}
        <View style={{
          backgroundColor: '#1a2233',
          borderRadius: 18,
          padding: 24,
          marginBottom: 18,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <FontAwesome5 name="lock" size={24} color="#b0b8c1" style={{ marginBottom: 12 }} />
          <Text style={{ color: '#e6eaf0', fontSize: 18, fontWeight: '500', textAlign: 'center', marginBottom: 12 }}>
            Securely link your <Text style={{ fontWeight: 'bold', color: '#fff' }}>Accounts</Text> for Better Visibility
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#23d160',
              borderRadius: 8,
              paddingVertical: 14,
              paddingHorizontal: 32,
              marginBottom: 18,
              marginTop: 4,
            }}
            onPress={handlePlaidLink}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>
              <FontAwesome5 name="lock" size={16} color="#fff" /> Securely Link An Account
            </Text>
          </TouchableOpacity>
          {/* Illustration placeholder */}
          <View style={{ width: 160, height: 120, backgroundColor: '#23395d', borderRadius: 16, marginTop: 8, marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesome5 name="user" size={48} color="#23aaff" />
          </View>
        </View>
        {/* Balances summary card */}
        <View style={{
          backgroundColor: '#222b3a',
          borderRadius: 18,
          padding: 18,
          marginBottom: 18,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <Text style={{ color: '#b0b8c1', fontSize: 15, marginBottom: 6 }}>Total Balance</Text>
          <Text style={{ color: '#23aaff', fontSize: 28, fontWeight: 'bold' }}>
            ${totalBalance.toLocaleString()}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity style={styles.addManualButton} onPress={() => setShowManualModal(true)}>
            <Text style={styles.addManualText}>Add Account Manually</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Accounts</Text>
        {loading ? (
          <ActivityIndicator color="#23aaff" />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item, index) => (item && typeof item._id === 'string' ? item._id : `account-${index}`)}
            ListEmptyComponent={<Text style={styles.emptyText}>No accounts found.</Text>}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            renderItem={({ item }) => {
              if (!item || typeof item._id !== 'string' || typeof item.amount !== 'number') {
                return null;
              }
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.accountName}>{item.name || 'Unnamed'}</Text>
                    <View style={styles.typePill}>
                      <Text style={styles.typePillText}>{item.category || ''}</Text>
                    </View>
                  </View>
                  <Text style={styles.accountBalance}>
                    {typeof item.amount === 'number' ? `$${item.amount.toLocaleString()}` : '$0'}
                  </Text>
                  {item.institutionName ? (
                    <Text style={styles.institutionText}>{item.institutionName}{item.mask ? ` •••${item.mask}` : ''}</Text>
                  ) : null}
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.transactionsButton} onPress={() => navigation.navigate('Transactions', { accountId: item._id, accountName: item.name })}>
                    <Text style={styles.transactionsText}>View Transactions</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
        <Modal visible={showManualModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Account Manually</Text>
              <TextInput style={styles.modalInput} placeholder="Account Name" value={manualName} onChangeText={setManualName} />
              <TextInput style={styles.modalInput} placeholder="Account Type" value={manualType} onChangeText={setManualType} />
              <TextInput style={styles.modalInput} placeholder="Balance" value={manualBalance} onChangeText={setManualBalance} keyboardType="numeric" />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowManualModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalAddButton} onPress={handleManualAdd} disabled={manualLoading}>
                  <Text style={styles.modalAddText}>{manualLoading ? 'Adding...' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181f2a',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#23aaff',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b0b8c1',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 18,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#222b3a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  accountName: {
    color: '#e6eaf0',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    flexWrap: 'wrap',
  },
  typePill: {
    backgroundColor: '#23395d',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  typePillText: {
    color: '#23aaff',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  accountBalance: {
    color: '#23aaff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 2,
  },
  institutionText: {
    color: '#b0b8c1',
    fontSize: 13,
    marginBottom: 8,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deleteText: {
    color: '#ff5555',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#23aaff',
    borderRadius: 8,
    marginLeft: 8,
  },
  transactionsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#b0b8c1',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  addManualButton: {
    backgroundColor: '#23395d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addManualText: {
    color: '#23aaff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222b3a',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    color: '#23aaff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#181f2a',
    color: '#e6eaf0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  modalCancelButton: {
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCancelText: {
    color: '#b0b8c1',
    fontSize: 15,
  },
  modalAddButton: {
    backgroundColor: '#23aaff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalAddText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default AccountsScreen; 