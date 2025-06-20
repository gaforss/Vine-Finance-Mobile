import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, NetWorth} from '../types';
import { apiService } from '../services/api';

type NetWorthScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'NetWorth'
>;

interface Props {
  navigation: NetWorthScreenNavigationProp;
}

const NetWorthScreen: React.FC<Props> = ({navigation}) => {
  const [netWorthData, setNetWorthData] = useState<NetWorth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    '1M' | '3M' | '6M' | '1Y' | 'ALL'
  >('3M');

  useEffect(() => {
    loadNetWorthData();
  }, []);

  const loadNetWorthData = async () => {
    try {
      const response = await apiService.getNetWorthEntries();
      if (response.success && response.data) {
        setNetWorthData(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load net worth data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNetWorthData();
    setRefreshing(false);
  };

  const getCurrentNetWorth = (): number => {
    if (netWorthData.length === 0) {
      return 0;
    }
    const latest = netWorthData[netWorthData.length - 1];
    return latest.netWorth;
  };

  const getNetWorthChange = (): {amount: number; percentage: number} => {
    if (netWorthData.length < 2) {
      return {amount: 0, percentage: 0};
    }

    const current = netWorthData[netWorthData.length - 1];
    const previous = netWorthData[netWorthData.length - 2];

    const change = current.netWorth - previous.netWorth;
    const percentage =
      previous.netWorth > 0 ? (change / previous.netWorth) * 100 : 0;

    return {amount: change, percentage};
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChartData = () => {
    const filteredData = netWorthData.slice(-12); // Last 12 entries for chart
    return {
      labels: filteredData.map(entry =>
        new Date(entry.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      ),
      datasets: [
        {
          data: filteredData.map(entry => entry.netWorth),
          color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getAssetBreakdown = () => {
    if (netWorthData.length === 0) {
      return {totalAssets: 0, liabilities: 0};
    }
    const latest = netWorthData[netWorthData.length - 1];

    // Calculate total assets from individual asset fields
    const totalAssets =
      latest.cash +
      latest.investments +
      latest.realEstate +
      latest.retirementAccounts +
      latest.vehicles +
      latest.personalProperty +
      latest.otherAssets;

    return {
      totalAssets,
      liabilities: latest.liabilities,
    };
  };

  const PeriodButton: React.FC<{
    period: '1M' | '3M' | '6M' | '1Y' | 'ALL';
    label: string;
  }> = ({period, label}) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.periodButtonActive,
      ]}
      onPress={() => setSelectedPeriod(period)}>
      <Text
        style={[
          styles.periodButtonText,
          selectedPeriod === period && styles.periodButtonTextActive,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading net worth data...</Text>
      </View>
    );
  }

  const netWorthChange = getNetWorthChange();
  const assetBreakdown = getAssetBreakdown();
  const chartData = getChartData();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Net Worth</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddEntry')}>
          <Text style={styles.addButtonText}>+ Add Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Net Worth Overview Card */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewLabel}>Current Net Worth</Text>
        <Text style={styles.overviewAmount}>
          {formatCurrency(getCurrentNetWorth())}
        </Text>
        {netWorthData.length >= 2 && (
          <View style={styles.changeContainer}>
            <Text
              style={[
                styles.changeText,
                {color: netWorthChange.amount >= 0 ? '#4CAF50' : '#F44336'},
              ]}>
              {netWorthChange.amount >= 0 ? '+' : ''}
              {formatCurrency(netWorthChange.amount)} (
              {netWorthChange.percentage >= 0 ? '+' : ''}
              {netWorthChange.percentage.toFixed(1)}%)
            </Text>
            <Text style={styles.changePeriod}>vs last entry</Text>
          </View>
        )}
      </View>

      {/* Asset/Liability Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Asset Breakdown</Text>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Assets</Text>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(assetBreakdown.totalAssets)}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Liabilities</Text>
            <Text style={[styles.breakdownAmount, {color: '#F44336'}]}>
              -{formatCurrency(assetBreakdown.liabilities)}
            </Text>
          </View>
        </View>
      </View>

      {/* Chart Section */}
      {netWorthData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Net Worth Trend</Text>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <PeriodButton period="1M" label="1M" />
            <PeriodButton period="3M" label="3M" />
            <PeriodButton period="6M" label="6M" />
            <PeriodButton period="1Y" label="1Y" />
            <PeriodButton period="ALL" label="ALL" />
          </View>

          {/* Chart */}
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#2E7D32',
              },
            }}
            bezier
            style={styles.chart}
            formatYLabel={value => `$${Number(value).toLocaleString()}`}
          />
        </View>
      )}

      {/* Recent Entries */}
      {netWorthData.length > 0 && (
        <View style={styles.entriesCard}>
          <View style={styles.entriesHeader}>
            <Text style={styles.entriesTitle}>Recent Entries</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NetWorth')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {netWorthData
            .slice(-3)
            .reverse()
            .map(entry => (
              <View key={entry._id} style={styles.entryItem}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryDate}>
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.entryAmount}>
                    {formatCurrency(entry.netWorth)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    navigation.navigate('EditEntry', {entryId: entry._id || ''})
                  }>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>
      )}

      {/* Empty State */}
      {netWorthData.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💰</Text>
          <Text style={styles.emptyStateTitle}>No Net Worth Data</Text>
          <Text style={styles.emptyStateText}>
            Start tracking your financial progress by adding your first net
            worth entry.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('AddEntry')}>
            <Text style={styles.emptyStateButtonText}>Add First Entry</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#2E7D32',
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
  overviewCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  overviewAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
  changePeriod: {
    fontSize: 12,
    color: '#666',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  breakdownAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2E7D32',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  entriesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryInfo: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  entryAmount: {
    fontSize: 16,
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
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
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
});

export default NetWorthScreen;
