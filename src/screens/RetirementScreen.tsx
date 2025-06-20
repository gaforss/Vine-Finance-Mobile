import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';

const RetirementScreen: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181f2a' }}>
      <View style={styles.container}>
        <Text style={styles.title}>Retirement</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default RetirementScreen;
