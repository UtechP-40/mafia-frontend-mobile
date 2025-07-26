import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  withDelay,
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

interface AnimatedPlayerCardProps {
  player: {
    id: string;
    username: string;
    avatar?: string;
    role?: string;
    isAlive: boolean;
    isHost?: boolean;
  };
  isSelected?: boolean;
  isVoting?: boolean;
  hasVoted?: boolean;
  isEliminated?: boolean;
  showRole?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  animationDelay?: number;
}

export const AnimatedPlayerCard: React.FC<AnimatedPlayerCardProps> = ({
  player,
  isSelected = false,
  isVoting = false,
  hasVoted = false,
  isEliminated = false,
  showRole = false,
  onPress,
  onLongPress,
  style,
  animationDelay = 0,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotateY = useSharedValue(0);
  const borderWidth = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  // Handle selection animation
  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(SCALE_VALUES.CARD_SELECTION, SPRING_CONFIGS.BOUNCY);
      borderWidth.value = withTiming(3, {
        duration: ANIMATION_DURATIONS.CARD_SELECTION,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    } else {
      scale.value = withSpring(1, SPRING_CONFIGS.GENTLE);
      borderWidth.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.CARD_SELECTION,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    }
  }, [isSelected]);

  // Handle voting animation
  useEffect(() => {
    if (isVoting) {
      borderWidth.value = withTiming(2, {
        duration: ANIMATION_DURATIONS.VOTE_FEEDBACK,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    } else if (hasVoted) {
      borderWidth.value = withTiming(1, {
        duration: ANIMATION_DURATIONS.VOTE_FEEDBACK,
        easing: EASING_FUNCTIONS.EASE_OUT,
      });
    }
  }, [isVoting, hasVoted]);

  // Handle elimination animation
  useEffect(() => {
    if (isEliminated) {
      // Dramatic elimination sequence
      scale.value = withSequence(
        withSpring(SCALE_VALUES.ELIMINATION_ENTRANCE, SPRING_CONFIGS.BOUNCY),
        withDelay(ANIMATION_DURATIONS.ELIMINATION_HOLD, 
          withSpring(SCALE_VALUES.ELIMINATION_EXIT, SPRING_CONFIGS.SMOOTH)
        )
      );
      
      opacity.value = withSequence(
        withTiming(OPACITY_VALUES.VISIBLE, {
          duration: ANIMATION_DURATIONS.ELIMINATION_ENTRANCE,
          easing: EASING_FUNCTIONS.EASE_OUT,
        }),
        withDelay(ANIMATION_DURATIONS.ELIMINATION_HOLD,
          withTiming(OPACITY_VALUES.DISABLED, {
            duration: ANIMATION_DURATIONS.ELIMINATION_EXIT,
            easing: EASING_FUNCTIONS.EASE_IN,
          })
        )
      );

      // Subtle shake effect
      rotateZ.value = withSequence(
        withTiming(2, { duration: 100 }),
        withTiming(-2, { duration: 100 }),
        withTiming(2, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }
  }, [isEliminated]);

  // Role reveal animation
  const animateRoleReveal = useCallback((onMidpoint?: () => void) => {
    rotateY.value = withSequence(
      withTiming(90, {
        duration: ANIMATION_DURATIONS.CARD_FLIP / 2,
        easing: EASING_FUNCTIONS.EASE_IN,
      }, onMidpoint ? runOnJS(onMidpoint) : undefined),
      withTiming(0, {
        duration: ANIMATION_DURATIONS.CARD_FLIP / 2,
        easing: EASING_FUNCTIONS.EASE_OUT,
      })
    );
  }, [rotateY]);

  // Entrance animation with delay
  useEffect(() => {
    if (animationDelay > 0) {
      opacity.value = 0;
      translateY.value = 20;
      scale.value = 0.9;

      opacity.value = withDelay(animationDelay, 
        withTiming(OPACITY_VALUES.VISIBLE, {
          duration: ANIMATION_DURATIONS.SCREEN_TRANSITION,
          easing: EASING_FUNCTIONS.EASE_OUT,
        })
      );

      translateY.value = withDelay(animationDelay,
        withSpring(0, SPRING_CONFIGS.GENTLE)
      );

      scale.value = withDelay(animationDelay,
        withSpring(1, SPRING_CONFIGS.GENTLE)
      );
    }
  }, [animationDelay]);

  // Press animation
  const handlePressIn = useCallback(() => {
    if (!onPress || isEliminated) return;
    
    scale.value = withTiming(SCALE_VALUES.BUTTON_PRESS, {
      duration: ANIMATION_DURATIONS.BUTTON_PRESS,
      easing: EASING_FUNCTIONS.EASE_OUT,
    });
  }, [onPress, isEliminated]);

  const handlePressOut = useCallback(() => {
    if (!onPress || isEliminated) return;
    
    scale.value = withSpring(isSelected ? SCALE_VALUES.CARD_SELECTION : 1, SPRING_CONFIGS.SNAPPY);
  }, [onPress, isEliminated, isSelected]);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = isVoting 
      ? COLOR_VALUES.VOTING_BORDER 
      : isSelected 
        ? COLOR_VALUES.SELECTION_BORDER 
        : isEliminated 
          ? COLOR_VALUES.ELIMINATION_BORDER 
          : 'transparent';

    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { rotateY: `${rotateY.value}deg` },
        { rotateZ: `${rotateZ.value}deg` },
      ],
      opacity: opacity.value,
      borderWidth: borderWidth.value,
      borderColor,
    };
  });

  const roleTextAnimatedStyle = useAnimatedStyle(() => {
    const rotationProgress = interpolate(
      rotateY.value,
      [0, 90, 180],
      [0, 1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: showRole ? rotationProgress : 0,
    };
  });

  const usernameAnimatedStyle = useAnimatedStyle(() => {
    const rotationProgress = interpolate(
      rotateY.value,
      [0, 90, 180],
      [1, 0, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity: rotationProgress,
    };
  });

  return (
    <Animated.View
      style={[styles.card, cardAnimatedStyle, style]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {player.avatar ? (
          <Image source={{ uri: player.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {player.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Host indicator */}
        {player.isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostText}>👑</Text>
          </View>
        )}
      </View>

      {/* Username */}
      <Animated.Text style={[styles.username, usernameAnimatedStyle]}>
        {player.username}
      </Animated.Text>

      {/* Role (shown during flip animation) */}
      <Animated.Text style={[styles.role, roleTextAnimatedStyle]}>
        {player.role || 'Unknown'}
      </Animated.Text>

      {/* Status indicators */}
      <View style={styles.statusContainer}>
        {hasVoted && !isEliminated && (
          <View style={styles.votedIndicator}>
            <Text style={styles.votedText}>✓</Text>
          </View>
        )}
        
        {isEliminated && (
          <View style={styles.eliminatedOverlay}>
            <Text style={styles.eliminatedText}>💀</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  defaultAvatar: {
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  hostBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  hostText: {
    fontSize: 10,
  },
  
  username: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  
  role: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    position: 'absolute',
    bottom: 20,
  },
  
  statusContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  
  votedIndicator: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  votedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  eliminatedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  
  eliminatedText: {
    fontSize: 24,
  },
});