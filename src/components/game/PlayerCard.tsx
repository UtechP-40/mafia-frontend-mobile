import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlayerCardProps {
  player: {
    id: string;
    username: string;
    avatar: string;
    isAlive: boolean;
    isHost: boolean;
  };
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <View style={[styles.card, !player.isAlive && styles.eliminated]}>
      <Text style={styles.username}>{player.username}</Text>
      {player.isHost && <Text style={styles.hostBadge}>HOST</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    alignItems: 'center',
  },
  eliminated: {
    opacity: 0.5,
    backgroundColor: '#4b5563',
  },
  username: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  hostBadge: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
});