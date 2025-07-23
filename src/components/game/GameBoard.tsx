import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GameBoardProps {
  phase: string;
  players: any[];
}

export const GameBoard: React.FC<GameBoardProps> = ({ phase, players }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.phase}>Current Phase: {phase}</Text>
      <Text style={styles.playerCount}>Players: {players.length}</Text>
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
  phase: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playerCount: {
    color: '#cccccc',
    fontSize: 14,
  },
});