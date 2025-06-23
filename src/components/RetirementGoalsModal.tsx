import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';

const CATEGORY_FIELDS = [
  { key: 'mortgage', label: 'Mortgages (Includes Taxes & Fees)' },
  { key: 'cars', label: 'Cars (Includes Taxes & Fees)' },
  { key: 'healthCare', label: 'Health Care' },
  { key: 'foodAndDrinks', label: 'Food & Drinks' },
  { key: 'travelAndEntertainment', label: 'Travel & Entertainment' },
  { key: 'reinvestedFunds', label: 'Reinvested Funds' },
] as const;

type CategoryKey = typeof CATEGORY_FIELDS[number]['key'];

export type RetirementGoalsForm = {
  currentAge: string;
  retirementAge: string;
  annualSavings: string;
  monthlySpend: string;
  mortgage: number;
  cars: number;
  healthCare: number;
  foodAndDrinks: number;
  travelAndEntertainment: number;
  reinvestedFunds: number;
  [key: string]: string | number; // for dynamic access
};

const DEFAULTS: RetirementGoalsForm = {
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

type Props = {
  visible: boolean;
  initialValues?: RetirementGoalsForm;
  onSave: (form: RetirementGoalsForm) => void;
  onReset?: () => void;
  onClose: () => void;
};

export default function RetirementGoalsModal({
  visible,
  initialValues = DEFAULTS,
  onSave,
  onReset,
  onClose,
}: Props) {
  const [form, setForm] = useState<RetirementGoalsForm>(initialValues);

  // Calculate total percentage
  const totalPercent = CATEGORY_FIELDS.reduce(
    (sum, cat) => sum + Number(form[cat.key] || 0),
    0
  );

  const handleInput = (key: keyof RetirementGoalsForm, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSlider = (key: CategoryKey, value: number) => {
    setForm(f => ({ ...f, [key]: Math.round(value) }));
  };

  const handleSave = () => {
    if (totalPercent !== 100) return;
    onSave(form);
  };

  const handleReset = () => {
    setForm(DEFAULTS);
    if (onReset) onReset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.title}>Retirement Goals & Planning</Text>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Age</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(form.currentAge)}
                  onChangeText={v => handleInput('currentAge', v.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 35"
                  placeholderTextColor="#b0b8c1"
                />
                <Text style={styles.helper}>Must be between 18 and 85 years old</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Annual Savings Contribution</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(form.annualSavings)}
                  onChangeText={v => handleInput('annualSavings', v.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 20000"
                  placeholderTextColor="#b0b8c1"
                />
                <Text style={styles.helper}>Your yearly contribution to savings</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Planned Retirement Age</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(form.retirementAge)}
                  onChangeText={v => handleInput('retirementAge', v.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 60"
                  placeholderTextColor="#b0b8c1"
                />
                <Text style={styles.helper}>Must be between 40 and 85 years old</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Project Monthly Spend</Text>
              <View style={styles.currencyRow}>
                <View style={styles.currencyBox}><Text style={styles.currency}>$</Text></View>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  keyboardType="numeric"
                  value={String(form.monthlySpend)}
                  onChangeText={v => handleInput('monthlySpend', v.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 5500"
                  placeholderTextColor="#b0b8c1"
                />
              </View>
              <Text style={styles.helper}>Enter your expected monthly spending in retirement (minimum $1,000)</Text>
            </View>
            <Text style={styles.sectionTitle}>Monthly Spend Categories</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${totalPercent}%` }]} />
              </View>
              <Text style={styles.progressBarText}>{totalPercent}%</Text>
            </View>
            <Text style={styles.helper}>Total must equal 100%</Text>
            {CATEGORY_FIELDS.map(cat => (
              <View key={cat.key} style={styles.sliderGroup}>
                <Text style={styles.sliderLabel}>{cat.label}:</Text>
                <Slider
                  style={{ width: '100%', height: 32 }}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={Number(form[cat.key]) || 0}
                  minimumTrackTintColor="#4fc3f7"
                  maximumTrackTintColor="#232c3d"
                  thumbTintColor="#4fc3f7"
                  onValueChange={(v: number) => handleSlider(cat.key, v)}
                />
                <View style={styles.sliderValueBox}>
                  <Text style={styles.sliderValue}>{Number(form[cat.key]) || 0}%</Text>
                  <Text style={styles.sliderDollar}>
                    {form.monthlySpend
                      ? `$${Math.round(Number(form.monthlySpend) * (Number(form[cat.key]) / 100)).toLocaleString()}`
                      : '$0'}
                  </Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.saveBtn, totalPercent !== 100 && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={totalPercent !== 100}
            >
              <Text style={styles.saveBtnText}>Save Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(24,31,42,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '95%',
    maxWidth: 500,
    backgroundColor: '#232c3d',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    marginTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#cfd8e3',
    marginBottom: 12,
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cfd8e3',
    marginTop: 18,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 12,
    minWidth: 120,
  },
  label: {
    color: '#b0b8c1',
    fontSize: 15,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#181f2a',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#232c3d',
    marginBottom: 2,
  },
  helper: {
    color: '#7e8ba3',
    fontSize: 12,
    marginBottom: 2,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  currencyBox: {
    backgroundColor: '#181f2a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#232c3d',
  },
  currency: {
    color: '#4fc3f7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginTop: 8,
    marginBottom: 2,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 10,
    backgroundColor: '#181f2a',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    backgroundColor: '#4caf50',
    borderRadius: 6,
  },
  progressBarText: {
    position: 'absolute',
    left: '50%',
    top: -2,
    transform: [{ translateX: -18 }],
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sliderGroup: {
    marginTop: 12,
    marginBottom: 2,
  },
  sliderLabel: {
    color: '#b0b8c1',
    fontSize: 15,
    marginBottom: 2,
  },
  sliderValueBox: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#232c3d',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 2,
  },
  sliderValue: {
    color: '#4fc3f7',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sliderDollar: {
    color: '#b0f1c2',
    fontSize: 15,
    marginLeft: 12,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#0070ba',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  resetBtn: {
    backgroundColor: '#b0b8c1',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#232c3d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 10,
    zIndex: 10,
    backgroundColor: 'transparent',
    padding: 4,
  },
  closeBtnText: {
    color: '#b0b8c1',
    fontSize: 32,
    fontWeight: 'bold',
  },
}); 