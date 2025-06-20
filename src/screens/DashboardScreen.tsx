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
import {LineChart, PieChart} from 'react-native-chart-kit';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, NetWorth} from '../types';
import { apiService } from '../services/api';
console.log('DASHBOARD IMPORTED apiService:', apiService);

type DashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({navigation}) => {
  const [netWorthData, setNetWorthData] = useState<NetWorth[]>([]);
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentNetWorth, setCurrentNetWorth] = useState(0);
  const [_previousNetWorth, setPreviousNetWorth] = useState(0);
  const [annualGrowth, setAnnualGrowth] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [assetBreakdown, setAssetBreakdown] = useState({});
  const [liabilityBreakdown, setLiabilityBreakdown] = useState({});

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('DEBUG: Calling apiService.getNetWorthEntries()');
      const response = await apiService.getNetWorthEntries();
      console.log('DEBUG: getNetWorthEntries response:', response);

      // Handle both array and object response
      let entries: any[] = [];
      if (Array.isArray(response) && response.length > 0) {
        entries = response;
        setNetWorthData(entries);
        console.log('DEBUG: Set netWorthData (array):', entries);
      } else if (response && response.data && Array.isArray(response.data)) {
        entries = response.data;
        setNetWorthData(entries);
        console.log('DEBUG: Set netWorthData (object.data):', entries);
      } else {
        console.log('DEBUG: No net worth data found in response.', response);
      }

      if (entries.length > 0) {
        const latest = entries[entries.length - 1];
        const previous = entries.length > 1 ? entries[entries.length - 2] : null;

        // Log the latest entry for debugging
        console.log('DEBUG: Latest entry:', latest);
        if (latest) {
          console.log('DEBUG: Latest entry fields:', JSON.stringify({
            cash: latest.cash,
            investments: latest.investments,
            realEstate: latest.realEstate,
            retirementAccounts: latest.retirementAccounts,
            vehicles: latest.vehicles,
            personalProperty: latest.personalProperty,
            otherAssets: latest.otherAssets,
            liabilities: latest.liabilities,
            customFields: latest.customFields,
            accounts: latest.accounts,
            netWorth: latest.netWorth,
          }, null, 2));
        }

        // Calculate net worth from entry fields
        const calcNetWorth = (entry: any) => {
          if (!entry) return 0;
          const assets = (entry.cash || 0) + (entry.investments || 0) + (entry.realEstate || 0) +
            (entry.retirementAccounts || 0) + (entry.vehicles || 0) + (entry.personalProperty || 0) +
            (entry.otherAssets || 0);
          const liabilities = entry.liabilities || 0;
          return assets - liabilities;
        };

        const latestNetWorth = calcNetWorth(latest);
        const previousNetWorth = calcNetWorth(previous);

        setCurrentNetWorth(latestNetWorth);
        setPreviousNetWorth(previousNetWorth);
        setAnnualGrowth(
          previousNetWorth !== 0
            ? parseFloat((((latestNetWorth - previousNetWorth) / previousNetWorth) * 100).toFixed(2))
            : 0
        );
        setAssetBreakdown(latest.assets || {});
        setLiabilityBreakdown(latest.liabilities || {});
        console.log('DEBUG: Calculated currentNetWorth:', latestNetWorth, 'previousNetWorth:', previousNetWorth);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      console.log('DEBUG: Finished loadDashboardData');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
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
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? '#28a745' : '#dc3545';
  };

  const chartData = {
    labels: netWorthData.slice(-6).map(entry => {
      const date = new Date(entry.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: netWorthData.slice(-6).map(entry => {
          const netWorth =
            entry.cash +
            entry.investments +
            entry.realEstate +
            entry.retirementAccounts +
            entry.vehicles +
            entry.personalProperty +
            entry.otherAssets -
            entry.liabilities;
          return netWorth;
        }),
      },
    ],
  };

  const pieData = [
    {
      name: 'Cash',
      population:
        netWorthData.length > 0
          ? netWorthData[netWorthData.length - 1].cash
          : 0,
      color: '#FF6384',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Investments',
      population:
        netWorthData.length > 0
          ? netWorthData[netWorthData.length - 1].investments
          : 0,
      color: '#36A2EB',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Real Estate',
      population:
        netWorthData.length > 0
          ? netWorthData[netWorthData.length - 1].realEstate
          : 0,
      color: '#FFCE56',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Retirement',
      population:
        netWorthData.length > 0
          ? netWorthData[netWorthData.length - 1].retirementAccounts
          : 0,
      color: '#4BC0C0',
      legendFontColor: '#7F7F7F',
    },
  ];

  const chartConfig = {
    backgroundColor: '#222b3a',
    backgroundGradientFrom: '#222b3a',
    backgroundGradientTo: '#222b3a',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 112, 186, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
      backgroundColor: '#222b3a',
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#0070ba',
    },
    fillShadowGradient: '#222b3a',
    fillShadowGradientOpacity: 1,
  };

  // Calculate Cash % of Net Worth
  const cashPercent = currentNetWorth !== 0 && netWorthData.length > 0
    ? ((netWorthData[netWorthData.length - 1].cash || 0) / currentNetWorth * 100).toFixed(2)
    : '0.00';

  // Add a helper function for compact currency formatting
  const formatCompactCurrency = (value: string | number) => {
    const num = Number(value);
    if (Math.abs(num) >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1_000) {
      return `$${(num / 1_000).toFixed(0)}K`;
    } else {
      return `$${num}`;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Snapshot</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddEntry')}>
          <Text style={styles.addButtonText}>Log Entry</Text>
        </TouchableOpacity>
      </View>

      {netWorthData.length === 0 ? (
        <View style={{padding: 20, alignItems: 'center'}}>
          <Text style={{color: '#888', fontSize: 16, marginTop: 40}}>
            No entries found. Add your first net worth entry to get started!
          </Text>
        </View>
      ) : (
        <>
          {/* Net Worth Overview Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Net Worth Overview</Text>
            <Text style={styles.netWorthValue}>${currentNetWorth.toLocaleString()}</Text>
          </View>

          {/* Net Worth Chart Section - move directly below overview and fit nicely */}
          <View style={[styles.card, { paddingVertical: 16, alignItems: 'center', backgroundColor: '#222b3a' }]}> 
            <View style={{ width: '100%', alignItems: 'center' }}>
              <LineChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 12, backgroundColor: '#222b3a' }}
                formatYLabel={formatCompactCurrency}
              />
            </View>
          </View>

          {/* Key Metrics Row */}
          <View style={[styles.metricsRow, {width: '100%', paddingHorizontal: 20}]}>
            <View style={[styles.metricCard, {flex: 1, marginRight: 8}]}>
              <Text style={styles.metricLabel}>Annual Growth</Text>
              <Text
                style={[styles.metricValue, {color: getGrowthColor(annualGrowth)}]}>
                {formatPercentage(annualGrowth)}
              </Text>
              <Text style={styles.metricSubtext}>Year over year</Text>
            </View>
            <View style={[styles.metricCard, {flex: 1, marginLeft: 8}]}>  
              <Text style={styles.metricLabel}>Cash % / Net Worth</Text>
              <Text style={[styles.metricValue, {color: '#23aaff'}]}>
                {cashPercent}%
              </Text>
              <Text style={styles.metricSubtext}>Cash as % of Net Worth</Text>
            </View>
          </View>

          {/* Asset Trends - Separate Charts */}
          {netWorthData.length > 0 && (
            <>
              <View style={[styles.card, {backgroundColor: '#222b3a'}]}>
                <Text style={styles.cardTitle}>Cash Trend</Text>
                <View style={{ width: '100%', alignItems: 'center', paddingVertical: 8 }}>
                  <LineChart
                    data={{
                      labels: netWorthData.slice(-6).map(entry => {
                        const date = new Date(entry.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }),
                      datasets: [
                        {
                          data: netWorthData.slice(-6).map(entry => entry.cash || 0),
                          color: (opacity = 1) => `rgba(35, 170, 255, ${opacity})`,
                          strokeWidth: 2,
                        },
                      ],
                    }}
                    width={screenWidth - 40}
                    height={180}
                    chartConfig={{
                      backgroundColor: '#222b3a',
                      backgroundGradientFrom: '#222b3a',
                      backgroundGradientTo: '#222b3a',
                      fillShadowGradient: '#222b3a',
                      fillShadowGradientOpacity: 1,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(35, 170, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      style: { borderRadius: 16, backgroundColor: '#222b3a' },
                      propsForDots: { r: '4', strokeWidth: '2', stroke: '#fff' },
                    }}
                    bezier
                    style={{ borderRadius: 12, backgroundColor: '#222b3a' }}
                    formatYLabel={formatCompactCurrency}
                    withDots={false}
                    withHorizontalLines={false}
                    withVerticalLines={false}
                  />
                </View>
              </View>
              <View style={[styles.card, {backgroundColor: '#222b3a'}]}>
                <Text style={styles.cardTitle}>Equities Trend</Text>
                <View style={{ width: '100%', alignItems: 'center', paddingVertical: 8 }}>
                  <LineChart
                    data={{
                      labels: netWorthData.slice(-6).map(entry => {
                        const date = new Date(entry.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }),
                      datasets: [
                        {
                          data: netWorthData.slice(-6).map(entry => entry.investments || 0),
                          color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
                          strokeWidth: 2,
                        },
                      ],
                    }}
                    width={screenWidth - 40}
                    height={180}
                    chartConfig={{
                      backgroundColor: '#222b3a',
                      backgroundGradientFrom: '#222b3a',
                      backgroundGradientTo: '#222b3a',
                      fillShadowGradient: '#222b3a',
                      fillShadowGradientOpacity: 1,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      style: { borderRadius: 16, backgroundColor: '#222b3a' },
                      propsForDots: { r: '4', strokeWidth: '2', stroke: '#fff' },
                    }}
                    bezier
                    style={{ borderRadius: 12, backgroundColor: '#222b3a' }}
                    formatYLabel={formatCompactCurrency}
                    withDots={false}
                    withHorizontalLines={false}
                    withVerticalLines={false}
                  />
                </View>
              </View>
              <View style={[styles.card, {backgroundColor: '#222b3a'}]}>
                <Text style={styles.cardTitle}>House Trend</Text>
                <View style={{ width: '100%', alignItems: 'center', paddingVertical: 8 }}>
                  <LineChart
                    data={{
                      labels: netWorthData.slice(-6).map(entry => {
                        const date = new Date(entry.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }),
                      datasets: [
                        {
                          data: netWorthData.slice(-6).map(entry => entry.realEstate || 0),
                          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                          strokeWidth: 2,
                        },
                      ],
                    }}
                    width={screenWidth - 40}
                    height={180}
                    chartConfig={{
                      backgroundColor: '#222b3a',
                      backgroundGradientFrom: '#222b3a',
                      backgroundGradientTo: '#222b3a',
                      fillShadowGradient: '#222b3a',
                      fillShadowGradientOpacity: 1,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      style: { borderRadius: 16, backgroundColor: '#222b3a' },
                      propsForDots: { r: '4', strokeWidth: '2', stroke: '#fff' },
                    }}
                    bezier
                    style={{ borderRadius: 12, backgroundColor: '#222b3a' }}
                    formatYLabel={formatCompactCurrency}
                    withDots={false}
                    withHorizontalLines={false}
                    withVerticalLines={false}
                  />
                </View>
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181f2a',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#181f2a',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e6eaf0',
  },
  addButton: {
    backgroundColor: '#23aaff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#222b3a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e6eaf0',
    marginBottom: 12,
  },
  netWorthValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#23aaff',
    marginBottom: 8,
  },
  growthLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffe066',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#222b3a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#b0b8c1',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e6eaf0',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#7a8599',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#23aaff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default DashboardScreen;
