import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { VictoryChart, VictoryAxis, VictoryArea, VictoryLegend, VictoryLabel } from 'victory-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { apiService } from '../services/api';
import storageService from '../services/storage';
import { RetirementGoals, RetirementProjectionsResult, NetWorthComparisonResult } from '../types';

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

  // Fetch all data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [goalsRes, projRes, compRes] = await Promise.all([
        apiService.getRetirementGoals(),
        apiService.getRetirementProjections(),
        apiService.getNetWorthComparison(),
      ]);
      if (goalsRes.success && goalsRes.data) {
        setGoals(goalsRes.data);
        setForm(goalsRes.data);
      }
      if (projRes.success && projRes.data) setProjections(projRes.data);
      if (compRes.success && compRes.data) setComparison(compRes.data);
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
      const res = await apiService.updateRetirementGoals(form);
      if (res.success) {
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

  // Chart data
  const chartData = projections?.projections?.find(p => Math.abs(p.rate - 7) < 0.01) || projections?.projections?.[0];
  const chartSeries = chartData?.data?.map(d => ({ x: d.year, y: d.value })) || [];

  // Outcome card logic
  const outcomeAge = projections?.intersectionAge;
  const goalMet = projections?.goalMet;
  const shortfall = projections?.shortfall;

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* How Do I Compare? Radial Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How Do I Compare?</Text>
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
          <View style={[styles.outcomeBox, { backgroundColor: '#153e2e' }]}> 
            <Text style={styles.outcomeTitle}>🎉 Outstanding Performance!</Text>
            <Text style={styles.outcomeText}>
              Excellent! You're exceeding the top 10% of your peers and are on track to meet your retirement goals. Your financial planning is outstanding.
            </Text>
            <TouchableOpacity style={styles.outcomeBtn} onPress={() => {}}>
              <Text style={styles.outcomeBtnText}>👁️ Review Goals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How Am I Tracking? | Projections Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How Am I Tracking? <Text style={{ color: '#4fc3f7' }}>| Review Goals</Text></Text>
          <VictoryChart domainPadding={20} height={260} padding={{ top: 20, bottom: 40, left: 60, right: 20 }}>
            <VictoryAxis
              label="Age"
              style={{
                axis: { stroke: '#fff' },
                tickLabels: { fill: '#fff', fontSize: 12 },
                axisLabel: { fill: '#fff', fontSize: 14, padding: 30 },
                grid: { stroke: '#444', strokeDasharray: '4' },
              }}
            />
            <VictoryAxis
              dependentAxis
              label="Net Worth ($)"
              style={{
                axis: { stroke: '#fff' },
                tickLabels: { fill: '#fff', fontSize: 12 },
                axisLabel: { fill: '#fff', fontSize: 14, padding: 40 },
                grid: { stroke: '#444', strokeDasharray: '4' },
              }}
              tickFormat={v => `$${(v / 1000000).toFixed(1)}M`}
            />
            {/* Required line */}
            {projections && (
              <VictoryArea
                data={chartSeries}
                interpolation="monotoneX"
                style={{ data: { fill: 'rgba(0,112,186,0.15)', stroke: '#0070ba', strokeWidth: 3, strokeDasharray: '8,4' } }}
              />
            )}
          </VictoryChart>
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

        {/* Goals Form (at bottom) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Retirement Goals</Text>
          <View style={styles.formRow}><Text style={styles.label}>Current Age</Text><TextInput style={styles.input} keyboardType="numeric" value={form.currentAge?.toString() || ''} onChangeText={v => handleInput('currentAge', Number(v))} placeholder="e.g. 30" /></View>
          <View style={styles.formRow}><Text style={styles.label}>Retirement Age</Text><TextInput style={styles.input} keyboardType="numeric" value={form.retirementAge?.toString() || ''} onChangeText={v => handleInput('retirementAge', Number(v))} placeholder="e.g. 65" /></View>
          <View style={styles.formRow}><Text style={styles.label}>Annual Savings</Text><TextInput style={styles.input} keyboardType="numeric" value={form.annualSavings?.toString() || ''} onChangeText={v => handleInput('annualSavings', Number(v))} placeholder="e.g. 20000" /></View>
          <View style={styles.formRow}><Text style={styles.label}>Monthly Spend</Text><TextInput style={styles.input} keyboardType="numeric" value={form.monthlySpend?.toString() || ''} onChangeText={v => handleInput('monthlySpend', Number(v))} placeholder="e.g. 7500" /></View>
          <Text style={{ color: totalPercent === 100 ? '#28a745' : '#dc3545', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Total: {totalPercent}% {totalPercent !== 100 ? '(must equal 100%)' : ''}</Text>
          {CATEGORY_FIELDS.map(cat => (
            <View key={cat.key} style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>{cat.icon} {cat.label}</Text>
              <Slider style={{ flex: 1, marginHorizontal: 10 }} minimumValue={0} maximumValue={100} step={1} value={Number(form[cat.key as keyof RetirementGoals]) || 0} onValueChange={(v: number) => handleSlider(cat.key as keyof RetirementGoals, v)} minimumTrackTintColor="#0070ba" maximumTrackTintColor="#ccc" />
              <Text style={styles.sliderValue}>{Number(form[cat.key as keyof RetirementGoals]) || 0}%</Text>
            </View>
          ))}
          <View style={styles.saveRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}><Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Goals'}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}><Text style={styles.resetBtnText}>Reset</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
