import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { apiService } from '../services/api';

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

  return (
    <View style={styles.container}>
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
              </View>
            );
          }}
        />
      )}
      {/* TODO: Add buttons for Add/Edit/Link Account */}
    </View>
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
  emptyText: {
    color: '#b0b8c1',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

export default AccountsScreen; 