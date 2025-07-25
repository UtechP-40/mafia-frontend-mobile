import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Player } from '../../types/game';
import { PlayerCard } from './PlayerCard';
import { Button } from '../ui/Button';
import { 
  ANIMATION_CONFIG,
  createEntranceAnimation,
  createStaggerAnimation,
  createCountdownAnimation
} from '../../utils/animations';

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

  // Animation values
  const isVisible = useSharedValue(true);
  const timerValue = useSharedValue(timeRemaining);
  const confirmingScale = useSharedValue(1);

  useEffect(() => {
    setSelectedTarget(currentVote || null);
  }, [currentVote]);

  useEffect(() => {
    timerValue.value = timeRemaining;
  }, [timeRemaining, timerValue]);

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
      confirmingScale.value = withSequence(
        withSpring(1.1, ANIMATION_CONFIG.spring.bouncy),
        withSpring(1, ANIMATION_CONFIG.spring.gentle)
      );
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

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    return createEntranceAnimation(isVisible, 0, 'up');
  });

  const animatedTimerStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      timeRemaining,
      [0, 60],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      progress,
      [0, 0.2, 1],
      [1.3, 1.1, 1],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ scale: withSpring(scale, ANIMATION_CONFIG.spring.gentle) }],
    };
  });

  const animatedInstructionsStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(hasVoted ? 0.7 : 1, ANIMATION_CONFIG.timing.medium),
      transform: [
        {
          scale: withSpring(hasVoted ? 0.95 : 1, ANIMATION_CONFIG.spring.gentle),
        },
      ],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: confirmingScale.value }],
    };
  });

  const animatedVoteStatusStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(hasVoted ? 1 : 0, ANIMATION_CONFIG.timing.medium),
      transform: [
        {
          translateY: withSpring(hasVoted ? 0 : 20, ANIMATION_CONFIG.spring.gentle),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cast Your Vote</Text>
        <Animated.View style={[styles.timerContainer, animatedTimerStyle]}>
          <Text style={[styles.timer, { color: getTimerColor() }]}>
            {formatTime(timeRemaining)}
          </Text>
          <Text style={styles.timerLabel}>remaining</Text>
        </Animated.View>
      </View>

      {/* Instructions */}
      <Animated.Text style={[styles.instructions, animatedInstructionsStyle]}>
        {hasVoted 
          ? 'You have voted. Waiting for other players...' 
          : 'Select a player to eliminate:'}
      </Animated.Text>

      {/* Player Grid */}
      <ScrollView 
        style={styles.playersContainer}
        contentContainerStyle={styles.playersGrid}
        showsVerticalScrollIndicator={false}
      >
        {eligibleTargets.map((player, index) => {
          const animatedPlayerStyle = useAnimatedStyle(() => {
            return createStaggerAnimation(isVisible, index, 100);
          });

          return (
            <Animated.View 
              key={player.id} 
              style={[styles.playerCardWrapper, animatedPlayerStyle]}
            >
              <PlayerCard
                player={player}
                isSelected={selectedTarget === player.id}
                isVoting={!hasVoted && selectedTarget === player.id}
                onSelect={hasVoted ? undefined : () => handlePlayerSelect(player.id)}
                showRole={false}
                animated={true}
              />
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Action Buttons */}
      {!hasVoted && (
        <Animated.View style={[styles.actionButtons, animatedButtonStyle]}>
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
        </Animated.View>
      )}

      {/* Vote Status */}
      {hasVoted && currentVote && (
        <Animated.View style={[styles.voteStatus, animatedVoteStatusStyle]}>
          <Text style={styles.voteStatusText}>
            You voted for: {eligibleTargets.find(p => p.id === currentVote)?.username}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
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