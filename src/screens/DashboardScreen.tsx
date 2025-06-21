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
  SafeAreaView,
} from 'react-native';
import {LineChart, PieChart, BarChart} from 'react-native-chart-kit';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, NetWorth} from '../types';
import { apiService } from '../services/api';
import { CopilotProvider, CopilotStep, walkthroughable, useCopilot } from 'react-native-copilot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Tooltip from 'react-native-walkthrough-tooltip';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
console.log('DASHBOARD IMPORTED apiService:', apiService);

type DashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const WalkthroughableView = walkthroughable(View);

const DashboardScreen: React.FC<Props & { start?: () => void }> = ({navigation, start}) => {
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
  const [showAnnualGrowthTip, setShowAnnualGrowthTip] = useState(false);
  const [showNetWorthTip, setShowNetWorthTip] = useState(false);
  const [showCashPercentTip, setShowCashPercentTip] = useState(false);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadDashboardData();
    (async () => {
      const seenTour = await AsyncStorage.getItem('dashboardTourSeen');
      if (!seenTour && typeof start === 'function') {
        start();
        await AsyncStorage.setItem('dashboardTourSeen', 'true');
      }
    })();
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
        entries = response.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNetWorthData(entries);
        console.log('DEBUG: Set netWorthData (array, sorted):', entries);
      } else if (response && response.data && Array.isArray(response.data)) {
        entries = response.data.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNetWorthData(entries);
        console.log('DEBUG: Set netWorthData (object.data, sorted):', entries);
      } else {
        console.log('DEBUG: No net worth data found in response.', response);
      }

      if (entries.length > 0) {
        const latest = entries[0];
        const previous = entries.length > 1 ? entries[1] : null;

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

  // Helper to get net worth from entry, using backend field if present
  const getEntryNetWorth = (entry: any) =>
    typeof entry.netWorth === 'number'
      ? entry.netWorth
      : (entry.cash || 0) +
        (entry.investments || 0) +
        (entry.realEstate || 0) +
        (entry.retirementAccounts || 0) +
        (entry.vehicles || 0) +
        (entry.personalProperty || 0) +
        (entry.otherAssets || 0) -
        (entry.liabilities || 0);

  // Prepare chart data for Net Worth (yellow line), Assets (dark blue), Liabilities (light blue)
  const chartMonths = netWorthData.slice(-12).map(entry => {
    const date = new Date(entry.date);
    return date.toLocaleString('default', { month: 'short' });
  });
  const chartNetWorth = netWorthData.slice(-12).map(getEntryNetWorth);
  const chartAssets = netWorthData.slice(-12).map(entry => {
    return (
      (entry.cash || 0) +
      (entry.investments || 0) +
      (entry.realEstate || 0) +
      (entry.retirementAccounts || 0) +
      (entry.vehicles || 0) +
      (entry.personalProperty || 0) +
      (entry.otherAssets || 0)
    );
  });
  const chartLiabilities = netWorthData.slice(-12).map(entry => entry.liabilities || 0);

  const sanitize = (arr: number[]): number[] =>
    arr.map((v: number) => (typeof v === 'number' && isFinite(v) && !isNaN(v) ? v : 0));

  const chartNetWorthSafe = sanitize(chartNetWorth);
  const chartAssetsSafe = sanitize(chartAssets);
  const chartLiabilitiesSafe = sanitize(chartLiabilities);

  // After sanitizing chart data:
  const N = Math.min(chartMonths.length, chartNetWorthSafe.length, chartAssetsSafe.length, chartLiabilitiesSafe.length);
  const months = chartMonths.slice(0, N);
  const netWorth = chartNetWorthSafe.slice(0, N);
  const assets = chartAssetsSafe.slice(0, N);
  const liabilities = chartLiabilitiesSafe.slice(0, N);

  console.log('Chart data:', { months, netWorth, assets, liabilities });

  const multiChartData = {
    labels: months,
    datasets: [
      {
        data: netWorth,
        color: (opacity = 1) => `#ffd600`, // Yellow line
        strokeWidth: 3,
      },
      {
        data: assets,
        color: (opacity = 1) => `#1a2a4e`, // Dark blue
        strokeWidth: 2,
      },
      {
        data: liabilities,
        color: (opacity = 1) => `#23aaff`, // Light blue
        strokeWidth: 2,
      },
    ],
  };

  const pieData = [
    {
      name: 'Cash',
      population:
        netWorthData.length > 0
          ? netWorthData[0].cash
          : 0,
      color: '#FF6384',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Investments',
      population:
        netWorthData.length > 0
          ? netWorthData[0].investments
          : 0,
      color: '#36A2EB',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Real Estate',
      population:
        netWorthData.length > 0
          ? netWorthData[0].realEstate
          : 0,
      color: '#FFCE56',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Retirement',
      population:
        netWorthData.length > 0
          ? netWorthData[0].retirementAccounts
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
  const cashPercent =
    currentNetWorth !== 0 && netWorthData.length > 0 && isFinite(currentNetWorth)
      ? ((netWorthData[0].cash || 0) / currentNetWorth * 100).toFixed(2)
      : '0.00';

  // Add a helper function for compact currency formatting
  const formatCompactCurrency = (value: string | number) => {
    const num = Number(value);
    if (isNaN(num)) return '$0';
    if (Math.abs(num) >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1_000) {
      return `$${(num / 1_000).toFixed(0)}K`;
    } else {
      return `$${num}`;
    }
  };

  const safeAnnualGrowth =
    _previousNetWorth !== 0 && isFinite(_previousNetWorth)
      ? parseFloat((((currentNetWorth - _previousNetWorth) / _previousNetWorth) * 100).toFixed(2))
      : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotTitle}>Financial Snapshot</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddEntry')} style={{alignSelf: 'center'}}>
            <LinearGradient
              colors={['#2563eb', '#1e40af']}
              style={styles.snapshotButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome5 name="plus" size={18} color="#fff" />
              <Text style={styles.snapshotButtonText}>Log Monthly Entry</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ marginTop: 16 }}>
            {/* Overlay BarChart and LineChart for multi-series effect */}
            <BarChart
              data={{
                labels: months,
                datasets: [
                  { data: assets, color: () => '#1e3a8a' },
                  { data: liabilities, color: () => '#38bdf8' },
                ],
              }}
              width={screenWidth - 64}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundGradientFrom: '#222b3a',
                backgroundGradientTo: '#222b3a',
                decimalPlaces: 0,
                color: () => '#1e3a8a',
                labelColor: () => '#b0b8c1',
                propsForBackgroundLines: { stroke: 'transparent' },
              }}
              withInnerLines={false}
              withCustomBarColorFromData={true}
              flatColor={true}
              showBarTops={false}
              style={{ borderRadius: 16, position: 'absolute', backgroundColor: '#222b3a' }}
              fromZero
            />
            <LineChart
              data={{
                labels: months,
                datasets: [
                  { data: netWorth, color: () => '#ffd600', strokeWidth: 3 },
                ],
              }}
              width={screenWidth - 64}
              height={180}
              yAxisLabel=""
              chartConfig={{
                backgroundGradientFrom: '#222b3a',
                backgroundGradientTo: '#222b3a',
                decimalPlaces: 0,
                color: () => '#ffd600',
                labelColor: () => '#b0b8c1',
                propsForBackgroundLines: { stroke: 'transparent' },
                propsForDots: { r: '0' },
              }}
              withInnerLines={false}
              withOuterLines={false}
              withDots={false}
              bezier
              style={{ borderRadius: 16, backgroundColor: '#222b3a' }}
              formatYLabel={formatCompactCurrency}
              fromZero
            />
          </View>
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#ffd600' }]} />
              <Text style={styles.legendText}>Net Worth</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#1e3a8a' }]} />
              <Text style={styles.legendText}>Assets</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#38bdf8' }]} />
              <Text style={styles.legendText}>Liabilities</Text>
            </View>
          </View>
        </View>
        {netWorthData.length === 0 ? (
          <View style={{padding: 20, alignItems: 'center'}}>
            <Text style={{color: '#888', fontSize: 16, marginTop: 40}}>
              No entries found. Add your first net worth entry to get started!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Net Worth Overview</Text>
              <Text style={styles.netWorthValue}>{formatCurrency(currentNetWorth)}</Text>
            </View>
            <View style={[styles.metricsRow, {width: '100%', paddingHorizontal: 20}]}> 
              <View style={[styles.metricCard, {flex: 1, marginRight: 8}]}> 
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 2}}>
                  <Tooltip
                    isVisible={showAnnualGrowthTip}
                    content={<Text>Annual Growth measures how much your net worth has increased over the past year. A good benchmark is 5-10%.</Text>}
                    placement="top"
                    onClose={() => setShowAnnualGrowthTip(false)}
                    backgroundColor="rgba(0,0,0,0.7)"
                  >
                    <TouchableOpacity onPress={() => setShowAnnualGrowthTip(true)}>
                      <Ionicons name="information-circle-outline" size={18} color="#23aaff" style={{ marginRight: 4 }} />
                    </TouchableOpacity>
                  </Tooltip>
                  <Text style={styles.metricLabel}>Annual Growth</Text>
                </View>
                <Text style={[styles.metricValue, {color: getGrowthColor(safeAnnualGrowth), marginBottom: 2}]}> 
                  {formatPercentage(safeAnnualGrowth)}
                </Text>
                <Text style={styles.metricSubtext}>Year over year</Text>
              </View>
              <View style={[styles.metricCard, {flex: 1, marginLeft: 8}]}>  
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 2}}>
                  <Tooltip
                    isVisible={showCashPercentTip}
                    content={<Text>Cash % / Net Worth shows the percentage of your net worth that is held in cash. A benchmark of 5-20% is healthy.</Text>}
                    placement="top"
                    onClose={() => setShowCashPercentTip(false)}
                    backgroundColor="rgba(0,0,0,0.7)"
                  >
                    <TouchableOpacity onPress={() => setShowCashPercentTip(true)}>
                      <Ionicons name="information-circle-outline" size={18} color="#23aaff" style={{ marginRight: 4 }} />
                    </TouchableOpacity>
                  </Tooltip>
                  <Text style={styles.metricLabel}>Cash % / Net Worth</Text>
                </View>
                <Text style={[styles.metricValue, {color: '#23aaff', marginBottom: 2}]}> 
                  {cashPercent}%
                </Text>
                <Text style={styles.metricSubtext}>Cash as % of Net Worth</Text>
              </View>
            </View>
            {/* Asset Trends - Separate Charts */}
            <View>
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
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  snapshotCard: {
    backgroundColor: '#222b3a',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  snapshotTitle: {
    color: '#c7d0e0',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  snapshotButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 8,
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  snapshotButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
    marginLeft: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    color: '#b0b8c1',
    fontSize: 15,
    fontWeight: '500',
  },
});

const DashboardScreenWithProvider: React.FC<Props> = (props) => (
  <CopilotProvider>
    <DashboardScreen {...props} />
  </CopilotProvider>
);

export default DashboardScreenWithProvider;
