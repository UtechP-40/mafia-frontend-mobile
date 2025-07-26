import React, { useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';
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
  Extrapolate,
  Easing
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  EASING_FUNCTIONS,
  SPRING_CONFIGS,
  SCALE_VALUES,
  OPACITY_VALUES,
  TRANSFORM_VALUES
} from '../AnimationConfig';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EliminationAnimationProps {
  children: React.ReactNode;
  playerName?: string;
  role?: string;
  eliminationType?: 'voted' | 'killed' | 'lynched';
  isVisible?: boolean;
  style?: ViewStyle;
  onAnimationStart?: () => void;
  onAnimationMidpoint?: () => void;
  onAnimationComplete?: () => void;
}

export interface EliminationAnimationRef {
  startElimination: () => void;
  resetAnimation: () => void;
}

export const EliminationAnimation = forwardRef<EliminationAnimationRef, EliminationAnimationProps>(({
  children,
  playerName,
  role,
  eliminationType = 'voted',
  isVisible = false,
  style,
  onAnimationStart,
  onAnimationMidpoint,
  onAnimationComplete,
}, ref) => {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotateZ = useSharedValue(0);
  const translateY = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const textScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const particleScale = useSharedValue(0);
  const particleOpacity = useSharedValue(0);

  // Get elimination message based on type
  const getEliminationMessage = useCallback(() => {
    switch (eliminationType) {
      case 'voted':
        return `${playerName} was voted out!`;
      case 'killed':
        return `${playerName} was eliminated!`;
      case 'lynched':
        return `${playerName} was lynched!`;
      default:
        return `${playerName} is out!`;
    }
  }, [playerName, eliminationType]);

  // Get elimination emoji based on type
  const getEliminationEmoji = useCallback(() => {
    switch (eliminationType) {
      case 'voted':
        return '🗳️';
      case 'killed':
        return '💀';
      case 'lynched':
        return '⚖️';
      default:
        return '❌';
    }
  }, [eliminationType]);

  // Start elimination animation sequence
  const startElimination = useCallback(() => {
    onAnimationStart?.();

    // Phase 1: Dramatic entrance with shake
    scale.value = withSequence(
      withSpring(SCALE_VALUES.ELIMINATION_ENTRANCE, SPRING_CONFIGS.BOUNCY),
      withDelay(500, withSpring(1, SPRING_CONFIGS.GENTLE))
    );

    // Shake effect
    rotateZ.value = withSequence(
      withTiming(3, { duration: 100, easing: EASING_FUNCTIONS.EASE_OUT }),
      withTiming(-3, { duration: 100, easing: EASING_FUNCTIONS.EASE_OUT }),
      withTiming(3, { duration: 100, easing: EASING_FUNCTIONS.EASE_OUT }),
      withTiming(-3, { duration: 100, easing: EASING_FUNCTIONS.EASE_OUT }),
      withTiming(0, { duration: 100, easing: EASING_FUNCTIONS.EASE_OUT })
    );

    // Phase 2: Show overlay and text
    overlayOpacity.value = withDelay(300, 
      withTiming(0.8, {
        duration: ANIMATION_DURATIONS.ELIMINATION_ENTRANCE,
        easing: EASING_FUNCTIONS.EASE_OUT,
      })
    );

    textScale.value = withDelay(500,
      withSpring(1, SPRING_CONFIGS.BOUNCY, onAnimationMidpoint ? runOnJS(onAnimationMidpoint) : undefined)
    );

    textOpacity.value = withDelay(500,
      withTiming(1, {
        duration: ANIMATION_DURATIONS.ELIMINATION_ENTRANCE,
        easing: EASING_FUNCTIONS.EASE_OUT,
      })
    );

    // Phase 3: Particle effects
    particleScale.value = withDelay(800,
      withSequence(
        withSpring(1.2, SPRING_CONFIGS.BOUNCY),
        withSpring(0, SPRING_CONFIGS.GENTLE)
      )
    );

    particleOpacity.value = withDelay(800,
      withSequence(
        withTiming(1, { duration: 300, easing: EASING_FUNCTIONS.EASE_OUT }),
        withDelay(1000, withTiming(0, { duration: 500, easing: EASING_FUNCTIONS.EASE_IN }))
      )
    );

    // Phase 4: Final fade out
    setTimeout(() => {
      opacity.value = withTiming(OPACITY_VALUES.DISABLED, {
        duration: ANIMATION_DURATIONS.ELIMINATION_EXIT,
        easing: EASING_FUNCTIONS.EASE_IN,
      });

      scale.value = withTiming(SCALE_VALUES.ELIMINATION_EXIT, {
        duration: ANIMATION_DURATIONS.ELIMINATION_EXIT,
        easing: EASING_FUNCTIONS.EASE_IN,
      });

      translateY.value = withTiming(20, {
        duration: ANIMATION_DURATIONS.ELIMINATION_EXIT,
        easing: EASING_FUNCTIONS.EASE_IN,
      }, onAnimationComplete ? runOnJS(onAnimationComplete) : undefined);

      overlayOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.ELIMINATION_EXIT,
        easing: EASING_FUNCTIONS.EASE_IN,
      });

      textOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATIONS.ELIMINATION_EXIT,
        easing: EASING_FUNCTIONS.EASE_IN,
      });
    }, ANIMATION_DURATIONS.ELIMINATION_HOLD);
  }, [onAnimationStart, onAnimationMidpoint, onAnimationComplete]);

  // Reset animation to initial state
  const resetAnimation = useCallback(() => {
    scale.value = 1;
    opacity.value = 1;
    rotateZ.value = 0;
    translateY.value = 0;
    overlayOpacity.value = 0;
    textScale.value = 0;
    textOpacity.value = 0;
    particleScale.value = 0;
    particleOpacity.value = 0;
  }, []);

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      startElimination();
    } else {
      resetAnimation();
    }
  }, [isVisible, startElimination, resetAnimation]);

  useImperativeHandle(ref, () => ({
    startElimination,
    resetAnimation,
  }));

  // Main content animated style
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotateZ.value}deg` },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  // Overlay animated style
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // Text animated style
  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: textOpacity.value,
  }));

  // Particle effects animated style
  const particleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: particleScale.value }],
    opacity: particleOpacity.value,
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Main content */}
      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        {children}
      </Animated.View>

      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]} pointerEvents="none">
        {/* Elimination text */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.emoji}>{getEliminationEmoji()}</Text>
          <Text style={styles.eliminationText}>{getEliminationMessage()}</Text>
          {role && (
            <Text style={styles.roleText}>They were a {role}</Text>
          )}
        </Animated.View>

        {/* Particle effects */}
        <Animated.View style={[styles.particleContainer, particleAnimatedStyle]}>
          {Array.from({ length: 8 }).map((_, index) => (
            <ParticleEffect key={index} index={index} />
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
});

// Individual particle component
const ParticleEffect: React.FC<{ index: number }> = ({ index }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const angle = (index / 8) * 2 * Math.PI;
    const distance = 50 + Math.random() * 30;
    
    translateX.value = withTiming(Math.cos(angle) * distance, {
      duration: 1000 + Math.random() * 500,
      easing: EASING_FUNCTIONS.EASE_OUT,
    });
    
    translateY.value = withTiming(Math.sin(angle) * distance, {
      duration: 1000 + Math.random() * 500,
      easing: EASING_FUNCTIONS.EASE_OUT,
    });
    
    opacity.value = withSequence(
      withDelay(Math.random() * 200, withTiming(1, { duration: 200 })),
      withDelay(500, withTiming(0, { duration: 800 }))
    );
    
    scale.value = withSequence(
      withTiming(1.2, { duration: 300, easing: EASING_FUNCTIONS.EASE_OUT }),
      withTiming(0, { duration: 700, easing: EASING_FUNCTIONS.EASE_IN })
    );
  }, [index]);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, particleStyle]}>
      <Text style={styles.particleText}>💥</Text>
    </Animated.View>
  );
};

EliminationAnimation.displayName = 'EliminationAnimation';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  
  content: {
    position: 'relative',
    zIndex: 1,
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderRadius: 12,
  },
  
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  
  eliminationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  roleText: {
    fontSize: 14,
    color: '#e5e7eb',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  particleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 1,
    height: 1,
  },
  
  particle: {
    position: 'absolute',
    top: -12,
    left: -12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  particleText: {
    fontSize: 16,
  },
});