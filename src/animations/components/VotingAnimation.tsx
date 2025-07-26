import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  EASING_FUNCTIONS,
  SPRING_CONFIGS,
  SCALE_VALUES,
  OPACITY_VALUES,
  COLOR_VALUES
} from '../AnimationConfig';

interface VotingAnimationProps {
  children: React.ReactNode;
  isVoting?: boolean;
  hasVoted?: boolean;
  isSelected?: boolean;
  voteCount?: number;
  maxVotes?: number;
  showPulse?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  onVoteComplete?: () => void;
}

export const VotingAnimation: React.FC<VotingAnimationProps> = ({
  children,
  isVoting = false,
  hasVoted = false,
  isSelected = false,
  voteCount = 0,
  maxVotes = 1,
  showPulse = false,
  disabled = false,
  style,
  onVoteComplete,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const borderWidth = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const voteProgress = useSharedValue(0);

  // Handle voting state changes
  useEffect(() => {
    if (isVoting && !disabled) {
      // Voting in progress - show active state
      scale.value = withSpring(SCALE_VALUES.CARD_SELECTION, SPRING_CONFIGS.BOUNCY);
      borderWidth.value = withTiming(3, {
        duration: ANIMATION_DURATIONS.VOTE_FEEDBACK,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
      glowOpacity.value = withTiming(0.6, {
        duration: ANIMATION_DURATIONS.VOTE_FEEDBACK,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    } else if (hasVoted) {
      // Vote completed - show confirmation
      scale.value = withSequence(
        withSpring(1.1, SPRING_CONFIGS.BOUNCY),
        withSpring(1, SPRING_CONFIGS.GENTLE)
      );
      borderWidth.value = withTiming(2, {
        duration: ANIMATION_DURATIONS.VOTE_RESULT,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
      glowOpacity.value = withTiming(0.3, {
        duration: ANIMATION_DURATIONS.VOTE_RESULT,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
      
      if (onVoteComplete) {
        runOnJS(onVoteComplete)();
      }
    } else {
      // Reset to default state
      scale.value = withSpring(1, SPRING_CONFIGS.GENTLE);
      borderWidth.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.VOTE_FEEDBACK,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
      glowOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.VOTE_FEEDBACK,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    }
  }, [isVoting, hasVoted, disabled, onVoteComplete]);

  // Handle selection state
  useEffect(() => {
    if (isSelected && !disabled) {
      borderWidth.value = withTiming(2, {
        duration: ANIMATION_DURATIONS.CARD_SELECTION,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    }
  }, [isSelected, disabled]);

  // Handle pulse animation
  useEffect(() => {
    if (showPulse && !disabled) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, {
            duration: ANIMATION_DURATIONS.HOVER_FEEDBACK,
            easing: EASING_FUNCTIONS.EASE_OUT,
          }),
          withTiming(1, {
            duration: ANIMATION_DURATIONS.HOVER_FEEDBACK,
            easing: EASING_FUNCTIONS.EASE_OUT,
          })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, {
        duration: ANIMATION_DURATIONS.HOVER_FEEDBACK,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    }
  }, [showPulse, disabled]);

  // Handle vote progress animation
  useEffect(() => {
    const progress = maxVotes > 0 ? voteCount / maxVotes : 0;
    voteProgress.value = withTiming(progress, {
      duration: ANIMATION_DURATIONS.VOTE_RESULT,
      easing: EASING_FUNCTIONS.EASE_OUT,
    });
  }, [voteCount, maxVotes]);

  // Handle disabled state
  useEffect(() => {
    if (disabled) {
      opacity.value = withTiming(OPACITY_VALUES.DISABLED, {
        duration: ANIMATION_DURATIONS.SCREEN_TRANSITION,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
      scale.value = withSpring(1, SPRING_CONFIGS.GENTLE);
      borderWidth.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.SCREEN_TRANSITION,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
      glowOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.SCREEN_TRANSITION,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    } else {
      opacity.value = withTiming(OPACITY_VALUES.VISIBLE, {
        duration: ANIMATION_DURATIONS.SCREEN_TRANSITION,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    }
  }, [disabled]);

  // Main container animated style
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = isVoting 
      ? COLOR_VALUES.VOTING_BORDER 
      : hasVoted 
        ? COLOR_VALUES.SUCCESS_COLOR 
        : isSelected 
          ? COLOR_VALUES.SELECTION_BORDER 
          : 'transparent';

    return {
      transform: [
        { scale: scale.value * pulseScale.value },
      ],
      opacity: opacity.value,
      borderWidth: borderWidth.value,
      borderColor,
    };
  });

  // Glow effect animated style
  const glowAnimatedStyle = useAnimatedStyle(() => {
    const glowColor = isVoting 
      ? COLOR_VALUES.VOTING_BORDER 
      : hasVoted 
        ? COLOR_VALUES.SUCCESS_COLOR 
        : COLOR_VALUES.SELECTION_BORDER;

    return {
      opacity: glowOpacity.value,
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: glowOpacity.value,
      shadowRadius: 8,
      elevation: glowOpacity.value * 10,
    };
  });

  // Vote progress bar animated style
  const progressBarStyle = useAnimatedStyle(() => {
    const width = interpolate(
      voteProgress.value,
      [0, 1],
      [0, 100],
      Extrapolate.CLAMP
    );

    const backgroundColor = interpolate(
      voteProgress.value,
      [0, 0.5, 1],
      [0x10b981, 0xf59e0b, 0xef4444], // Green -> Orange -> Red
      Extrapolate.CLAMP
    );

    return {
      width: `${width}%`,
      backgroundColor,
      opacity: voteCount > 0 ? 1 : 0,
    };
  });

  return (
    <View style={[styles.container, style]}>
      {/* Glow effect */}
      <Animated.View style={[styles.glow, glowAnimatedStyle]} />
      
      {/* Main content */}
      <Animated.View style={[styles.content, containerAnimatedStyle]}>
        {children}
        
        {/* Vote progress indicator */}
        {maxVotes > 1 && (
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, progressBarStyle]} />
            <View style={styles.progressBackground} />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    zIndex: 0,
  },
  
  content: {
    position: 'relative',
    zIndex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    flexDirection: 'row',
  },
  
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 1.5,
  },
});