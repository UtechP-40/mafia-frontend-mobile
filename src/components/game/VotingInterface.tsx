import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface VotingInterfaceProps {
  timeRemaining: number;
  onVote: (targetId: string) => void;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  timeRemaining,
  onVote,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voting Phase</Text>
      <Text style={styles.timer}>Time remaining: {timeRemaining}s</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timer: {
    color: '#fbbf24',
    fontSize: 16,
  },
});