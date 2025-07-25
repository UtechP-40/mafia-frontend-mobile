import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { GameRole } from '../../types/game';

interface PlayerCardProps {
  player: {
    id: string;
    username: string;
    avatar: string;
    role?: GameRole;
    isAlive: boolean;
    isHost: boolean;
    isReady?: boolean;
  };
  showReadyState?: boolean;
  showRole?: boolean;
  isVoting?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  animated?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  showReadyState = false,
  showRole = false,
  isVoting = false,
  isSelected = false,
  onSelect,
  animated = false 
}) => {
  const getCardStyle = () => {
    if (!player.isAlive) return styles.eliminated;
    if (isSelected) return styles.selected;
    if (isVoting) return styles.voting;
    if (showReadyState && (player.isReady || player.isHost)) return styles.ready;
    return styles.card;
  };

  const getAvatarText = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const getRoleColor = (role?: GameRole) => {
    switch (role) {
      case 'mafia':
        return '#ef4444';
      case 'detective':
        return '#3b82f6';
      case 'doctor':
        return '#10b981';
      case 'mayor':
        return '#f59e0b';
      case 'villager':
      default:
        return '#6366f1';
    }
  };

  const getRoleDisplayName = (role?: GameRole) => {
    switch (role) {
      case 'mafia':
        return 'MAFIA';
      case 'detective':
        return 'DETECTIVE';
      case 'doctor':
        return 'DOCTOR';
      case 'mayor':
        return 'MAYOR';
      case 'villager':
        return 'VILLAGER';
      default:
        return 'UNKNOWN';
    }
  };

  const CardComponent = onSelect ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[styles.cardContainer, getCardStyle()]}
      onPress={onSelect}
      disabled={!player.isAlive || !onSelect}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[
        styles.avatar,
        showRole && player.role && { backgroundColor: getRoleColor(player.role) }
      ]}>
        <Text style={styles.avatarText}>
          {getAvatarText(player.username)}
        </Text>
      </View>
      
      {/* Player Info */}
      <View style={styles.playerInfo}>
        <Text style={styles.username} numberOfLines={1}>
          {player.username}
        </Text>
        
        {/* Role Badge */}
        {showRole && player.role && (
          <View style={[
            styles.roleBadge,
            { backgroundColor: getRoleColor(player.role) }
          ]}>
            <Text style={styles.roleBadgeText}>
              {getRoleDisplayName(player.role)}
            </Text>
          </View>
        )}
        
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

      {/* Voting Indicator */}
      {isVoting && (
        <View style={styles.votingIndicator}>
          <Text style={styles.votingText}>VOTE</Text>
        </View>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionText}>✓</Text>
        </View>
      )}

      {/* Ready Indicator Dot */}
      {showReadyState && (
        <View style={[
          styles.readyDot,
          (player.isReady || player.isHost) && styles.readyDotActive
        ]} />
      )}

      {/* Elimination Overlay */}
      {!player.isAlive && (
        <View style={styles.eliminationOverlay}>
          <Text style={styles.eliminationText}>ELIMINATED</Text>
        </View>
      )}
    </CardComponent>
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
  voting: {
    backgroundColor: '#2d2d2d',
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  selected: {
    backgroundColor: '#1f2937',
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  votingIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  votingText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#6366f1',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eliminationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eliminationText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    transform: [{ rotate: '-15deg' }],
  },
});