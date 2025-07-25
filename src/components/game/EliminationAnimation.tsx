import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Player } from '../../types/game';

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
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [slideAnim] = useState(new Animated.Value(50));
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && eliminatedPlayer) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hold for 2 seconds, then start exit animation
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onAnimationComplete();
            // Reset animations for next use
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.5);
            slideAnim.setValue(50);
            rotateAnim.setValue(0);
          });
        }, 2000);
      });
    }
  }, [visible, eliminatedPlayer, fadeAnim, scaleAnim, slideAnim, rotateAnim, onAnimationComplete]);

  if (!visible || !eliminatedPlayer) {
    return null;
  }

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
      >
        {/* Elimination Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.eliminationIcon}>{getEliminationIcon()}</Text>
          <View style={styles.crossOut}>
            <Text style={styles.crossOutText}>✗</Text>
          </View>
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
        <View style={styles.dramaticEffect}>
          <Text style={styles.dramaticText}>ELIMINATED</Text>
        </View>
      </Animated.View>

      {/* Background particles effect */}
      <View style={styles.particlesContainer}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (index % 2 === 0 ? 1 : -1) * (50 + index * 20)],
                    }),
                  },
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -100 - index * 30],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: width * 0.8,
    borderWidth: 3,
    borderColor: '#ef4444',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
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
  },
  crossOutText: {
    fontSize: 48,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerRole: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eliminationMessage: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  dramaticEffect: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    transform: [{ rotate: '-5deg' }],
  },
  dramaticText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
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
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    top: height / 2,
    left: width / 2,
  },
});