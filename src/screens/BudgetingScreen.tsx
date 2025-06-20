import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
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
            <Text style={[styles.overviewAmount, {color: '#4CAF50'}]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPercentage}>
              {overallProgress.toFixed(1)}%
            </Text>
          </View>
          <ProgressBar
            percentage={overallProgress}
            color={getProgressColor(overallProgress)}
          />
        </View>
      </View>

      {/* Budget Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Budget Categories</Text>

        {budgets.length > 0 ? (
          budgets.map(budget => {
            const progress = getProgressPercentage(budget.spent, budget.amount);
            const progressColor = getProgressColor(progress);

            return (
              <View key={budget._id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetCategory}>{budget.category}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      navigation.navigate('EditEntry', {
                        entryId: budget._id || '',
                      })
                    }>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.budgetAmounts}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Budget:</Text>
                    <Text style={styles.amountValue}>
                      {formatCurrency(budget.amount)}
                    </Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Spent:</Text>
                    <Text style={[styles.amountValue, {color: '#F44336'}]}>
                      {formatCurrency(budget.spent)}
                    </Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Remaining:</Text>
                    <Text style={[styles.amountValue, {color: '#4CAF50'}]}>
                      {formatCurrency(budget.amount - budget.spent)}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressPercentage}>
                      {progress.toFixed(1)}%
                    </Text>
                  </View>
                  <ProgressBar percentage={progress} color={progressColor} />
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateTitle}>No Budget Categories</Text>
            <Text style={styles.emptyStateText}>
              Create your first budget category to start tracking your spending.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('AddEntry')}>
              <Text style={styles.emptyStateButtonText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('AddEntry')}>
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Add Category</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('AddEntry')}>
          <Text style={styles.quickActionIcon}>💰</Text>
          <Text style={styles.quickActionText}>Record Expense</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#181f2a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  monthSelector: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  monthButtonActive: {
    backgroundColor: '#2E7D32',
  },
  monthButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  monthButtonTextActive: {
    color: '#fff',
  },
  overviewCard: {
    backgroundColor: '#222b3a',
    margin: 20,
    marginTop: 10,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  overviewAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressSection: {
    marginTop: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
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
