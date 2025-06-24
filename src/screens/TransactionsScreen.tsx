import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {apiService} from '../services/api';

// Transaction type (customize as needed)
interface Transaction {
  id?: string;
  _id?: string;
  name?: string;
  description?: string;
  amount?: number;
  date?: string;
}

type TransactionsScreenRouteProp = RouteProp<
  RootStackParamList,
  'Transactions'
>;

type TransactionsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Transactions'
>;

const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const route = useRoute<TransactionsScreenRouteProp>();
  const {accountId, accountName} = route.params;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // Placeholder: implement apiService.getTransactions(accountId)
        const response = await apiService.getTransactions(accountId);
        if (response.success && response.data) {
          setTransactions(response.data);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        setTransactions([]);
      }
      setLoading(false);
    };
    if (accountId) {
      fetchTransactions();
    }
  }, [accountId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{accountName || 'Transactions'}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#23aaff" style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, idx) => item.id || item._id || `txn-${idx}`}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions found.</Text>
          }
          renderItem={({item}) => (
            <View style={styles.card}>
              <Text style={styles.txnName}>
                {item.name || item.description || 'Transaction'}
              </Text>
              <Text style={styles.txnAmount}>
                {typeof item.amount === 'number'
                  ? `$${item.amount.toLocaleString()}`
                  : ''}
              </Text>
              <Text style={styles.txnDate}>
                {item.date ? new Date(item.date).toLocaleDateString() : ''}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181f2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#222b3a',
  },
  title: {
    color: '#23aaff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff5555',
    borderRadius: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#222b3a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  txnName: {
    color: '#e6eaf0',
    fontSize: 16,
    fontWeight: '600',
  },
  txnAmount: {
    color: '#23aaff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  txnDate: {
    color: '#b0b8c1',
    fontSize: 13,
    marginTop: 4,
  },
  emptyText: {
    color: '#b0b8c1',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

export default TransactionsScreen;
