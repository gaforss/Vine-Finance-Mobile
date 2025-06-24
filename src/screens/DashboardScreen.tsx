import React, {useState, useEffect, useCallback} from 'react';
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
import {LineChart, BarChart} from 'react-native-chart-kit';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, NetWorth} from '../types';
import {apiService} from '../services/api';
import {CopilotProvider} from 'react-native-copilot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Tooltip from 'react-native-walkthrough-tooltip';
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

const DashboardScreen: React.FC<Props & {start?: () => void}> = ({
  navigation,
  start,
}) => {
  const [netWorthData, setNetWorthData] = useState<NetWorth[]>([]);
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnnualGrowthTip, setShowAnnualGrowthTip] = useState(false);
  const [showCashPercentTip, setShowCashPercentTip] = useState(false);
  const [chartNetWorth, setChartNetWorth] = useState<number[]>([]);
  const [chartAssets, setChartAssets] = useState<number[]>([]);
  const [chartLiabilities, setChartLiabilities] = useState<number[]>([]);
  const [chartNetWorthSafe, setChartNetWorthSafe] = useState<number[]>([]);
  const [chartAssetsSafe, setChartAssetsSafe] = useState<number[]>([]);
  const [chartLiabilitiesSafe, setChartLiabilitiesSafe] = useState<number[]>(
    [],
  );
  const [chartMonths, setChartMonths] = useState<string[]>([]);

  const screenWidth = Dimensions.get('window').width;

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('DEBUG: Calling apiService.getNetWorthEntries()');
      const response = await apiService.getNetWorthEntries();
      console.log('DEBUG: getNetWorthEntries response:', response);

      if (response && response.success && Array.isArray(response.data)) {
        const entries = response.data
          .slice()
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
        setNetWorthData(entries);

        const sortedEntries = entries
          .slice()
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

        const chartNetWorthArr = sortedEntries.map(entry =>
          getEntryNetWorth(entry),
        );
        const chartAssetsArr = sortedEntries.map(
          entry =>
            (entry.cash || 0) +
            (entry.investments || 0) +
            (entry.realEstate || 0) +
            (entry.retirementAccounts || 0) +
            (entry.vehicles || 0) +
            (entry.personalProperty || 0) +
            (entry.otherAssets || 0),
        );
        const chartLiabilitiesArr = sortedEntries.map(
          entry => entry.liabilities || 0,
        );

        setChartNetWorth(chartNetWorthArr);
        setChartAssets(chartAssetsArr);
        setChartLiabilities(chartLiabilitiesArr);

        const chartMonthsArr = sortedEntries.map(entry => {
          const date = new Date(entry.date);
          return `${date.toLocaleString('default', {month: 'short'})}`;
        });
        setChartMonths(chartMonthsArr);

        setChartNetWorthSafe(sanitize(chartNetWorthArr));
        setChartAssetsSafe(sanitize(chartAssetsArr));
        setChartLiabilitiesSafe(sanitize(chartLiabilitiesArr));
      } else {
        setNetWorthData([]);
        setChartNetWorth([]);
        setChartAssets([]);
        setChartLiabilities([]);
        setChartMonths([]);
        setChartNetWorthSafe([]);
        setChartAssetsSafe([]);
        setChartLiabilitiesSafe([]);
        console.log('DEBUG: No net worth entries found in response.', response);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      console.log('DEBUG: Finished loadDashboardData');
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    (async () => {
      const seenTour = await AsyncStorage.getItem('dashboardTourSeen');
      if (!seenTour && typeof start === 'function') {
        start();
        await AsyncStorage.setItem('dashboardTourSeen', 'true');
      }
    })();
  }, [loadDashboardData, start]);

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
  const getEntryNetWorth = (entry: any) => {
    if (typeof entry.netWorth === 'number') {
      return entry.netWorth;
    }
    const assets =
      (entry.cash || 0) +
      (entry.investments || 0) +
      (entry.realEstate || 0) +
      (entry.retirementAccounts || 0) +
      (entry.vehicles || 0) +
      (entry.personalProperty || 0) +
      (entry.otherAssets || 0) +
      (entry.customFields || [])
        .filter((f: any) => f.type === 'asset')
        .reduce((a: number, b: any) => a + (b.amount || 0), 0);
    const liabilities =
      (entry.liabilities || 0) +
      (entry.customFields || [])
        .filter((f: any) => f.type === 'liability')
        .reduce((a: number, b: any) => a + (b.amount || 0), 0);
    return assets - liabilities;
  };

  // Prepare chart data for Net Worth (yellow line), Assets (dark blue), Liabilities (light blue)
  const sanitize = (arr: number[]): number[] =>
    arr.map((v: number) =>
      typeof v === 'number' && isFinite(v) && !isNaN(v) ? v : 0,
    );

  const isValidChartData = (arr: number[]) =>
    Array.isArray(arr) &&
    arr.length > 0 &&
    arr.every(v => typeof v === 'number' && isFinite(v) && !isNaN(v));

  const safeValue = (v: any) =>
    typeof v === 'number' && isFinite(v) && !isNaN(v) ? v : 0;

  console.log('Chart data validity:', {
    netWorthValid: isValidChartData(chartNetWorth),
    assetsValid: isValidChartData(chartAssets),
    liabilitiesValid: isValidChartData(chartLiabilities),
    netWorth: chartNetWorth,
    assets: chartAssets,
    liabilities: chartLiabilities,
  });

  // Helper to get the latest entry (chronologically, newest)
  const getLatestEntry = () => {
    if (!netWorthData.length) {
      return null;
    }
    return netWorthData[0]; // NEWEST
  };

  // Helper to get the previous entry (second newest)
  const getPreviousEntry = () => {
    if (netWorthData.length < 2) {
      return null;
    }
    return netWorthData[1];
  };

  // Helper to get the entry from 12 months ago (if monthly data)
  const getEntry12MonthsAgo = () => {
    if (netWorthData.length < 13) {
      return null;
    }
    return netWorthData[12]; // 0-based index, 13th entry is 12 months ago
  };

  // Debug: Log net worth data array and sorted order
  console.log('🟡 [DashboardScreen] netWorthData length:', netWorthData.length);
  console.log(
    '🟡 [DashboardScreen] netWorthData dates:',
    netWorthData.map(e => e.date),
  );

  // Use latest entry for all 'current' calculations
  const latestEntry = getLatestEntry();
  const previousEntry = getPreviousEntry();
  const entry12MonthsAgo = getEntry12MonthsAgo();

  // Debug: Log latest, previous, and 12-months-ago entries
  console.log('🟢 [DashboardScreen] latestEntry (newest):', latestEntry);
  console.log(
    '🟢 [DashboardScreen] previousEntry (second newest):',
    previousEntry,
  );
  console.log(
    '🟢 [DashboardScreen] entry12MonthsAgo (13th newest):',
    entry12MonthsAgo,
  );

  // Net Worth Overview
  const currentNetWorth = latestEntry ? getEntryNetWorth(latestEntry) : 0;
  console.log(
    '🟢 [DashboardScreen] currentNetWorth (latestEntry):',
    currentNetWorth,
  );

  // Annual Growth: compare to 12 months ago if possible, else previous
  const annualGrowth = entry12MonthsAgo
    ? ((currentNetWorth - getEntryNetWorth(entry12MonthsAgo)) /
        Math.abs(getEntryNetWorth(entry12MonthsAgo))) *
      100
    : previousEntry && getEntryNetWorth(previousEntry) !== 0
    ? ((currentNetWorth - getEntryNetWorth(previousEntry)) /
        Math.abs(getEntryNetWorth(previousEntry))) *
      100
    : 0;
  console.log('🟢 [DashboardScreen] annualGrowth calculation:', {
    currentNetWorth,
    compareNetWorth: entry12MonthsAgo
      ? getEntryNetWorth(entry12MonthsAgo)
      : previousEntry
      ? getEntryNetWorth(previousEntry)
      : 0,
    annualGrowth,
    used12MonthsAgo: !!entry12MonthsAgo,
    usedPrevious: !entry12MonthsAgo && !!previousEntry,
  });

  // Cash % of Net Worth
  const cashPercent =
    currentNetWorth !== 0 && latestEntry && isFinite(currentNetWorth)
      ? (((latestEntry.cash || 0) / currentNetWorth) * 100).toFixed(2)
      : '0.00';
  console.log('🟡 [DashboardScreen] cashPercent:', cashPercent);

  // Pie chart data (latest entry)
  const pieData = [
    {
      name: 'Cash',
      population: latestEntry ? safeValue(latestEntry.cash) : 0,
      color: '#FF6384',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Investments',
      population: latestEntry ? safeValue(latestEntry.investments) : 0,
      color: '#36A2EB',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Real Estate',
      population: latestEntry ? safeValue(latestEntry.realEstate) : 0,
      color: '#FFCE56',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Retirement',
      population: latestEntry ? safeValue(latestEntry.retirementAccounts) : 0,
      color: '#4BC0C0',
      legendFontColor: '#7F7F7F',
    },
  ];
  console.log('🟡 [DashboardScreen] pieData:', pieData);

  // Asset and liability breakdowns (latest entry)
  const assetBreakdown =
    latestEntry && (latestEntry as any).assets
      ? (latestEntry as any).assets
      : {};
  const liabilityBreakdown =
    latestEntry && (latestEntry as any).liabilities
      ? (latestEntry as any).liabilities
      : {};
  console.log('🟡 [DashboardScreen] assetBreakdown:', assetBreakdown);
  console.log('🟡 [DashboardScreen] liabilityBreakdown:', liabilityBreakdown);

  // Add a helper function for compact currency formatting
  const formatCompactCurrency = (value: string | number) => {
    const num = Number(value);
    if (isNaN(num)) {
      return '$0';
    }
    if (Math.abs(num) >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1_000) {
      return `$${(num / 1_000).toFixed(0)}K`;
    } else {
      return `$${num}`;
    }
  };

  console.log('🟡 [DashboardScreen] netWorthData:', netWorthData);

  if (netWorthData.length === 0) {
    console.log('🟡 [DashboardScreen] No net worth data available.');
  }

  // Debug: Log data for Cash, Equities, and House trend charts
  const last6 = netWorthData.slice(0, 6).reverse();
  last6.forEach((entry, idx) => {
    const date = entry.date;
    console.log(
      `[CashChart] Entry[${idx}] date=${date}, cash=${entry.cash}, entry=`,
      entry,
    );
    // Equities: investments + retirementAccounts + personalProperty + otherAssets + customFields (asset, not cash/real estate)
    const equities =
      (entry.investments || 0) +
      (entry.retirementAccounts || 0) +
      (entry.personalProperty || 0) +
      (entry.otherAssets || 0) +
      (entry.customFields || [])
        .filter(
          f =>
            f.type === 'asset' && f.name !== 'Cash' && f.name !== 'Real Estate',
        )
        .reduce((a, b) => a + (b.amount || 0), 0);
    console.log(
      `[EquitiesChart] Entry[${idx}] date=${date}, equities=${equities}, entry=`,
      entry,
    );
    // House: realEstate + customFields (asset, name includes 'real estate')
    const house =
      (entry.realEstate || 0) +
      (entry.customFields || [])
        .filter(
          f =>
            f.type === 'asset' &&
            f.name &&
            f.name.toLowerCase().includes('real estate'),
        )
        .reduce((a, b) => a + (b.amount || 0), 0);
    console.log(
      `[HouseChart] Entry[${idx}] date=${date}, house=${house}, entry=`,
      entry,
    );
    // Log all custom field names for this entry
    console.log(
      `[HouseChart] Entry[${idx}] customFields:`,
      (entry.customFields || []).map(f => f.name),
    );
  });

  // House Trend chart data with y-axis padding
  const houseDataRaw = last6.map(
    entry =>
      (entry.realEstate || 0) +
      (entry.customFields || [])
        .filter(
          f =>
            f.type === 'asset' &&
            f.name &&
            f.name.toLowerCase().includes('real estate'),
        )
        .reduce((a, b) => a + (b.amount || 0), 0),
  );
  const minHouse = Math.min(...houseDataRaw);
  const maxHouse = Math.max(...houseDataRaw);
  const padHouse = Math.max(10000, Math.round((maxHouse - minHouse) * 0.5));
  const paddedHouseData = [
    minHouse - padHouse,
    ...houseDataRaw,
    maxHouse + padHouse,
  ];

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#181f2a'}}>
      <ScrollView
        style={[styles.container, {backgroundColor: '#181f2a'}]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotTitle}>Financial Snapshot</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEntry')}
            style={{alignSelf: 'center'}}>
            <LinearGradient
              colors={['#2563eb', '#1e40af']}
              style={styles.snapshotButton}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <FontAwesome5 name="plus" size={18} color="#fff" />
              <Text style={styles.snapshotButtonText}>Log Monthly Entry</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View
            style={{marginTop: 16, alignItems: 'flex-start', width: '100%'}}>
            {/* Overlay BarChart and LineChart for multi-series effect */}
            {isValidChartData(chartNetWorthSafe) &&
            isValidChartData(chartAssetsSafe) &&
            isValidChartData(chartLiabilitiesSafe) ? (
              <>
                <BarChart
                  data={{
                    labels: chartMonths,
                    datasets: [
                      {data: chartAssetsSafe, color: () => '#1e3a8a'},
                      {data: chartLiabilitiesSafe, color: () => '#38bdf8'},
                    ],
                  }}
                  width={screenWidth - 80}
                  height={180}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundGradientFrom: '#222b3a',
                    backgroundGradientTo: '#222b3a',
                    decimalPlaces: 0,
                    color: () => '#1e3a8a',
                    labelColor: () => '#b0b8c1',
                    propsForBackgroundLines: {stroke: 'transparent'},
                  }}
                  withInnerLines={false}
                  withCustomBarColorFromData={true}
                  flatColor={true}
                  showBarTops={false}
                  style={{
                    borderRadius: 16,
                    position: 'absolute',
                    backgroundColor: '#222b3a',
                    marginLeft: 0,
                  }}
                  fromZero
                />
                <LineChart
                  data={{
                    labels: chartMonths,
                    datasets: [
                      {
                        data: chartNetWorthSafe,
                        color: () => '#ffd600',
                        strokeWidth: 3,
                      },
                    ],
                  }}
                  width={screenWidth - 80}
                  height={180}
                  yAxisLabel=""
                  chartConfig={{
                    backgroundGradientFrom: '#222b3a',
                    backgroundGradientTo: '#222b3a',
                    decimalPlaces: 0,
                    color: () => '#ffd600',
                    labelColor: () => '#b0b8c1',
                    propsForBackgroundLines: {stroke: 'transparent'},
                    propsForDots: {r: '0'},
                  }}
                  withInnerLines={false}
                  withOuterLines={false}
                  withDots={false}
                  style={{
                    borderRadius: 16,
                    backgroundColor: '#222b3a',
                    marginLeft: 0,
                  }}
                  formatYLabel={formatCompactCurrency}
                  fromZero
                />
              </>
            ) : (
              <Text
                style={{color: 'red', textAlign: 'center', marginVertical: 20}}>
                Chart data is invalid or empty.
              </Text>
            )}
          </View>
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, {backgroundColor: '#ffd600'}]} />
              <Text style={styles.legendText}>Net Worth</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, {backgroundColor: '#1e3a8a'}]} />
              <Text style={styles.legendText}>Assets</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, {backgroundColor: '#38bdf8'}]} />
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
              <Text style={styles.netWorthValue}>
                {formatCurrency(currentNetWorth)}
              </Text>
            </View>
            <View
              style={[
                styles.metricsRow,
                {width: '100%', paddingHorizontal: 20},
              ]}>
              <View style={[styles.metricCard, {flex: 1, marginRight: 8}]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}>
                  <Tooltip
                    isVisible={showAnnualGrowthTip}
                    content={
                      <Text>
                        Annual Growth measures how much your net worth has
                        increased over the past year. A good benchmark is 5-10%.
                      </Text>
                    }
                    placement="top"
                    onClose={() => setShowAnnualGrowthTip(false)}
                    backgroundColor="rgba(0,0,0,0.7)">
                    <TouchableOpacity
                      onPress={() => setShowAnnualGrowthTip(true)}>
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color="#23aaff"
                        style={{marginRight: 4}}
                      />
                    </TouchableOpacity>
                  </Tooltip>
                  <Text style={styles.metricLabel}>Annual Growth</Text>
                </View>
                <Text
                  style={[
                    styles.metricValue,
                    {color: getGrowthColor(annualGrowth), marginBottom: 2},
                  ]}>
                  {formatPercentage(annualGrowth)}
                </Text>
                <Text style={styles.metricSubtext}>Year over year</Text>
              </View>
              <View style={[styles.metricCard, {flex: 1, marginLeft: 8}]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}>
                  <Tooltip
                    isVisible={showCashPercentTip}
                    content={
                      <Text>
                        Cash % / Net Worth shows the percentage of your net
                        worth that is held in cash. A benchmark of 5-20% is
                        healthy.
                      </Text>
                    }
                    placement="top"
                    onClose={() => setShowCashPercentTip(false)}
                    backgroundColor="rgba(0,0,0,0.7)">
                    <TouchableOpacity
                      onPress={() => setShowCashPercentTip(true)}>
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color="#23aaff"
                        style={{marginRight: 4}}
                      />
                    </TouchableOpacity>
                  </Tooltip>
                  <Text style={styles.metricLabel}>Cash % / Net Worth</Text>
                </View>
                <Text
                  style={[
                    styles.metricValue,
                    {color: '#23aaff', marginBottom: 2},
                  ]}>
                  {cashPercent}%
                </Text>
                <Text style={styles.metricSubtext}>Cash as % of Net Worth</Text>
              </View>
            </View>
            {/* Asset Trends - Separate Charts */}
            <View>
              <View style={[styles.card, {backgroundColor: '#222b3a'}]}>
                <Text style={styles.cardTitle}>Cash Trend</Text>
                <View
                  style={{
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 8,
                  }}>
                  <LineChart
                    data={{
                      labels: last6.map(entry => {
                        const date = new Date(entry.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }),
                      datasets: [
                        {
                          data: last6.map((entry, idx) => {
                            const value = entry.cash || 0;
                            console.log(
                              `[CashChart] ChartData[${idx}] date=${entry.date}, value=${value}`,
                            );
                            return value;
                          }),
                          color: (opacity = 1) =>
                            `rgba(35, 170, 255, ${opacity})`,
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
                      labelColor: (opacity = 1) =>
                        `rgba(255, 255, 255, ${opacity})`,
                      style: {borderRadius: 16, backgroundColor: '#222b3a'},
                      propsForDots: {r: '4', strokeWidth: '2', stroke: '#fff'},
                    }}
                    bezier
                    style={{borderRadius: 12, backgroundColor: '#222b3a'}}
                    formatYLabel={formatCompactCurrency}
                    withDots={false}
                    withHorizontalLines={false}
                    withVerticalLines={false}
                  />
                </View>
              </View>
              <View style={[styles.card, {backgroundColor: '#222b3a'}]}>
                <Text style={styles.cardTitle}>Equities Trend</Text>
                <View
                  style={{
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 8,
                  }}>
                  <LineChart
                    data={{
                      labels: last6.map(entry => {
                        const date = new Date(entry.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }),
                      datasets: [
                        {
                          data: last6.map((entry, idx) => {
                            const value =
                              (entry.investments || 0) +
                              (entry.retirementAccounts || 0) +
                              (entry.personalProperty || 0) +
                              (entry.otherAssets || 0) +
                              (entry.customFields || [])
                                .filter(
                                  f =>
                                    f.type === 'asset' &&
                                    f.name !== 'Cash' &&
                                    f.name !== 'Real Estate',
                                )
                                .reduce((a, b) => a + (b.amount || 0), 0);
                            console.log(
                              `[EquitiesChart] ChartData[${idx}] date=${entry.date}, value=${value}`,
                            );
                            return value;
                          }),
                          color: (opacity = 1) =>
                            `rgba(54, 162, 235, ${opacity})`,
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
                      labelColor: (opacity = 1) =>
                        `rgba(255, 255, 255, ${opacity})`,
                      style: {borderRadius: 16, backgroundColor: '#222b3a'},
                      propsForDots: {r: '4', strokeWidth: '2', stroke: '#fff'},
                    }}
                    bezier
                    style={{borderRadius: 12, backgroundColor: '#222b3a'}}
                    formatYLabel={formatCompactCurrency}
                    withDots={false}
                    withHorizontalLines={false}
                    withVerticalLines={false}
                  />
                </View>
              </View>
              <View style={[styles.card, {backgroundColor: '#222b3a'}]}>
                <Text style={styles.cardTitle}>House Trend</Text>
                <View
                  style={{
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 8,
                  }}>
                  <LineChart
                    data={{
                      labels: last6.map(entry => {
                        const date = new Date(entry.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }),
                      datasets: [
                        {
                          data: paddedHouseData,
                          color: (opacity = 1) =>
                            `rgba(255, 99, 132, ${opacity})`,
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
                      labelColor: (opacity = 1) =>
                        `rgba(255, 255, 255, ${opacity})`,
                      style: {borderRadius: 16, backgroundColor: '#222b3a'},
                      propsForDots: {r: '4', strokeWidth: '2', stroke: '#fff'},
                    }}
                    bezier
                    style={{borderRadius: 12, backgroundColor: '#222b3a'}}
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
    textAlign: 'center',
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
    shadowOffset: {width: 0, height: 4},
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
    shadowOffset: {width: 0, height: 2},
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

const DashboardScreenWithProvider: React.FC<Props> = props => (
  <CopilotProvider>
    <DashboardScreen {...props} />
  </CopilotProvider>
);

export default DashboardScreenWithProvider;
