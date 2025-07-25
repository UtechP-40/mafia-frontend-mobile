import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Player } from '../../types/game';
import { PlayerCard } from './PlayerCard';
import { Button } from '../ui/Button';

interface VotingInterfaceProps {
  eligibleTargets: Player[];
  timeRemaining: number;
  hasVoted: boolean;
  currentVote?: string;
  onVote: (targetId: string) => void;
  onSkip?: () => void;
  allowSkip?: boolean;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  eligibleTargets,
  timeRemaining,
  hasVoted,
  currentVote,
  onVote,
  onSkip,
  allowSkip = true,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(currentVote || null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setSelectedTarget(currentVote || null);
  }, [currentVote]);

  const handlePlayerSelect = (playerId: string) => {
    if (hasVoted) return;
    
    if (selectedTarget === playerId) {
      setSelectedTarget(null);
    } else {
      setSelectedTarget(playerId);
    }
  };

  const handleConfirmVote = () => {
    if (selectedTarget && !hasVoted) {
      setIsConfirming(true);
      onVote(selectedTarget);
      setTimeout(() => setIsConfirming(false), 1000);
    }
  };

  const handleSkipVote = () => {
    if (onSkip && !hasVoted) {
      onSkip();
    }
  };

  const getTimerColor = () => {
    if (timeRemaining <= 10) return '#ef4444';
    if (timeRemaining <= 30) return '#f59e0b';
    return '#10b981';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cast Your Vote</Text>
        <View style={styles.timerContainer}>
          <Text style={[styles.timer, { color: getTimerColor() }]}>
            {formatTime(timeRemaining)}
          </Text>
          <Text style={styles.timerLabel}>remaining</Text>
        </View>
      </View>

      {/* Instructions */}
      <Text style={styles.instructions}>
        {hasVoted 
          ? 'You have voted. Waiting for other players...' 
          : 'Select a player to eliminate:'}
      </Text>

      {/* Player Grid */}
      <ScrollView 
        style={styles.playersContainer}
        contentContainerStyle={styles.playersGrid}
        showsVerticalScrollIndicator={false}
      >
        {eligibleTargets.map((player) => (
          <View key={player.id} style={styles.playerCardWrapper}>
            <PlayerCard
              player={player}
              isSelected={selectedTarget === player.id}
              onSelect={hasVoted ? undefined : () => handlePlayerSelect(player.id)}
              showRole={false}
            />
          </View>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      {!hasVoted && (
        <View style={styles.actionButtons}>
          <Button
            title={isConfirming ? 'Voting...' : 'Confirm Vote'}
            onPress={handleConfirmVote}
            disabled={!selectedTarget || isConfirming}
            style={[styles.voteButton, !selectedTarget && styles.disabledButton]}
          />
          
          {allowSkip && (
            <Button
              title="Skip Vote"
              onPress={handleSkipVote}
              variant="outline"
              style={styles.skipButton}
            />
          )}
        </View>
      )}

      {/* Vote Status */}
      {hasVoted && currentVote && (
        <View style={styles.voteStatus}>
          <Text style={styles.voteStatusText}>
            You voted for: {eligibleTargets.find(p => p.id === currentVote)?.username}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    margin: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timerLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  instructions: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  playersContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  playerCardWrapper: {
    width: '45%',
    margin: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  voteButton: {
    flex: 2,
    backgroundColor: '#ef4444',
  },
  skipButton: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  voteStatus: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  voteStatusText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
});