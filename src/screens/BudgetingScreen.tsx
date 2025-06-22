import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, Modal, TextInput, Alert, Pressable } from 'react-native';
import { apiService } from '../services/api';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { VictoryChart, VictoryAxis, VictoryArea, VictoryLegend, VictoryLabel, VictoryVoronoiContainer } from 'victory-native';
import Svg, { Defs, LinearGradient, Stop } from 'react-native-svg';

console.log('Victory:', VictoryChart);
console.log('Svg:', Svg);

const PERIODS = ['monthly', 'yearly', 'weekly'];

// Helper to group transactions by date and sum income/expenses
function buildCashFlowTimeSeries(transactions: any[], days = 30) {
  const dateMap: Record<string, { income: number; expenses: number }> = {};
  transactions.forEach((txn: any) => {
    const date = dayjs(txn.date).format('YYYY-MM-DD');
    if (!dateMap[date]) dateMap[date] = { income: 0, expenses: 0 };
    if (txn.amount < 0) {
      dateMap[date].income += Math.abs(txn.amount);
    } else {
      dateMap[date].expenses += txn.amount;
    }
  });
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const income = dateMap[date]?.income || 0;
    const expenses = dateMap[date]?.expenses || 0;
    series.push({
      date,
      income,
      expenses,
      net: income - expenses,
    });
  }
  return series;
}

const BudgetingScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [spending, setSpending] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [period, setPeriod] = useState('monthly');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '', currentAmount: '', endDate: '' });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ date: '', description: '', category: '', amount: '' });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cashFlowSeries, setCashFlowSeries] = useState<any[]>([]);
  const [cashFlowSeriesLoading, setCashFlowSeriesLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check for linked accounts
        const accountsRes = await apiService.getAccounts();
        const hasLinked = accountsRes.success && Object.values(accountsRes.data || {}).some(arr => Array.isArray(arr) && arr.length > 0);
        setHasAccounts(hasLinked);

        if (hasLinked) {
          // Fetch cash flow, spending, and goals
          const [cashFlowRes, spendingRes, goalsRes] = await Promise.all([
            apiService.getCashFlow?.(),
            apiService.getSpending?.(period),
            apiService.getSavingsGoals?.(),
          ]);
          setCashFlow(cashFlowRes?.success ? cashFlowRes.data : null);
          setSpending(spendingRes?.success ? (spendingRes.data ?? []) : []);
          setGoals(goalsRes?.success ? (goalsRes.data ?? []) : []);
        }
      } catch (err) {
        setHasAccounts(false);
      }
      setLoading(false);
    };
    fetchData();
  }, [period]);

  useEffect(() => {
    const fetchExpenses = async () => {
      setExpensesLoading(true);
      setExpensesError(null);
      try {
        const res = await apiService.getExpenses();
        setExpenses(res.success ? (res.data ?? []) : []);
        if (!res.success) setExpensesError(res.error || 'Failed to fetch expenses');
      } catch (err) {
        setExpensesError('Failed to fetch expenses');
      }
      setExpensesLoading(false);
    };
    fetchExpenses();
  }, []);

  useEffect(() => {
    setCashFlowSeriesLoading(true);
    apiService.getCashFlowSeries().then(res => {
      if (res.success && Array.isArray(res.data)) {
        // Adapt: process flat array of transactions into time series
        const timeSeries = buildCashFlowTimeSeries(res.data, 30); // 30 days
        setCashFlowSeries(timeSeries);
      } else {
        setCashFlowSeries([]);
      }
      setCashFlowSeriesLoading(false);
    });
  }, []);

  // --- Insights Generation (basic logic) ---
  const generateInsights = () => {
    const insights: { icon: string; color: string; text: string }[] = [];
    if (cashFlow) {
      if (cashFlow.netIncome > 0) {
        insights.push({ icon: 'smile', color: '#4caf50', text: `Positive cash flow: You're saving $${cashFlow.netIncome.toLocaleString()} this period.` });
      } else if (cashFlow.netIncome < 0) {
        insights.push({ icon: 'frown', color: '#e57373', text: `Negative cash flow: You're spending $${Math.abs(cashFlow.netIncome).toLocaleString()} more than you earn.` });
      } else {
        insights.push({ icon: 'meh', color: '#ffb300', text: `Balanced budget: Your income and expenses are equal.` });
      }
    }
    if (spending && spending.length > 0) {
      const top = spending.reduce((a, b) => (a.value > b.value ? a : b));
      insights.push({ icon: 'chart-pie', color: '#0070ba', text: `Top spending category: ${top.name} ($${top.value.toLocaleString()})` });
    }
    if (goals && goals.length > 0) {
      const completed = goals.filter((g: any) => g.currentAmount >= g.targetAmount).length;
      if (completed > 0) {
        insights.push({ icon: 'flag-checkered', color: '#4caf50', text: `You've completed ${completed} savings goal${completed > 1 ? 's' : ''}!` });
      }
    }
    if (insights.length === 0) {
      insights.push({ icon: 'info-circle', color: '#b0b8c1', text: 'Link your accounts to get personalized financial insights.' });
    }
    return insights;
  };

  // --- Savings Goals Handlers ---
  const openGoalModal = (goal?: any) => {
    if (goal) {
      setEditingGoalId(goal._id);
      setGoalForm({
        name: goal.name,
        targetAmount: String(goal.targetAmount),
        currentAmount: String(goal.currentAmount),
        endDate: goal.endDate ? goal.endDate.split('T')[0] : '',
      });
    } else {
      setEditingGoalId(null);
      setGoalForm({ name: '', targetAmount: '', currentAmount: '', endDate: '' });
    }
    setShowGoalModal(true);
  };
  const handleGoalSave = async () => {
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.endDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      if (editingGoalId) {
        await apiService.updateSavingsGoal(editingGoalId, {
          name: goalForm.name,
          targetAmount: parseFloat(goalForm.targetAmount),
          currentAmount: parseFloat(goalForm.currentAmount) || 0,
          endDate: goalForm.endDate,
        });
      } else {
        await apiService.addSavingsGoal({
          name: goalForm.name,
          targetAmount: parseFloat(goalForm.targetAmount),
          currentAmount: parseFloat(goalForm.currentAmount) || 0,
          endDate: goalForm.endDate,
        });
      }
      setShowGoalModal(false);
      setGoalForm({ name: '', targetAmount: '', currentAmount: '', endDate: '' });
      setEditingGoalId(null);
      // Refresh goals
      const goalsRes = await apiService.getSavingsGoals();
      setGoals(goalsRes.success ? (goalsRes.data ?? []) : []);
    } catch (err) {
      Alert.alert('Error', 'Failed to save goal');
    }
  };
  const handleGoalDelete = async (goalId: string) => {
    try {
      await apiService.deleteSavingsGoal(goalId);
      // Refresh goals
      const goalsRes = await apiService.getSavingsGoals();
      setGoals(goalsRes.success ? (goalsRes.data ?? []) : []);
    } catch (err) {
      Alert.alert('Error', 'Failed to delete goal');
    }
  };

  // --- Expenses Handlers ---
  const openExpenseModal = (expense?: any) => {
    if (expense) {
      setEditingExpenseId(expense._id);
      setExpenseForm({
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        description: expense.description,
        category: expense.category,
        amount: String(expense.amount),
      });
    } else {
      setEditingExpenseId(null);
      setExpenseForm({ date: '', description: '', category: '', amount: '' });
    }
    setShowExpenseModal(true);
  };
  const handleExpenseSave = async () => {
    if (!expenseForm.date || !expenseForm.description || !expenseForm.category || !expenseForm.amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setExpensesLoading(true);
    try {
      if (editingExpenseId) {
        await apiService.updateExpense(editingExpenseId, {
          date: expenseForm.date,
          description: expenseForm.description,
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
        });
      } else {
        await apiService.addExpense({
          date: expenseForm.date,
          description: expenseForm.description,
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
        });
      }
      setShowExpenseModal(false);
      setExpenseForm({ date: '', description: '', category: '', amount: '' });
      setEditingExpenseId(null);
      // Refresh expenses
      const res = await apiService.getExpenses();
      setExpenses(res.success ? (res.data ?? []) : []);
      if (!res.success) setExpensesError(res.error || 'Failed to fetch expenses');
    } catch (err) {
      Alert.alert('Error', 'Failed to save expense');
    }
    setExpensesLoading(false);
  };
  const handleExpenseDelete = async (expenseId: string) => {
    setExpensesLoading(true);
    try {
      await apiService.deleteExpense(expenseId);
      // Refresh expenses
      const res = await apiService.getExpenses();
      setExpenses(res.success ? (res.data ?? []) : []);
      if (!res.success) setExpensesError(res.error || 'Failed to fetch expenses');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete expense');
    }
    setExpensesLoading(false);
  };

  const safeNumber = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

  const chartLabels = cashFlowSeries.map((d, i) =>
    i % 2 === 0 && d.date ? dayjs(d.date).format('MMM D') : ''
  );
  const incomeData = cashFlowSeries.map(d => safeNumber(d.income));
  const expensesData = cashFlowSeries.map(d => safeNumber(d.expenses));
  const netData = cashFlowSeries.map(d => safeNumber(d.net));

  console.log('incomeData:', incomeData);
  console.log('expensesData:', expensesData);
  console.log('netData:', netData);
  console.log('chartLabels:', chartLabels);

  console.log('VictoryGroup children types:',
    typeof incomeData,
    typeof expensesData,
    typeof netData,
    typeof chartLabels
  );
  console.log('VictoryGroup children values:', {
    incomeData,
    expensesData,
    netData,
    chartLabels
  });

  const isValidChartData =
    Array.isArray(incomeData) &&
    Array.isArray(expensesData) &&
    Array.isArray(netData) &&
    Array.isArray(chartLabels) &&
    incomeData.length === expensesData.length &&
    expensesData.length === netData.length &&
    netData.length === chartLabels.length &&
    incomeData.every(y => typeof y === 'number') &&
    expensesData.every(y => typeof y === 'number') &&
    netData.every(y => typeof y === 'number') &&
    chartLabels.every(x => typeof x === 'string');

  // Extra logging for debugging VictoryGroup children
  const incomeAreaData = incomeData.map((y, i) => ({ x: chartLabels[i], y }));
  const expensesAreaData = expensesData.map((y, i) => ({ x: chartLabels[i], y }));
  const netAreaData = netData.map((y, i) => ({ x: chartLabels[i], y }));
  console.log('incomeAreaData:', incomeAreaData);
  console.log('expensesAreaData:', expensesAreaData);
  console.log('netAreaData:', netAreaData);
  const incomeAreaElem = <VictoryArea data={incomeAreaData} interpolation="monotoneX" style={{ data: { fill: "url(#incomeGradient)", stroke: "#23aaff", strokeWidth: 2 } }} />;
  const expensesAreaElem = <VictoryArea data={expensesAreaData} interpolation="monotoneX" style={{ data: { fill: "url(#expensesGradient)", stroke: "#0070ba", strokeWidth: 2 } }} />;
  const netAreaElem = <VictoryArea data={netAreaData} interpolation="monotoneX" style={{ data: { fill: "transparent", stroke: "#28a745", strokeWidth: 2 } }} />;
  console.log('incomeAreaElem:', incomeAreaElem);
  console.log('expensesAreaElem:', expensesAreaElem);
  console.log('netAreaElem:', netAreaElem);
  [incomeAreaElem, expensesAreaElem, netAreaElem].forEach((elem, idx) => {
    console.log(`VictoryGroup child[${idx}] type:`, typeof elem, 'isArray:', Array.isArray(elem), 'keys:', elem && typeof elem === 'object' ? Object.keys(elem) : 'N/A');
  });

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0070ba" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 18 }}>Loading your Budgeting Hub...</Text>
      </SafeAreaView>
    );
  }

  if (!hasAccounts) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a', justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.ctaCard}>
          <FontAwesome5 name="university" size={40} color="#0070ba" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>Your Budgeting Hub is Ready</Text>
          <Text style={{ color: '#b0b8c1', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            Connect your accounts to automatically track spending, create budgets, and monitor your cash flow.
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => (navigation as any).navigate('Accounts')}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Connect an Account</Text>
            <FontAwesome5 name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Render ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Insights Section */}
        <Text style={styles.sectionTitle}>Key Financial Insights</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {generateInsights().map((insight, idx) => (
            <View key={idx} style={[styles.insightCard, { backgroundColor: '#232c3d', borderLeftColor: insight.color }]}> 
              <FontAwesome5 name={insight.icon} size={24} color={insight.color} style={{ marginBottom: 8 }} />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{insight.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Income vs. Expenses Section */}
        <View style={{
          backgroundColor: '#101a28',
          borderRadius: 20,
          marginHorizontal: 8,
          marginTop: 24,
          marginBottom: 0,
          paddingBottom: 0,
          borderWidth: 1,
          borderColor: '#1a2536',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingTop: 24, marginBottom: 2 }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: 'bold', letterSpacing: 0.2 }}>Your Income vs. Expenses</Text>
              <Text style={{ color: '#b0b8c1', fontSize: 15, marginTop: 2 }}>Track your cash flow over time</Text>
            </View>
            <Pressable onPress={() => setShowHelp(true)} hitSlop={12} style={{ padding: 6 }}>
              <FontAwesome5 name="info-circle" size={22} color="#b0b8c1" />
            </Pressable>
          </View>
          <Modal visible={showHelp} transparent animationType="fade">
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowHelp(false)}>
              <View style={{ backgroundColor: '#232c3d', borderRadius: 16, padding: 24, margin: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Income vs. Expenses</Text>
                <Text style={{ color: '#b0b8c1', fontSize: 16, textAlign: 'center' }}>
                  This chart shows your total income, expenses, and net cash flow for each day. Tap on the chart to see exact values.
                </Text>
              </View>
            </Pressable>
          </Modal>
          {isValidChartData ? (
            <>
              {/* Legend above chart, outside SVG */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 0, marginBottom: 8 }} pointerEvents="none">
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderRadius: 16, paddingVertical: 2, paddingHorizontal: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#23aaff', marginRight: 4, borderWidth: 1, borderColor: '#fff' }} />
                  <Text style={{ color: '#b0b8c1', fontWeight: '500', fontSize: 14, marginRight: 12 }}>Income</Text>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#0070ba', marginRight: 4, borderWidth: 1, borderColor: '#fff' }} />
                  <Text style={{ color: '#b0b8c1', fontWeight: '500', fontSize: 14, marginRight: 12 }}>Expenses</Text>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#28a745', marginRight: 4, borderWidth: 1, borderColor: '#fff' }} />
                  <Text style={{ color: '#b0b8c1', fontWeight: '500', fontSize: 14 }}>Net Cash Flow</Text>
                </View>
              </View>
              <Svg width={Dimensions.get('window').width - 8} height={320} style={{ marginTop: 8 }}>
                <Defs>
                  <LinearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#23aaff" stopOpacity={0.55} />
                    <Stop offset="100%" stopColor="#23aaff" stopOpacity={0.10} />
                  </LinearGradient>
                </Defs>
                <VictoryChart
                  width={Dimensions.get('window').width - 40}
                  height={220}
                  padding={{ top: 40, left: 60, right: 30, bottom: 50 }}
                  domainPadding={{ x: 20, y: 20 }}
                  standalone={false}
                  style={{ background: { fill: '#101a28' } }}
                  containerComponent={
                    <VictoryVoronoiContainer
                      labels={({ datum }) => `${datum.x}\n$${Number(datum.y).toLocaleString()}`}
                      labelComponent={<VictoryLabel renderInPortal dy={-18} style={{ fill: '#fff', fontSize: 13, fontWeight: '500', background: '#232c3d' }} />}
                      voronoiDimension="x"
                    />
                  }
                >
                  <VictoryAxis
                    dependentAxis
                    style={{
                      axis: { stroke: "#22304a" },
                      tickLabels: { fill: "#b0b8c1", fontSize: 13, fontWeight: "500" },
                      grid: { stroke: "#22304a", strokeDasharray: "6 6", opacity: 0.18 },
                    }}
                    tickFormat={(y: number) => `$${Number(y).toLocaleString()}`}
                  />
                  <VictoryAxis
                    style={{
                      axis: { stroke: "#22304a" },
                      tickLabels: { fill: "#b0b8c1", fontSize: 13, fontWeight: "500" }
                    }}
                    tickCount={7}
                    tickFormat={(t: string, i: number) => t}
                  />
                  <VictoryArea
                    data={incomeAreaData}
                    interpolation="monotoneX"
                    style={{ data: { fill: "url(#incomeGradient)", stroke: "#23aaff", strokeWidth: 2 } }}
                  />
                  <VictoryArea
                    data={expensesAreaData}
                    interpolation="monotoneX"
                    style={{ data: { fill: "transparent", stroke: "#0070ba", strokeWidth: 2 } }}
                  />
                  <VictoryArea
                    data={netAreaData}
                    interpolation="monotoneX"
                    style={{ data: { fill: "transparent", stroke: "#28a745", strokeWidth: 2 } }}
                  />
                </VictoryChart>
              </Svg>
            </>
          ) : (
            <Text style={{ color: 'red', textAlign: 'center', marginVertical: 20 }}>
              Chart data is invalid or empty.
            </Text>
          )}
        </View>

        {/* Savings Goals Section */}
        <Text style={styles.sectionTitle}>Savings Goals</Text>
        <TouchableOpacity style={styles.addGoalBtn} onPress={() => openGoalModal()}>
          <FontAwesome5 name="plus" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add Goal</Text>
        </TouchableOpacity>
        {goals.length === 0 ? (
          <View style={styles.placeholderCard}><Text style={styles.placeholderText}>No savings goals yet.</Text></View>
        ) : (
          goals.map((goal, idx) => {
            const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            return (
              <View key={goal._id || idx} style={styles.goalCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>{goal.name}</Text>
                    <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>Target: ${goal.targetAmount.toLocaleString()} | Current: ${goal.currentAmount.toLocaleString()}</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={{ color: '#4caf50', fontSize: 13, marginTop: 2 }}>{progress.toFixed(1)}% complete</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                    <TouchableOpacity onPress={() => openGoalModal(goal)} style={{ marginRight: 10 }}>
                      <FontAwesome5 name="edit" size={18} color="#0070ba" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleGoalDelete(goal._id)}>
                      <FontAwesome5 name="trash" size={18} color="#e57373" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={{ color: '#b0b8c1', fontSize: 13, marginTop: 6 }}>End Date: {goal.endDate ? new Date(goal.endDate).toLocaleDateString() : '-'}</Text>
              </View>
            );
          })
        )}
        {/* Add/Edit Goal Modal */}
        <Modal visible={showGoalModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingGoalId ? 'Edit Goal' : 'Add Goal'}</Text>
              <TextInput style={styles.modalInput} placeholder="Goal Name" value={goalForm.name} onChangeText={v => setGoalForm(f => ({ ...f, name: v }))} />
              <TextInput style={styles.modalInput} placeholder="Target Amount" value={goalForm.targetAmount} onChangeText={v => setGoalForm(f => ({ ...f, targetAmount: v }))} keyboardType="numeric" />
              <TextInput style={styles.modalInput} placeholder="Current Amount" value={goalForm.currentAmount} onChangeText={v => setGoalForm(f => ({ ...f, currentAmount: v }))} keyboardType="numeric" />
              <TextInput style={styles.modalInput} placeholder="End Date (YYYY-MM-DD)" value={goalForm.endDate} onChangeText={v => setGoalForm(f => ({ ...f, endDate: v }))} />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowGoalModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalAddButton} onPress={handleGoalSave}>
                  <Text style={styles.modalAddText}>{editingGoalId ? 'Save' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Expenses Section */}
        <Text style={styles.sectionTitle}>Expenses</Text>
        <TouchableOpacity style={styles.addGoalBtn} onPress={() => openExpenseModal()}>
          <FontAwesome5 name="plus" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add Expense</Text>
        </TouchableOpacity>
        {expensesLoading ? (
          <ActivityIndicator size="small" color="#0070ba" style={{ marginVertical: 16 }} />
        ) : expensesError ? (
          <View style={styles.placeholderCard}><Text style={styles.placeholderText}>{expensesError}</Text></View>
        ) : expenses.length === 0 ? (
          <View style={styles.placeholderCard}><Text style={styles.placeholderText}>No expenses yet.</Text></View>
        ) : (
          expenses.map((expense, idx) => (
            <View key={expense._id || idx} style={styles.goalCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{expense.description}</Text>
                  <Text style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 4 }}>{expense.category} | {new Date(expense.date).toLocaleDateString()}</Text>
                  <Text style={{ color: '#e57373', fontSize: 15, fontWeight: 'bold' }}>-${expense.amount.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                  <TouchableOpacity onPress={() => openExpenseModal(expense)} style={{ marginRight: 10 }}>
                    <FontAwesome5 name="edit" size={18} color="#0070ba" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleExpenseDelete(expense._id)}>
                    <FontAwesome5 name="trash" size={18} color="#e57373" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        {/* Add/Edit Expense Modal */}
        <Modal visible={showExpenseModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Date (YYYY-MM-DD)"
                  value={expenseForm.date}
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={expenseForm.date ? new Date(expenseForm.date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setExpenseForm(f => ({ ...f, date: selectedDate.toISOString().split('T')[0] }));
                    }
                  }}
                />
              )}
              <TextInput style={styles.modalInput} placeholder="Description" value={expenseForm.description} onChangeText={v => setExpenseForm(f => ({ ...f, description: v }))} />
              <TextInput style={styles.modalInput} placeholder="Category" value={expenseForm.category} onChangeText={v => setExpenseForm(f => ({ ...f, category: v }))} />
              <TextInput style={styles.modalInput} placeholder="Amount" value={expenseForm.amount} onChangeText={v => setExpenseForm(f => ({ ...f, amount: v }))} keyboardType="numeric" />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowExpenseModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalAddButton} onPress={handleExpenseSave} disabled={expensesLoading}>
                  <Text style={styles.modalAddText}>{editingExpenseId ? 'Save' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Spending Habits Section */}
        <Text style={styles.sectionTitle}>Spending Habits</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
              <Text style={{ color: period === p ? '#fff' : '#b0b8c1', fontWeight: 'bold' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {spending.length > 0 ? (
          <PieChart
            data={spending.map((item, idx) => ({
              name: item.name,
              population: item.value,
              color: ['#0070ba', '#4caf50', '#e57373', '#ffb300', '#b0b8c1', '#9c27b0'][idx % 6],
              legendFontColor: '#b0b8c1',
              legendFontSize: 14,
            }))}
            width={Dimensions.get('window').width - 36}
            height={180}
            chartConfig={{
              backgroundColor: '#232c3d',
              backgroundGradientFrom: '#232c3d',
              backgroundGradientTo: '#232c3d',
              color: () => '#fff',
              labelColor: () => '#b0b8c1',
            }}
            accessor={'population'}
            backgroundColor={'transparent'}
            paddingLeft={'16'}
            absolute
            style={{ borderRadius: 14, marginHorizontal: 18, marginBottom: 18 }}
          />
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>No spending data for this period.</Text>
          </View>
        )}
        {spending.length > 0 && (
          <View style={styles.spendingBreakdown}>
            {spending.map((item, idx) => (
              <View key={idx} style={styles.spendingRow}>
                <Text style={{ color: '#fff', fontSize: 15, flex: 1 }}>{item.name}</Text>
                <Text style={{ color: '#0070ba', fontWeight: 'bold', fontSize: 15 }}>${item.value.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ctaCard: {
    backgroundColor: '#222b3a',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginHorizontal: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0070ba',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 28,
    marginBottom: 12,
    marginLeft: 18,
  },
  insightCard: {
    minWidth: 220,
    maxWidth: 260,
    borderRadius: 14,
    padding: 18,
    marginRight: 14,
    borderLeftWidth: 5,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  placeholderCard: {
    backgroundColor: '#232c3d',
    borderRadius: 14,
    padding: 32,
    marginHorizontal: 18,
    marginBottom: 18,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#b0b8c1',
    fontSize: 16,
    fontStyle: 'italic',
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0070ba',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginLeft: 18,
    marginBottom: 10,
  },
  goalCard: {
    backgroundColor: '#232c3d',
    borderRadius: 14,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 14,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#2e3a4d',
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 2,
    width: '100%',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#0070ba',
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#232c3d',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1a2233',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#b0b8c1',
    marginRight: 10,
  },
  modalCancelText: {
    color: '#232c3d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalAddButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#0070ba',
  },
  modalAddText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  periodBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#232c3d',
    marginHorizontal: 6,
  },
  periodBtnActive: {
    backgroundColor: '#0070ba',
  },
  spendingBreakdown: {
    marginHorizontal: 18,
    marginBottom: 18,
  },
  spendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#232c3d',
  },
});

export default BudgetingScreen;
