import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Expense, SavingsGoal} from '../types';
import { apiService } from '../services/api';

type BudgetingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Budgeting'
>;

interface Props {
  navigation: BudgetingScreenNavigationProp;
}

const BudgetingScreen: React.FC<Props> = ({navigation}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const expRes = await apiService.getExpenses();
      const goalRes = await apiService.getSavingsGoals();
      if (expRes.success && expRes.data) setExpenses(expRes.data);
      if (goalRes.success && goalRes.data) setGoals(goalRes.data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading budgeting data...</Text>
      </View>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSavings = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budgeting</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryText}>Total Expenses: ${totalExpenses.toFixed(2)}</Text>
          <Text style={styles.summaryText}>Total Saved: ${totalSavings.toFixed(2)}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.navButtonText}>View Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('SavingsGoals')}>
            <Text style={styles.navButtonText}>View Savings Goals</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181f2a',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#23aaff',
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: '#222b3a',
    borderRadius: 18,
    padding: 18,
    margin: 18,
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#e6eaf0',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  summaryText: {
    color: '#b0b8c1',
    fontSize: 16,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  navButton: {
    backgroundColor: '#23aaff',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginHorizontal: 8,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BudgetingScreen;
