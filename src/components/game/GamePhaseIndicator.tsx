import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { GamePhase } from '../../types/game';
import { 
  ANIMATION_CONFIG,
  createPulseAnimation,
  createCountdownAnimation
} from '../../utils/animations';

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
  // Animation values
  const phaseTransition = useSharedValue(0);
  const shouldPulse = useSharedValue(false);
  const progressValue = useSharedValue(1);
  const timerScale = useSharedValue(1);

  useEffect(() => {
    // Trigger phase transition animation
    phaseTransition.value = withSequence(
      withTiming(0.8, ANIMATION_CONFIG.timing.fast),
      withSpring(1, ANIMATION_CONFIG.spring.bouncy)
    );

    // Update pulse animation for urgent phases
    shouldPulse.value = timeRemaining <= 10 && (phase === 'voting' || phase === 'night');
    
    // Update progress
    const maxTime = getMaxTimeForPhase(phase);
    progressValue.value = withTiming(
      Math.max(0, Math.min(1, timeRemaining / maxTime)),
      ANIMATION_CONFIG.timing.medium
    );

    // Timer urgency animation
    if (timeRemaining <= 10) {
      timerScale.value = withRepeat(
        withSequence(
          withTiming(1.1, ANIMATION_CONFIG.timing.fast),
          withTiming(1, ANIMATION_CONFIG.timing.fast)
        ),
        -1,
        true
      );
    } else {
      timerScale.value = withTiming(1, ANIMATION_CONFIG.timing.fast);
    }
  }, [phase, timeRemaining, phaseTransition, shouldPulse, progressValue, timerScale]);

  const getMaxTimeForPhase = (currentPhase: GamePhase) => {
    switch (currentPhase) {
      case 'day':
        return 300; // 5 minutes
      case 'night':
        return 120; // 2 minutes
      case 'voting':
        return 60; // 1 minute
      default:
        return 300;
    }
  };

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

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    if (!animated) return {};

    const baseStyle = {
      transform: [{ scale: phaseTransition.value }],
    };

    if (shouldPulse.value) {
      return {
        ...baseStyle,
        ...createPulseAnimation(shouldPulse, 1.02),
      };
    }

    return baseStyle;
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    if (!animated) return {};

    const width = interpolate(
      progressValue.value,
      [0, 1],
      [0, 100],
      Extrapolate.CLAMP
    );

    return {
      width: `${width}%`,
    };
  });

  const animatedTimerStyle = useAnimatedStyle(() => {
    if (!animated) return {};

    return {
      transform: [{ scale: timerScale.value }],
      color: getTimerColor(),
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    if (!animated) return {};

    // Rotate icon based on phase
    const rotation = interpolate(
      phaseTransition.value,
      [0, 1],
      [0, phase === 'night' ? 360 : 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { rotate: `${rotation}deg` },
        { scale: phaseTransition.value },
      ],
    };
  });

  const animatedSpecialIndicatorStyle = useAnimatedStyle(() => {
    if (!animated) return {};

    return {
      opacity: withTiming(
        (phase === 'night' || phase === 'voting') ? 1 : 0,
        ANIMATION_CONFIG.timing.medium
      ),
      transform: [
        {
          translateY: withSpring(
            (phase === 'night' || phase === 'voting') ? 0 : 10,
            ANIMATION_CONFIG.spring.gentle
          ),
        },
      ],
    };
  });

  const phaseInfo = getPhaseInfo();

  return (
    <Animated.View 
      style={[
        styles.container,
        { backgroundColor: phaseInfo.color },
        animatedContainerStyle,
      ]}
    >
      {/* Phase Header */}
      <View style={styles.header}>
        <View style={styles.phaseInfo}>
          <Animated.Text style={[styles.icon, animatedIconStyle]}>
            {phaseInfo.icon}
          </Animated.Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{phaseInfo.title}</Text>
            <Text style={styles.subtitle}>{phaseInfo.subtitle}</Text>
          </View>
        </View>

        {/* Timer */}
        {phase !== 'lobby' && phase !== 'results' && timeRemaining > 0 && (
          <View style={styles.timerContainer}>
            <Animated.Text style={[styles.timer, animatedTimerStyle]}>
              {formatTime(timeRemaining)}
            </Animated.Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      {phase !== 'lobby' && phase !== 'results' && timeRemaining > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBar,
                { backgroundColor: getTimerColor() },
                animatedProgressStyle,
              ]} 
            />
          </View>
        </View>
      )}

      {/* Phase-specific indicators */}
      <Animated.View style={[animatedSpecialIndicatorStyle]}>
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