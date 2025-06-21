import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { apiService } from '../services/api';
import { Expense } from '../types';

const ExpenseForm = ({ visible, onClose, onSave, initialData }: any) => {
  const [form, setForm] = useState<Partial<Expense>>(initialData || {});
  useEffect(() => { setForm(initialData || {}); }, [initialData]);
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{form._id ? 'Edit' : 'Add'} Expense</Text>
          <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={form.date?.toString() || ''} onChangeText={v => setForm(f => ({ ...f, date: v }))} />
          <TextInput style={styles.input} placeholder="Amount" keyboardType="numeric" value={form.amount?.toString() || ''} onChangeText={v => setForm(f => ({ ...f, amount: parseFloat(v) }))} />
          <TextInput style={styles.input} placeholder="Description" value={form.description || ''} onChangeText={v => setForm(f => ({ ...f, description: v }))} />
          <TextInput style={styles.input} placeholder="Category" value={form.category || ''} onChangeText={v => setForm(f => ({ ...f, category: v }))} />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose}><Text style={styles.cancelBtn}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(form)}><Text style={styles.saveBtn}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ExpensesScreen = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const loadExpenses = async () => {
    setLoading(true);
    const res = await apiService.getExpenses();
    if (res.success && res.data) setExpenses(res.data);
    setLoading(false);
  };
  useEffect(() => { loadExpenses(); }, []);

  const handleSave = async (form: Partial<Expense>) => {
    if (editing) {
      await apiService.updateExpense(editing._id!, form);
    } else {
      await apiService.addExpense(form as any);
    }
    setModalVisible(false);
    setEditing(null);
    loadExpenses();
  };
  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await apiService.deleteExpense(id); loadExpenses(); } }
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#23aaff" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEditing(null); setModalVisible(true); }}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity>
      </View>
      <FlatList data={expenses} keyExtractor={item => item._id!} renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowText}>{item.date?.toString().slice(0, 10)} - {item.category}</Text>
            <Text style={styles.rowSub}>{item.description}</Text>
          </View>
          <Text style={styles.rowAmount}>${item.amount.toFixed(2)}</Text>
          <TouchableOpacity onPress={() => { setEditing(item); setModalVisible(true); }}><Text style={styles.editBtn}>Edit</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id!)}><Text style={styles.deleteBtn}>Delete</Text></TouchableOpacity>
        </View>
      )} />
      <ExpenseForm visible={modalVisible} onClose={() => { setModalVisible(false); setEditing(null); }} onSave={handleSave} initialData={editing} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#23aaff' },
  addBtn: { backgroundColor: '#23aaff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#222b3a' },
  rowText: { color: '#e6eaf0', fontSize: 16, fontWeight: '600' },
  rowSub: { color: '#b0b8c1', fontSize: 13 },
  rowAmount: { color: '#23aaff', fontWeight: 'bold', fontSize: 16, marginHorizontal: 8 },
  editBtn: { color: '#23aaff', marginHorizontal: 4 },
  deleteBtn: { color: '#F44336', marginHorizontal: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { color: '#888', marginRight: 16, fontSize: 16 },
  saveBtn: { color: '#23aaff', fontWeight: 'bold', fontSize: 16 },
});

export default ExpensesScreen; 