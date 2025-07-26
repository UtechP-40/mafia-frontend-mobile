import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { PlayerAchievement, AchievementRarity } from '../../types/game';

interface AchievementNotificationProps {
  achievement: PlayerAchievement;
  onDismiss: () => void;
  duration?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onDismiss,
  duration = 4000
}) => {
  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const glowIntensity = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);

  const achievementData = achievement.achievementId;

  useEffect(() => {
    // Entrance animation
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    
    // Glow effect
    glowIntensity.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0.5, { duration: 500 }),
      withTiming(1, { duration: 500 }),
      withTiming(0.3, { duration: 1000 })
    );
    
    // Sparkle rotation
    sparkleRotation.value = withSequence(
      withTiming(360, { duration: 2000 }),
      withTiming(720, { duration: 2000 })
    );

    // Auto dismiss
    const timer = setTimeout(() => {
      // Exit animation
      translateY.value = withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
      
      // Call onDismiss after animation
      setTimeout(() => {
        runOnJS(onDismiss)();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [
    achievement,
    duration,
    onDismiss,
    translateY,
    opacity,
    scale,
    glowIntensity,
    sparkleRotation
  ]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: interpolate(
        glowIntensity.value,
        [0, 1],
        [0, 0.8],
        Extrapolate.CLAMP
      ),
      shadowRadius: interpolate(
        glowIntensity.value,
        [0, 1],
        [0, 25],
        Extrapolate.CLAMP
      ),
    };
  });

  const animatedSparkleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${sparkleRotation.value}deg` }],
    };
  });

  // Get rarity color and effects
  const getRarityColor = (rarity: AchievementRarity) => {
    switch (rarity) {
      case 'common':
        return '#9ca3af';
      case 'rare':
        return '#3b82f6';
      case 'epic':
        return '#8b5cf6';
      case 'legendary':
        return '#f59e0b';
      default:
        return '#9ca3af';
    }
  };

  const getRarityGradient = (rarity: AchievementRarity) => {
    switch (rarity) {
      case 'common':
        return ['#9ca3af', '#6b7280'];
      case 'rare':
        return ['#3b82f6', '#1d4ed8'];
      case 'epic':
        return ['#8b5cf6', '#7c3aed'];
      case 'legendary':
        return ['#f59e0b', '#d97706'];
      default:
        return ['#9ca3af', '#6b7280'];
    }
  };

  const rarityColor = getRarityColor(achievementData.rarity);
  const [gradientStart, gradientEnd] = getRarityGradient(achievementData.rarity);

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          borderColor: rarityColor,
          shadowColor: rarityColor,
        },
        animatedContainerStyle,
        animatedGlowStyle
      ]}
    >
      {/* Background Gradient Effect */}
      <View style={[
        styles.backgroundGradient,
        { 
          backgroundColor: gradientStart,
          opacity: 0.1 
        }
      ]} />
      
      {/* Sparkle Effects */}
      <Animated.View style={[styles.sparkleContainer, animatedSparkleStyle]}>
        <Text style={styles.sparkle}>✨</Text>
        <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
        <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
      </Animated.View>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>🏆 Achievement Unlocked!</Text>
        <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
          <Text style={styles.rarityText}>
            {achievementData.rarity.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {/* Achievement Content */}
      <View style={styles.content}>
        <View style={[styles.iconContainer, { borderColor: rarityColor }]}>
          <Text style={styles.icon}>{achievementData.icon}</Text>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{achievementData.name}</Text>
          <Text style={styles.description}>{achievementData.description}</Text>
          
          {/* Reward Info */}
          {achievementData.reward && (
            <View style={styles.rewardContainer}>
              {achievementData.reward.experience > 0 && (
                <Text style={styles.rewardText}>
                  +{achievementData.reward.experience} XP
                </Text>
              )}
              {achievementData.reward.title && (
                <Text style={styles.titleReward}>
                  Title Unlocked: "{achievementData.reward.title}"
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
      
      {/* Progress Indicator */}
      <View style={styles.progressIndicator}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 60,
    height: 60,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
    color: '#fbbf24',
  },
  sparkle2: {
    top: 20,
    left: 30,
    fontSize: 12,
  },
  sparkle3: {
    top: 40,
    left: 10,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 18,
    marginBottom: 6,
  },
  rewardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  titleReward: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4b5563',
  },
  progressDotActive: {
    backgroundColor: '#10b981',
  },
});