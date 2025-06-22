import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { apiService } from '../services/api';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

const BudgetingScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [spending, setSpending] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
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
            apiService.getCashFlow?.(), // TODO: Implement this in apiService if not present
            apiService.getSpending?.('monthly'), // TODO: Implement this in apiService if not present
            apiService.getSavingsGoals?.(), // TODO: Implement this in apiService if not present
          ]);
          setCashFlow(cashFlowRes?.success ? cashFlowRes.data : null);
          setSpending(spendingRes?.success ? spendingRes.data : []);
          setGoals(goalsRes?.success ? goalsRes.data : []);
        }
      } catch (err) {
        setHasAccounts(false);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

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
          <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('Accounts')}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Connect an Account</Text>
            <FontAwesome5 name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionTitle}>Key Financial Insights</Text>
        {/* TODO: Render insights cards here */}
        <View style={styles.placeholderCard}><Text style={styles.placeholderText}>[Insights Section]</Text></View>

        <Text style={styles.sectionTitle}>Income vs. Expenses</Text>
        {/* TODO: Render area/line chart here */}
        <View style={styles.placeholderCard}><Text style={styles.placeholderText}>[Income vs. Expenses Chart]</Text></View>

        <Text style={styles.sectionTitle}>Savings Goals</Text>
        {/* TODO: Render savings goals list and progress here */}
        <View style={styles.placeholderCard}><Text style={styles.placeholderText}>[Savings Goals Section]</Text></View>

        <Text style={styles.sectionTitle}>Spending Habits</Text>
        {/* TODO: Render donut/pie chart and breakdown here */}
        <View style={styles.placeholderCard}><Text style={styles.placeholderText}>[Spending Habits Section]</Text></View>
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
});

export default BudgetingScreen;
