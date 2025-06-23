import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, ActivityIndicator, Alert, TouchableOpacity, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { VictoryChart, VictoryAxis, VictoryArea, VictoryLegend, VictoryLabel, VictoryLine } from 'victory-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { apiService } from '../services/api';
import storageService from '../services/storage';
import { RetirementGoals, RetirementProjectionsResult, NetWorthComparisonResult } from '../types';
import RetirementGoalsModal, { RetirementGoalsForm } from '../components/RetirementGoalsModal';

const CATEGORY_FIELDS = [
  { key: 'mortgage', label: 'Mortgages', icon: '🏠' },
  { key: 'cars', label: 'Cars', icon: '🚗' },
  { key: 'healthCare', label: 'Health Care', icon: '💙' },
  { key: 'foodAndDrinks', label: 'Food & Drinks', icon: '🍽️' },
  { key: 'travelAndEntertainment', label: 'Entertainment', icon: '🎭' },
  { key: 'reinvestedFunds', label: 'Reinvested', icon: '📈' },
];

const TEMPLATES = {
  conservative: { mortgage: 25, cars: 5, healthCare: 15, foodAndDrinks: 12, travelAndEntertainment: 18, reinvestedFunds: 25 },
  moderate:     { mortgage: 22, cars: 3, healthCare: 12, foodAndDrinks: 10, travelAndEntertainment: 28, reinvestedFunds: 25 },
  aggressive:   { mortgage: 20, cars: 2, healthCare: 10, foodAndDrinks: 8,  travelAndEntertainment: 35, reinvestedFunds: 25 },
};

const RetirementScreen: React.FC = () => {
  const [goals, setGoals] = useState<RetirementGoals | null>(null);
  const [form, setForm] = useState<Partial<RetirementGoals>>({});
  const [projections, setProjections] = useState<RetirementProjectionsResult | null>(null);
  const [comparison, setComparison] = useState<NetWorthComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80;

  // Fetch all data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await storageService.getItem('userId');
      console.log('RetirementScreen userId:', userId);
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      const [goalsRes, projRes, compRes] = await Promise.all([
        apiService.getRetirementGoals(userId),
        apiService.getRetirementProjections(userId),
        apiService.getNetWorthComparison(userId),
      ]);
      console.log('RetirementScreen fetchAll - goalsRes:', goalsRes);
      console.log('RetirementScreen fetchAll - projRes:', projRes);
      console.log('RetirementScreen fetchAll - compRes:', compRes);
      if (goalsRes.success && goalsRes.data) {
        setGoals(goalsRes.data);
        setForm(goalsRes.data);
      } else {
        // If no goals found, load default values
        const defaultGoals = {
          userId: 'default',
          currentAge: 35,
          retirementAge: 60,
          annualSavings: 20000,
          monthlySpend: 7500,
          mortgage: 22,
          cars: 3,
          healthCare: 12,
          foodAndDrinks: 10,
          travelAndEntertainment: 28,
          reinvestedFunds: 25,
        };
        setGoals(defaultGoals);
        setForm(defaultGoals);
      }
      if (projRes.success && projRes.data) setProjections(projRes.data);
      if (compRes.success && compRes.data) setComparison(compRes.data);
      // Log projections and outcome card values
      console.log('RetirementScreen fetchAll - projections:', projRes.data);
      if (projRes.data) {
        console.log('RetirementScreen fetchAll - intersectionAge:', projRes.data.intersectionAge);
        console.log('RetirementScreen fetchAll - goalMet:', projRes.data.goalMet);
        console.log('RetirementScreen fetchAll - shortfall:', projRes.data.shortfall);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load retirement data');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Form handlers
  const handleInput = (key: keyof RetirementGoals, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };
  const handleSlider = (key: keyof RetirementGoals, value: number) => {
    setForm(f => ({ ...f, [key]: value }));
  };
  const handleTemplate = (template: keyof typeof TEMPLATES) => {
    setForm(f => ({ ...f, ...TEMPLATES[template] }));
  };
  const totalPercent = CATEGORY_FIELDS.reduce((sum, cat) => sum + (Number(form[cat.key as keyof RetirementGoals]) || 0), 0);

  // Save goals
  const handleSave = async () => {
    if (totalPercent !== 100) {
      Alert.alert('Error', 'The total percentage of all categories must equal 100%.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setSaving(false);
        return;
      }
      // Ensure all numeric fields are numbers before sending to backend
      const goalsToSave = {
        ...form,
        currentAge: Number(form.currentAge),
        retirementAge: Number(form.retirementAge),
        annualSavings: Number(form.annualSavings),
        monthlySpend: Number(form.monthlySpend),
      };
      console.log('RetirementScreen handleSave - form:', form);
      console.log('RetirementScreen handleSave - goalsToSave:', goalsToSave);
      const res = await apiService.updateRetirementGoals(goalsToSave, userId);
      console.log('RetirementScreen handleSave - backend response:', res);
      if (res.success) {
        // Ensure userId is always present and a string
        const userIdString = userId || (typeof goalsToSave.userId === 'string' ? goalsToSave.userId : '');
        setGoals({
          ...goalsToSave,
          userId: userIdString,
          mortgage: Number(goalsToSave.mortgage) || 0,
          cars: Number(goalsToSave.cars) || 0,
          healthCare: Number(goalsToSave.healthCare) || 0,
          foodAndDrinks: Number(goalsToSave.foodAndDrinks) || 0,
          travelAndEntertainment: Number(goalsToSave.travelAndEntertainment) || 0,
          reinvestedFunds: Number(goalsToSave.reinvestedFunds) || 0,
        });
        setForm({
          ...goalsToSave,
          userId: userIdString,
          mortgage: Number(goalsToSave.mortgage) || 0,
          cars: Number(goalsToSave.cars) || 0,
          healthCare: Number(goalsToSave.healthCare) || 0,
          foodAndDrinks: Number(goalsToSave.foodAndDrinks) || 0,
          travelAndEntertainment: Number(goalsToSave.travelAndEntertainment) || 0,
          reinvestedFunds: Number(goalsToSave.reinvestedFunds) || 0,
        });
        Alert.alert('Success', 'Retirement goals saved successfully!');
        fetchAll();
      } else {
        setError(res.error || 'Failed to save goals');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save goals');
    }
    setSaving(false);
  };
  const handleReset = () => {
    if (goals) setForm(goals);
  };

  // Prepare all growth lines and required savings line for the chart
  const startAge = Number(form.currentAge) || 35;
  const projectionRates = [5, 7, 9, 11];
  const projectionColors = {
    5: '#00bcd4', // cyan
    7: '#ff9800', // orange
    9: '#4caf50', // green
    11: '#ffd600', // yellow
  };
  const projectionSeries = (projections?.projections || []).reduce((acc, p) => {
    if (projectionRates.includes(Math.round(p.rate))) {
      acc[Math.round(p.rate)] = p.data.map((d, i) => ({ x: startAge + i, y: d.value }));
    }
    return acc;
  }, {} as Record<number, { x: number, y: number }[]>);

  // Required savings flat line
  const requiredSavings = projections?.requiredSavings || 0;
  const chartLength = projectionSeries[7]?.length || projectionSeries[5]?.length || 0;
  const requiredLine = chartLength > 0 ? Array.from({ length: chartLength }, (_, i) => ({ x: startAge + i, y: requiredSavings })) : [];

  // For x-axis ticks, use the 7% line if available, else 5%
  const chartSeries = projectionSeries[7] || projectionSeries[5] || [];
  // Show at most 6 evenly spaced age ticks for a cleaner x-axis
  let ageTicks: number[] = [];
  if (chartSeries.length > 0) {
    const N = Math.max(1, Math.floor(chartSeries.length / 6));
    ageTicks = chartSeries.filter((_, i) => i % N === 0).map(d => d.x);
    if (ageTicks[ageTicks.length - 1] !== chartSeries[chartSeries.length - 1].x) {
      ageTicks.push(chartSeries[chartSeries.length - 1].x);
    }
  }

  // Debug logs for chart rendering
  console.log('RetirementScreen chartData:', chartSeries);
  console.log('RetirementScreen ageTicks:', ageTicks);
  console.log('RetirementScreen form.currentAge:', form.currentAge);
  console.log('RetirementScreen projections:', projections);
  console.log('RetirementScreen projections.projections:', projections?.projections);

  // Outcome card logic
  const outcomeAge = projections?.intersectionAge;
  const goalMet = projections?.goalMet;
  const shortfall = projections?.shortfall;

  // Helper to convert form (Partial<RetirementGoals>) to RetirementGoalsForm (string fields for modal)
  const toModalForm = (form: Partial<RetirementGoals>): RetirementGoalsForm => ({
    currentAge: form.currentAge !== undefined ? String(form.currentAge) : '',
    retirementAge: form.retirementAge !== undefined ? String(form.retirementAge) : '',
    annualSavings: form.annualSavings !== undefined ? String(form.annualSavings) : '',
    monthlySpend: form.monthlySpend !== undefined ? String(form.monthlySpend) : '',
    mortgage: Number(form.mortgage) || 0,
    cars: Number(form.cars) || 0,
    healthCare: Number(form.healthCare) || 0,
    foodAndDrinks: Number(form.foodAndDrinks) || 0,
    travelAndEntertainment: Number(form.travelAndEntertainment) || 0,
    reinvestedFunds: Number(form.reinvestedFunds) || 0,
  });

  // Helper to convert RetirementGoalsForm (modal) to Partial<RetirementGoals> (number fields)
  const fromModalForm = (modalForm: RetirementGoalsForm): Partial<RetirementGoals> => ({
    currentAge: modalForm.currentAge ? Number(modalForm.currentAge) : 0,
    retirementAge: modalForm.retirementAge ? Number(modalForm.retirementAge) : 0,
    annualSavings: modalForm.annualSavings ? Number(modalForm.annualSavings) : 0,
    monthlySpend: modalForm.monthlySpend ? Number(modalForm.monthlySpend) : 0,
    mortgage: Number(modalForm.mortgage) || 0,
    cars: Number(modalForm.cars) || 0,
    healthCare: Number(modalForm.healthCare) || 0,
    foodAndDrinks: Number(modalForm.foodAndDrinks) || 0,
    travelAndEntertainment: Number(modalForm.travelAndEntertainment) || 0,
    reinvestedFunds: Number(modalForm.reinvestedFunds) || 0,
  });

  // Add a handler to update form/goals from modal
  const handleModalSave = (modalForm: RetirementGoalsForm) => {
    setForm(fromModalForm(modalForm));
    setModalVisible(false);
    // After saving, reload all data to update projections and outcome card
    fetchAll();
  };
  const handleModalReset = () => {
    setForm({
      currentAge: 0,
      retirementAge: 0,
      annualSavings: 0,
      monthlySpend: 0,
      mortgage: 22,
      cars: 3,
      healthCare: 12,
      foodAndDrinks: 10,
      travelAndEntertainment: 28,
      reinvestedFunds: 25,
    });
  };

  // Use the same DEFAULTS as in the modal
  const MODAL_DEFAULTS: RetirementGoalsForm = {
    currentAge: '',
    retirementAge: '',
    annualSavings: '',
    monthlySpend: '',
    mortgage: 22,
    cars: 3,
    healthCare: 12,
    foodAndDrinks: 10,
    travelAndEntertainment: 28,
    reinvestedFunds: 25,
  };

  // UI
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0070ba" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading Retirement Data...</Text>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!projections) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 16 }}>No retirement projections available.</Text>
        <Text style={{ color: '#aaa', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>
          Please review your retirement goals and try again.
        </Text>
        <TouchableOpacity style={{ backgroundColor: '#0070ba', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }} onPress={() => setModalVisible(true)}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Review Goals</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* How Am I Tracking? | Projections Chart - moved to top */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <Text style={styles.cardTitle}>How Am I Tracking?</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={{ color: '#4fc3f7', fontWeight: 'bold', marginLeft: 6 }}>| Review Goals</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: '100%' }}>
            <VictoryChart width={chartWidth} height={180} domainPadding={20} padding={{ top: 20, bottom: 40, left: 48, right: 16 }}>
              <VictoryAxis
                label="Age"
                style={{
                  axis: { stroke: '#fff' },
                  tickLabels: { fill: '#fff', fontSize: 12 },
                  axisLabel: { fill: '#fff', fontSize: 14, padding: 24 },
                  grid: { stroke: 'none' },
                }}
                tickValues={ageTicks}
                tickFormat={v => `${v}`}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: '#fff' },
                  tickLabels: { fill: '#fff', fontSize: 12 },
                  grid: { stroke: 'none' },
                }}
                tickFormat={v => `$${(v / 1000000).toFixed(1)}M`}
              />
              {/* Growth lines */}
              {projectionSeries[5] && (
                <VictoryArea
                  data={projectionSeries[5]}
                  interpolation="monotoneX"
                  style={{ data: { fill: 'none', stroke: projectionColors[5], strokeWidth: 2 } }}
                />
              )}
              {projectionSeries[7] && (
                <VictoryArea
                  data={projectionSeries[7]}
                  interpolation="monotoneX"
                  style={{ data: { fill: 'none', stroke: projectionColors[7], strokeWidth: 3 } }}
                />
              )}
              {projectionSeries[9] && (
                <VictoryArea
                  data={projectionSeries[9]}
                  interpolation="monotoneX"
                  style={{ data: { fill: 'none', stroke: projectionColors[9], strokeWidth: 2, strokeDasharray: '6,4' } }}
                />
              )}
              {projectionSeries[11] && (
                <VictoryArea
                  data={projectionSeries[11]}
                  interpolation="monotoneX"
                  style={{ data: { fill: 'none', stroke: projectionColors[11], strokeWidth: 2, strokeDasharray: '2,6' } }}
                />
              )}
              {/* Required savings flat line */}
              {requiredLine.length > 0 && (
                <VictoryLine
                  data={requiredLine}
                  style={{ data: { stroke: '#F59E0B', strokeWidth: 2, strokeDasharray: '4,4' } }}
                />
              )}
            </VictoryChart>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#00bcd4' }]} />
            <Text style={styles.legendText}>5% Growth</Text>
            <View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} />
            <Text style={styles.legendText}>7% Growth</Text>
            <View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} />
            <Text style={styles.legendText}>9% Growth</Text>
            <View style={[styles.legendDot, { backgroundColor: '#ffd600' }]} />
            <Text style={styles.legendText}>11% Growth</Text>
          </View>
        </View>
        {/* How Do I Compare? Radial Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How Do I Compare?</Text>
          {comparison && typeof comparison.userNetWorth === 'number' && typeof comparison.ageGroupAverage === 'number' ? (
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <AnimatedCircularProgress
                size={140}
                width={16}
                fill={comparison ? Math.round(Math.min(100, (comparison.userNetWorth / (comparison.ageGroupAverage || 1)) * 100)) : 0}
                tintColor="#0070ba"
                backgroundColor="#232c3d"
                duration={1200}
                rotation={0}
                lineCap="round"
              >
                {() => (
                  <Text style={styles.radialText}>
                    {comparison ? `${Math.round(Math.min(100, (comparison.userNetWorth / (comparison.ageGroupAverage || 1)) * 100))}%` : '--%'}
                  </Text>
                )}
              </AnimatedCircularProgress>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <Text style={{ color: '#aaa', fontSize: 16, textAlign: 'center' }}>
                Not enough data to compare your net worth to your peers yet.
              </Text>
              <TouchableOpacity style={styles.outcomeBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.outcomeBtnText}>👁️ Review Goals</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Outcome Card */}
        <View style={[styles.card, { alignItems: 'center', backgroundColor: goalMet ? '#153e2e' : '#3e1a15', borderColor: goalMet ? '#28a745' : '#dc3545' }]}> 
          <Text style={goalMet ? styles.outcomeCheck : styles.outcomeWarn}>{goalMet ? '✅' : '⚠️'}</Text>
          <Text style={styles.outcomeMain}>{goalMet ? `You're On Track for Retirement!` : `You're Not Quite on Track`}</Text>
          <Text style={styles.outcomeSub}>{goalMet ? `Based on your current plan, you can retire by age` : `Based on your current plan, you're projected to have a shortfall by your target retirement age.`}</Text>
          <Text style={goalMet ? styles.outcomeAge : styles.outcomeShortfall}>{goalMet ? outcomeAge : `$${shortfall?.toLocaleString()}`}</Text>
          <Text style={styles.outcomeFooter}>{goalMet ? `Keep up the great work! Consider reviewing your goals periodically to stay on course.` : `Consider increasing your savings, adjusting your retirement age, or reducing your spending to close the gap.`}</Text>
        </View>

        {/* Retirement Lifestyle Templates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Retirement Lifestyle Templates</Text>
          <Text style={styles.cardDesc}>Select a template to automatically adjust your budget allocations based on your preferred retirement lifestyle. Each template balances essential expenses with lifestyle spending differently.</Text>
          {Object.entries(TEMPLATES).map(([key, template]) => (
            <View key={key} style={[styles.templateCard, key === 'conservative' ? styles.templateConservative : key === 'moderate' ? styles.templateModerate : styles.templateAggressive]}> 
              <Text style={styles.templateTitle}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <Text style={styles.templateBadge}>{key === 'conservative' ? 'Security Focused' : key === 'moderate' ? 'Balanced' : 'Lifestyle Focused'}</Text>
              <View style={styles.templateList}>
                {Object.entries(template).map(([cat, val]) => (
                  <Text key={cat} style={styles.templateItem}>✔️ {CATEGORY_FIELDS.find(f => f.key === cat)?.label || cat}: {val}%</Text>
                ))}
              </View>
              <TouchableOpacity style={styles.templateBtn} onPress={() => handleTemplate(key as keyof typeof TEMPLATES)}>
                <Text style={styles.templateBtnText}>Apply {key.charAt(0).toUpperCase() + key.slice(1)} Template</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Monthly Spend Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Projected Monthly Budget Based On Retirement Goal</Text>
          {CATEGORY_FIELDS.map(cat => (
            <View key={cat.key} style={styles.breakdownRow2}>
              <Text style={styles.breakdownIcon}>{cat.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.breakdownAmount}>
                  ${form.monthlySpend && form[cat.key as keyof RetirementGoals] ? ((Number(form.monthlySpend) * (Number(form[cat.key as keyof RetirementGoals]) || 0) / 100).toLocaleString()) : '0'}
                </Text>
                <Text style={styles.breakdownLabel2}>{cat.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <RetirementGoalsModal
        visible={modalVisible}
        initialValues={MODAL_DEFAULTS}
        onSave={handleModalSave}
        onReset={handleModalReset}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#181f2a',
  },
  card: {
    backgroundColor: '#232c3d',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#232c3d',
    overflow: 'hidden',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  radialText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  outcomeBox: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  outcomeTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  outcomeText: {
    color: '#b0f1c2',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  outcomeBtn: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  outcomeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginHorizontal: 6,
  },
  legendText: {
    color: '#b0b8c1',
    fontSize: 13,
    marginRight: 10,
  },
  outcomeCheck: {
    fontSize: 40,
    color: '#28a745',
    marginBottom: 8,
  },
  outcomeWarn: {
    fontSize: 40,
    color: '#dc3545',
    marginBottom: 8,
  },
  outcomeMain: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 4,
    textAlign: 'center',
  },
  outcomeSub: {
    color: '#b0b8c1',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  outcomeAge: {
    color: '#28a745',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  outcomeShortfall: {
    color: '#dc3545',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  outcomeFooter: {
    color: '#b0b8c1',
    fontSize: 14,
    textAlign: 'center',
  },
  templateCard: {
    backgroundColor: '#1a2233',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#232c3d',
  },
  templateConservative: { borderLeftWidth: 6, borderLeftColor: '#28a745' },
  templateModerate: { borderLeftWidth: 6, borderLeftColor: '#0070ba' },
  templateAggressive: { borderLeftWidth: 6, borderLeftColor: '#ffd600' },
  templateTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  templateBadge: {
    color: '#fff',
    backgroundColor: '#28a745',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    marginBottom: 8,
  },
  templateList: {
    marginBottom: 8,
  },
  templateItem: {
    color: '#b0f1c2',
    fontSize: 15,
    marginBottom: 2,
  },
  templateBtn: {
    backgroundColor: '#0070ba',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  templateBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardDesc: {
    color: '#b0b8c1',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  breakdownRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: '#1a2233',
    borderRadius: 8,
    padding: 12,
  },
  breakdownIcon: {
    fontSize: 32,
    marginRight: 16,
    color: '#0070ba',
    width: 40,
    textAlign: 'center',
  },
  breakdownAmount: {
    color: '#4fc3f7',
    fontSize: 22,
    fontWeight: 'bold',
  },
  breakdownLabel2: {
    color: '#b0b8c1',
    fontSize: 15,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    color: '#fff',
    width: 110,
    fontSize: 15,
  },
  sliderValue: {
    color: '#fff',
    width: 40,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  saveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  saveBtn: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetBtn: {
    backgroundColor: '#ffc107',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#232c3d',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RetirementScreen;
