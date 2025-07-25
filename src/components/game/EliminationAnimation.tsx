import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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
import { Player } from '../../types/game';
import { ANIMATION_CONFIG } from '../../utils/animations';

interface EliminationAnimationProps {
  eliminatedPlayer: Player | null;
  onAnimationComplete: () => void;
  visible: boolean;
}

export const EliminationAnimation: React.FC<EliminationAnimationProps> = ({
  eliminatedPlayer,
  onAnimationComplete,
  visible,
}) => {
  // Animation values using Reanimated
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.5);
  const slideAnim = useSharedValue(50);
  const rotateAnim = useSharedValue(0);
  const shakeAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (visible && eliminatedPlayer) {
      // Reset values
      fadeAnim.value = 0;
      scaleAnim.value = 0.5;
      slideAnim.value = 50;
      rotateAnim.value = 0;
      shakeAnim.value = 0;
      pulseAnim.value = 1;

      // Start dramatic entrance animation
      fadeAnim.value = withTiming(1, ANIMATION_CONFIG.timing.dramatic);
      scaleAnim.value = withSequence(
        withSpring(1.2, ANIMATION_CONFIG.spring.bouncy),
        withSpring(1, ANIMATION_CONFIG.spring.gentle)
      );
      slideAnim.value = withSpring(0, ANIMATION_CONFIG.spring.bouncy);
      
      // Add shake effect for drama
      shakeAnim.value = withSequence(
        withDelay(200, withTiming(10, { duration: 50 })),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Pulse effect for the dramatic text
      pulseAnim.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(1.1, ANIMATION_CONFIG.timing.fast),
            withTiming(1, ANIMATION_CONFIG.timing.fast)
          ),
          3,
          true
        )
      );

      // Hold for 3 seconds, then start exit animation
      const exitAnimation = () => {
        fadeAnim.value = withTiming(0, ANIMATION_CONFIG.timing.slow);
        scaleAnim.value = withTiming(0.8, ANIMATION_CONFIG.timing.slow);
        rotateAnim.value = withTiming(360, ANIMATION_CONFIG.timing.dramatic, (finished) => {
          if (finished) {
            runOnJS(onAnimationComplete)();
          }
        });
      };

      setTimeout(exitAnimation, 3000);
    }
  }, [visible, eliminatedPlayer, fadeAnim, scaleAnim, slideAnim, rotateAnim, shakeAnim, pulseAnim, onAnimationComplete]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [
        { scale: scaleAnim.value },
        { translateY: slideAnim.value },
        { translateX: shakeAnim.value },
        { rotate: `${rotateAnim.value}deg` },
      ],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          rotate: interpolate(
            rotateAnim.value,
            [0, 360],
            [0, -360],
            Extrapolate.CLAMP
          ) + 'deg'
        },
        { scale: pulseAnim.value },
      ],
    };
  });

  const animatedCrossOutStyle = useAnimatedStyle(() => {
    return {
      opacity: withDelay(300, withTiming(1, ANIMATION_CONFIG.timing.medium)),
      transform: [
        { 
          scale: withDelay(
            300, 
            withSequence(
              withSpring(1.5, ANIMATION_CONFIG.spring.bouncy),
              withSpring(1, ANIMATION_CONFIG.spring.gentle)
            )
          )
        },
      ],
    };
  });

  const animatedDramaticTextStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: pulseAnim.value },
        { rotate: '-5deg' },
      ],
    };
  });

  const animatedParticleStyle = (index: number) => useAnimatedStyle(() => {
    const delay = index * 100;
    const direction = index % 2 === 0 ? 1 : -1;
    
    return {
      opacity: withDelay(delay, fadeAnim.value),
      transform: [
        {
          translateX: withDelay(
            delay,
            withTiming(direction * (50 + index * 20), ANIMATION_CONFIG.timing.slow)
          ),
        },
        {
          translateY: withDelay(
            delay,
            withTiming(-100 - index * 30, ANIMATION_CONFIG.timing.slow)
          ),
        },
        {
          rotate: withDelay(
            delay,
            withTiming(`${direction * 360}deg`, ANIMATION_CONFIG.timing.slow)
          ),
        },
      ],
    };
  });

  if (!visible || !eliminatedPlayer) {
    return null;
  }

  const getEliminationMessage = () => {
    if (eliminatedPlayer.role === 'mafia') {
      return 'A Mafia member has been eliminated!';
    }
    return `${eliminatedPlayer.username} has been eliminated!`;
  };

  const getEliminationIcon = () => {
    switch (eliminatedPlayer.role) {
      case 'mafia':
        return '💀';
      case 'detective':
        return '🔍';
      case 'doctor':
        return '⚕️';
      case 'mayor':
        return '🏛️';
      case 'villager':
      default:
        return '👤';
    }
  };

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        {/* Elimination Icon */}
        <View style={styles.iconContainer}>
          <Animated.Text style={[styles.eliminationIcon, animatedIconStyle]}>
            {getEliminationIcon()}
          </Animated.Text>
          <Animated.View style={[styles.crossOut, animatedCrossOutStyle]}>
            <Text style={styles.crossOutText}>✗</Text>
          </Animated.View>
        </View>

        {/* Player Info */}
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{eliminatedPlayer.username}</Text>
          {eliminatedPlayer.role && (
            <Text style={styles.playerRole}>
              was a {eliminatedPlayer.role.toUpperCase()}
            </Text>
          )}
        </View>

        {/* Elimination Message */}
        <Text style={styles.eliminationMessage}>
          {getEliminationMessage()}
        </Text>

        {/* Dramatic Effect */}
        <Animated.View style={[styles.dramaticEffect, animatedDramaticTextStyle]}>
          <Text style={styles.dramaticText}>ELIMINATED</Text>
        </Animated.View>
      </Animated.View>

      {/* Background particles effect */}
      <View style={styles.particlesContainer}>
        {[...Array(8)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                backgroundColor: index % 2 === 0 ? '#ef4444' : '#f59e0b',
              },
              animatedParticleStyle(index),
            ]}
          />
        ))}
      </View>

      {/* Screen flash effect */}
      <Animated.View 
        style={[
          styles.flashOverlay,
          {
            opacity: withSequence(
              withDelay(100, withTiming(0.3, { duration: 100 })),
              withTiming(0, { duration: 200 })
            ),
          },
        ]}
      />
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: width * 0.85,
    borderWidth: 3,
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eliminationIcon: {
    fontSize: 64,
  },
  crossOut: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  crossOutText: {
    fontSize: 60,
    color: '#ef4444',
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playerRole: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  eliminationMessage: {
    color: '#ffffff',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
    fontWeight: '500',
  },
  dramaticEffect: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  dramaticText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 3,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: height / 2,
    left: width / 2,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    pointerEvents: 'none',
  },
});