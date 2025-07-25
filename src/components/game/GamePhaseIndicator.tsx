import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { GamePhase } from '../../types/game';

interface GamePhaseIndicatorProps {
  phase: GamePhase;
  timeRemaining: number;
  dayNumber?: number;
  animated?: boolean;
}

export const GamePhaseIndicator: React.FC<GamePhaseIndicatorProps> = ({
  phase,
  timeRemaining,
  dayNumber = 1,
  animated = true,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (animated) {
      // Pulse animation for urgent phases
      if (timeRemaining <= 10 && (phase === 'voting' || phase === 'night')) {
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        );
        pulse.start();
        return () => pulse.stop();
      } else {
        pulseAnim.setValue(1);
      }
    }
  }, [timeRemaining, phase, animated, pulseAnim]);

  const getPhaseInfo = () => {
    switch (phase) {
      case 'lobby':
        return {
          title: 'Waiting for Players',
          subtitle: 'Game will start soon',
          color: '#6366f1',
          icon: '⏳',
        };
      case 'day':
        return {
          title: `Day ${dayNumber}`,
          subtitle: 'Discussion Phase',
          color: '#f59e0b',
          icon: '☀️',
        };
      case 'night':
        return {
          title: `Night ${dayNumber}`,
          subtitle: 'Mafia Phase',
          color: '#1f2937',
          icon: '🌙',
        };
      case 'voting':
        return {
          title: 'Voting Time',
          subtitle: 'Cast your votes',
          color: '#ef4444',
          icon: '🗳️',
        };
      case 'results':
        return {
          title: 'Game Over',
          subtitle: 'Final Results',
          color: '#10b981',
          icon: '🏆',
        };
      default:
        return {
          title: 'Unknown Phase',
          subtitle: '',
          color: '#6b7280',
          icon: '❓',
        };
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 10) return '#ef4444';
    if (timeRemaining <= 30) return '#f59e0b';
    return '#ffffff';
  };

  const getProgressWidth = () => {
    // Assuming max phase time is 300 seconds (5 minutes)
    const maxTime = 300;
    const progress = Math.max(0, Math.min(1, timeRemaining / maxTime));
    return `${progress * 100}%`;
  };

  const phaseInfo = getPhaseInfo();

  return (
    <Animated.View 
      style={[
        styles.container,
        { backgroundColor: phaseInfo.color },
        animated && { transform: [{ scale: pulseAnim }] }
      ]}
    >
      {/* Phase Header */}
      <View style={styles.header}>
        <View style={styles.phaseInfo}>
          <Text style={styles.icon}>{phaseInfo.icon}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{phaseInfo.title}</Text>
            <Text style={styles.subtitle}>{phaseInfo.subtitle}</Text>
          </View>
        </View>

        {/* Timer */}
        {phase !== 'lobby' && phase !== 'results' && timeRemaining > 0 && (
          <View style={styles.timerContainer}>
            <Text style={[styles.timer, { color: getTimerColor() }]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      {phase !== 'lobby' && phase !== 'results' && timeRemaining > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBar,
                { 
                  width: getProgressWidth(),
                  backgroundColor: getTimerColor(),
                }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Phase-specific indicators */}
      {phase === 'night' && (
        <View style={styles.nightIndicator}>
          <Text style={styles.nightText}>🤫 Mafia is choosing their target...</Text>
        </View>
      )}

      {phase === 'voting' && (
        <View style={styles.votingIndicator}>
          <Text style={styles.votingText}>⚡ Time to vote! Choose wisely...</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  timerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  nightIndicator: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
  },
  nightText: {
    color: '#ffffff',
    fontSize: 12,
    fontStyle: 'italic',
  },
  votingIndicator: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
  },
  votingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});