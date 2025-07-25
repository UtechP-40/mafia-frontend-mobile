import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface PlayerCardProps {
  player: {
    id: string;
    username: string;
    avatar: string;
    isAlive: boolean;
    isHost: boolean;
    isReady?: boolean;
  };
  showReadyState?: boolean;
  animated?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  showReadyState = false,
  animated = false 
}) => {
  const getCardStyle = () => {
    if (!player.isAlive) return styles.eliminated;
    if (showReadyState && (player.isReady || player.isHost)) return styles.ready;
    return styles.card;
  };

  const getAvatarText = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <View style={[styles.cardContainer, getCardStyle()]}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getAvatarText(player.username)}
        </Text>
      </View>
      
      {/* Player Info */}
      <View style={styles.playerInfo}>
        <Text style={styles.username} numberOfLines={1}>
          {player.username}
        </Text>
        
        {/* Status Indicators */}
        <View style={styles.statusContainer}>
          {player.isHost && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>HOST</Text>
            </View>
          )}
          
          {showReadyState && !player.isHost && (
            <View style={[
              styles.readyBadge,
              player.isReady && styles.readyBadgeActive
            ]}>
              <Text style={[
                styles.readyBadgeText,
                player.isReady && styles.readyBadgeTextActive
              ]}>
                {player.isReady ? 'READY' : 'NOT READY'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Ready Indicator Dot */}
      {showReadyState && (
        <View style={[
          styles.readyDot,
          (player.isReady || player.isHost) && styles.readyDotActive
        ]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 80,
    position: 'relative',
  },
  card: {
    backgroundColor: '#2d2d2d',
  },
  ready: {
    backgroundColor: '#1f2937',
    borderColor: '#10b981',
  },
  eliminated: {
    opacity: 0.5,
    backgroundColor: '#4b5563',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 4,
  },
  hostBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hostBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  readyBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  readyBadgeActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  readyBadgeText: {
    color: '#9ca3af',
    fontSize: 9,
    fontWeight: '600',
  },
  readyBadgeTextActive: {
    color: '#ffffff',
  },
  readyDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b7280',
  },
  readyDotActive: {
    backgroundColor: '#10b981',
  },
});