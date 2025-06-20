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
  FlatList,
} from 'react-native';
import {LineChart, BarChart} from 'react-native-chart-kit';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, RealEstate} from '../types';
import { apiService } from '../services/api';

type RealEstateScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RealEstate'
>;

interface Props {
  navigation: RealEstateScreenNavigationProp;
}

const RealEstateScreen: React.FC<Props> = ({navigation}) => {
  const [properties, setProperties] = useState<RealEstate[]>([]);
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalEquity, setTotalEquity] = useState(0);
  const [totalRentIncome, setTotalRentIncome] = useState(0);
  const [_unpaidRent, _setUnpaidRent] = useState(0);
  const [_overdueRent, _setOverdueRent] = useState(0);
  const [totalNOI, setTotalNOI] = useState(0);
  const [averageCapRate, setAverageCapRate] = useState(0);
  const [averageCoCReturn, setAverageCoCReturn] = useState(0);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadRealEstateData();
  }, []);

  const loadRealEstateData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRealEstateProperties();

      if (response.success && response.data) {
        setProperties(response.data);

        // Calculate portfolio metrics
        let equity = 0;
        let rentIncome = 0;
        let noi = 0;
        let totalValue = 0;
        let totalInvestment = 0;

        response.data.forEach(property => {
          equity += property.value - property.mortgageBalance;
          // Calculate rent from rentCollected
          const totalRent = Object.values(property.rentCollected || {}).reduce(
            (sum, rent) => {
              return sum + (rent.collected ? rent.amount : 0);
            },
            0,
          );
          rentIncome += totalRent;

          // Calculate expenses
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
        setTotalRentIncome(rentIncome);
        setTotalNOI(noi);

        // Calculate average cap rate
        if (totalValue > 0) {
          setAverageCapRate((noi / totalValue) * 100);
        }

        // Calculate average cash-on-cash return
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRealEstateData();
    setRefreshing(false);
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
    // Calculate rent and expenses for this property
    const totalRent = Object.values(item.rentCollected || {}).reduce(
      (sum, rent) => {
        return sum + (rent.collected ? rent.amount : 0);
      },
      0,
    );
    const totalExpenses =
      item.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const capRate =
      item.value > 0 ? ((totalRent - totalExpenses) / item.value) * 100 : 0;

    return (
      <View style={styles.propertyCard}>
        <View style={styles.propertyHeader}>
          <Text style={styles.propertyName}>{item.propertyType}</Text>
          <Text style={styles.propertyAddress}>{item.propertyAddress}</Text>
        </View>

        <View style={styles.propertyMetrics}>
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Current Value</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(item.value)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Annual Rent</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(totalRent)}
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Equity</Text>
              <Text style={[styles.metricValue, {color: '#28a745'}]}>
                {formatCurrency(item.value - item.mortgageBalance)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Cap Rate</Text>
              <Text style={styles.metricValue}>
                {formatPercentage(capRate)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.propertyActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const chartData = {
    labels: properties
      .slice(0, 5)
      .map(property => property.propertyType.substring(0, 8)),
    datasets: [
      {
        data: properties.slice(0, 5).map(property => property.value),
      },
    ],
  };

  const cashFlowData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [
          totalRentIncome / 6,
          totalRentIncome / 6,
          totalRentIncome / 6,
          totalRentIncome / 6,
          totalRentIncome / 6,
          totalRentIncome / 6,
        ],
      },
    ],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Real Estate Portfolio</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Add Property feature will be available soon!',
            )
          }>
          <Text style={styles.addButtonText}>+ Add Property</Text>
        </TouchableOpacity>
      </View>

      {/* Portfolio Overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Portfolio Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Equity</Text>
            <Text style={styles.overviewValue}>
              {formatCurrency(totalEquity)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Annual Rent</Text>
            <Text style={styles.overviewValue}>
              {formatCurrency(totalRentIncome)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Properties</Text>
            <Text style={styles.overviewValue}>{properties.length}</Text>
          </View>
        </View>
      </View>

      {/* Financial Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Financial Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardLabel}>Total NOI</Text>
            <Text style={styles.metricCardValue}>
              {formatCurrency(totalNOI)}
            </Text>
            <Text style={styles.metricCardSubtext}>Net Operating Income</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardLabel}>Avg Cap Rate</Text>
            <Text style={styles.metricCardValue}>
              {formatPercentage(averageCapRate)}
            </Text>
            <Text style={styles.metricCardSubtext}>Capitalization Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardLabel}>Avg CoC Return</Text>
            <Text style={styles.metricCardValue}>
              {formatPercentage(averageCoCReturn)}
            </Text>
            <Text style={styles.metricCardSubtext}>Cash on Cash Return</Text>
          </View>
        </View>
      </View>

      {/* Property Values Chart */}
      {properties.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Property Values</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#1e1e1e',
              backgroundGradientFrom: '#1e1e1e',
              backgroundGradientTo: '#1e1e1e',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 112, 186, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </View>
      )}

      {/* Cash Flow Chart */}
      {properties.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Cash Flow</Text>
          <LineChart
            data={cashFlowData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#1e1e1e',
              backgroundGradientFrom: '#1e1e1e',
              backgroundGradientTo: '#1e1e1e',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(40, 167, 69, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#28a745',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Properties List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          My Properties ({properties.length})
        </Text>
        {properties.length > 0 ? (
          <FlatList
            data={properties}
            renderItem={renderPropertyCard}
            keyExtractor={(item, index) => item._id || `property-${index}`}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No properties added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first property to start tracking your real estate
              portfolio
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() =>
              Alert.alert(
                'Coming Soon',
                'Property analysis tools will be available soon!',
              )
            }>
            <Text style={styles.quickActionButtonText}>Property Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() =>
              Alert.alert(
                'Coming Soon',
                'Document management will be available soon!',
              )
            }>
            <Text style={styles.quickActionButtonText}>Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() =>
              Alert.alert(
                'Coming Soon',
                'Market insights will be available soon!',
              )
            }>
            <Text style={styles.quickActionButtonText}>Market Insights</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#0070ba',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#2d2d2d',
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
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  propertyHeader: {
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
  propertyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#0070ba',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    backgroundColor: '#0070ba',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickActionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default RealEstateScreen;
