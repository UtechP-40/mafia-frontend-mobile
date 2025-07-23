import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ResultsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Results</Text>
      <Text style={styles.subtitle}>Match summary and statistics</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
  },
});