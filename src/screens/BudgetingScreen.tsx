import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Budget} from '../types';
import { apiService } from '../services/api';

type BudgetingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Budgeting'
>;

interface Props {
  navigation: BudgetingScreenNavigationProp;
}

const BudgetingScreen: React.FC<Props> = ({navigation}) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const loadBudgets = useCallback(async () => {
    try {
      const response = await apiService.getBudgets(selectedMonth);
      if (response.success && response.data) {
        setBudgets(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (spent: number, budget: number): number => {
    if (budget === 0) {
      return 0;
    }
    return Math.min((spent / budget) * 100, 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) {
      return '#F44336';
    } // Red
    if (percentage >= 75) {
      return '#FF9800';
    } // Orange
    return '#4CAF50'; // Green
  };

  const getTotalBudget = (): number => {
    return budgets.reduce((total, budget) => total + budget.amount, 0);
  };

  const getTotalSpent = (): number => {
    return budgets.reduce((total, budget) => total + budget.spent, 0);
  };

  const getRemainingBudget = (): number => {
    return getTotalBudget() - getTotalSpent();
  };

  const ProgressBar = ({
    percentage,
    color,
  }: {
    percentage: number;
    color: string;
  }) => (
    <View style={styles.progressBarContainer}>
      <View
        style={[
          styles.progressBar,
          {width: `${percentage}%`, backgroundColor: color},
        ]}
      />
    </View>
  );

  const MonthSelector = () => {
    const months = [
      {value: '2024-01', label: 'Jan 2024'},
      {value: '2024-02', label: 'Feb 2024'},
      {value: '2024-03', label: 'Mar 2024'},
      {value: '2024-04', label: 'Apr 2024'},
      {value: '2024-05', label: 'May 2024'},
      {value: '2024-06', label: 'Jun 2024'},
      {value: '2024-07', label: 'Jul 2024'},
      {value: '2024-08', label: 'Aug 2024'},
      {value: '2024-09', label: 'Sep 2024'},
      {value: '2024-10', label: 'Oct 2024'},
      {value: '2024-11', label: 'Nov 2024'},
      {value: '2024-12', label: 'Dec 2024'},
    ];

    return (
      <View style={styles.monthSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {months.map(month => (
            <TouchableOpacity
              key={month.value}
              style={[
                styles.monthButton,
                selectedMonth === month.value && styles.monthButtonActive,
              ]}
              onPress={() => setSelectedMonth(month.value)}>
              <Text
                style={[
                  styles.monthButtonText,
                  selectedMonth === month.value && styles.monthButtonTextActive,
                ]}>
                {month.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading budget data...</Text>
      </View>
    );
  }

  const totalBudget = getTotalBudget();
  const totalSpent = getTotalSpent();
  const remaining = getRemainingBudget();
  const overallProgress = getProgressPercentage(totalSpent, totalBudget);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budgeting</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddEntry')}>
            <Text style={styles.addButtonText}>+ Add Budget</Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <MonthSelector />

        {/* Overall Budget Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Monthly Overview</Text>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Total Budget</Text>
              <Text style={styles.overviewAmount}>
                {formatCurrency(totalBudget)}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Spent</Text>
              <Text style={[styles.overviewAmount, {color: '#F44336'}]}>
                {formatCurrency(totalSpent)}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Remaining</Text>
              <Text style={[styles.overviewAmount, {color: '#23aaff'}]}>
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>
          <ProgressBar percentage={overallProgress} color={getProgressColor(overallProgress)} />
        </View>

        {/* Budget Cards */}
        <View style={{marginTop: 18}}>
          {budgets.length === 0 ? (
            <Text style={styles.emptyText}>No budgets found for this month.</Text>
          ) : (
            budgets.map((budget, idx) => {
              if (!budget || typeof budget.amount !== 'number' || typeof budget.spent !== 'number' || !budget.category) {
                return null;
              }
              const percent = getProgressPercentage(budget.spent, budget.amount);
              return (
                <View style={styles.card} key={budget._id || idx}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.categoryPill}>{budget.category}</Text>
                    {budget._id && (
                      <TouchableOpacity onPress={() => navigation.navigate('EditEntry', { entryId: budget._id as string })}>
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.cardAmount}>{formatCurrency(budget.amount)}</Text>
                  <Text style={styles.cardSpent}>Spent: <Text style={{color: getProgressColor(percent)}}>{formatCurrency(budget.spent)}</Text></Text>
                  <ProgressBar percentage={percent} color={getProgressColor(percent)} />
                </View>
              );
            })
          )}
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
    justifyContent: 'space-between',
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
  addButton: {
    backgroundColor: '#23aaff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  monthSelector: {
    marginBottom: 10,
    marginTop: 4,
  },
  monthButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#222b3a',
    marginRight: 8,
  },
  monthButtonActive: {
    backgroundColor: '#23aaff',
  },
  monthButtonText: {
    color: '#b0b8c1',
    fontWeight: '600',
    fontSize: 15,
  },
  monthButtonTextActive: {
    color: '#fff',
  },
  overviewCard: {
    backgroundColor: '#222b3a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewTitle: {
    color: '#e6eaf0',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewLabel: {
    color: '#b0b8c1',
    fontSize: 14,
    marginBottom: 2,
  },
  overviewAmount: {
    color: '#23aaff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#2c3650',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 2,
  },
  progressBar: {
    height: 8,
    borderRadius: 6,
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
  categoryPill: {
    backgroundColor: '#23395d',
    color: '#23aaff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  editText: {
    color: '#23aaff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 10,
  },
  cardAmount: {
    color: '#e6eaf0',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 2,
  },
  cardSpent: {
    color: '#b0b8c1',
    fontSize: 15,
    marginBottom: 4,
  },
  emptyText: {
    color: '#b0b8c1',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  budgetCard: {
    backgroundColor: '#222b3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  editButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  budgetAmounts: {
    marginBottom: 15,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  quickActionButton: {
    backgroundColor: '#222b3a',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default BudgetingScreen;
