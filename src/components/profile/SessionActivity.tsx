import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Session } from '../../types';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';

interface SessionActivityProps {
  sessions: Session[];
}

const SessionActivity: React.FC<SessionActivityProps> = ({ sessions }) => {
  const renderItem = ({ item }: { item: Session }) => (
    <View style={styles.sessionItem}>
      <Icon name="globe" size={20} style={styles.sessionIcon} />
      <View style={styles.sessionDetails}>
        <Text style={styles.sessionLocation}>
          {item.location.city || 'Unknown City'}, {item.location.country || 'Unknown Country'}
        </Text>
        <Text style={styles.sessionInfo}>IP: {item.ipAddress}</Text>
        <Text style={styles.sessionInfo}>{moment(item.timestamp).format('MMMM Do YYYY, h:mm:ss a')}</Text>
        <Text style={styles.sessionInfo} numberOfLines={1} ellipsizeMode="tail">
          {item.userAgent}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Session Activity</Text>
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a3042',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    maxHeight: 300,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 15,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sessionIcon: {
    color: '#a6b0cf',
    marginRight: 15,
    marginTop: 2,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionLocation: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 5,
  },
  sessionInfo: {
    fontSize: 13,
    color: '#a6b0cf',
    marginBottom: 3,
  },
});

export default SessionActivity; 