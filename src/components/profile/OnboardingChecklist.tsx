import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { OnboardingStep } from '../../types';
import Icon from 'react-native-vector-icons/FontAwesome';

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  onToggleStep: (title: string, completed: boolean) => void;
}

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ steps, onToggleStep }) => {
  if (!steps || steps.length === 0) {
    return null;
  }

  const allCompleted = steps.every(step => step.completed);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Onboarding Checklist</Text>
      {steps.map(step => (
        <Pressable key={step.title} onPress={() => onToggleStep(step.title, !step.completed)}>
          <View style={[styles.checklistItem, step.completed && styles.completedItem]}>
            <View style={styles.checklistItemContent}>
              <Icon 
                name={step.completed ? 'check-square-o' : 'square-o'} 
                size={24} 
                style={[styles.checklistIcon, step.completed && styles.completedIcon]} 
              />
              <View style={styles.checklistTextContainer}>
                <Text style={[styles.checklistTitle, step.completed && styles.completedText]}>{step.title}</Text>
                <Text style={[styles.checklistDescription, step.completed && styles.completedText]}>{step.description.replace(/<a.*?>|<\/a>/g, '')}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
      {allCompleted && (
        <View style={styles.completionMessage}>
          <Text style={styles.completionText}>🎉 Great job! You've completed all onboarding steps.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a3042',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 15,
  },
  checklistItem: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#32394e',
    borderWidth: 1,
    borderColor: '#32394e',
  },
  completedItem: {
    backgroundColor: '#2E3951',
    borderColor: '#34c38f',
  },
  checklistItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checklistIcon: {
    color: '#556ee6',
    marginRight: 15,
    marginTop: 2,
  },
  completedIcon: {
    color: '#34c38f',
  },
  checklistTextContainer: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 5,
  },
  checklistDescription: {
    fontSize: 14,
    color: '#a6b0cf',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  completionMessage: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(52, 195, 143, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  completionText: {
    color: '#34c38f',
    textAlign: 'center',
  },
});

export default OnboardingChecklist; 