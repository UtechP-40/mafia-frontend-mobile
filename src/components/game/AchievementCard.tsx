import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Achievement, PlayerAchievement, AchievementRarity } from '../../types/game';

interface AchievementCardProps {
  achievement: Achievement | PlayerAchievement;
  isUnlocked?: boolean;
  progress?: number;
  showProgress?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  isUnlocked = false,
  progress = 0,
  showProgress = false,
  animated = true,
  size = 'medium'
}) => {
  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const progressValue = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  // Extract achievement data (handle both Achievement and PlayerAchievement types)
  const achievementData = 'achievementId' in achievement ? achievement.achievementId : achievement;
  const actualProgress = 'progress' in achievement ? achievement.progress : progress;
  const actualIsUnlocked = 'isCompleted' in achievement ? achievement.isCompleted : isUnlocked;

  useEffect(() => {
    if (animated) {
      // Initial entrance animation
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      
      // Progress animation
      if (showProgress) {
        progressValue.value = withTiming(actualProgress / achievementData.requirement.value, {
          duration: 1000
        });
      }
      
      // Glow effect for unlocked achievements
      if (actualIsUnlocked) {
        glowIntensity.value = withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 }),
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 })
        );
      }
    } else {
      scale.value = 1;
      opacity.value = 1;
      progressValue.value = showProgress ? actualProgress / achievementData.requirement.value : 0;
    }
  }, [
    animated, 
    actualProgress, 
    achievementData.requirement.value, 
    actualIsUnlocked, 
    showProgress,
    scale,
    opacity,
    progressValue,
    glowIntensity
  ]);

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(
        progressValue.value,
        [0, 1],
        [0, 100],
        Extrapolate.CLAMP
      )}%`,
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
        [0, 20],
        Extrapolate.CLAMP
      ),
    };
  });

  // Get rarity color
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

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          icon: styles.smallIcon,
          title: styles.smallTitle,
          description: styles.smallDescription,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          icon: styles.largeIcon,
          title: styles.largeTitle,
          description: styles.largeDescription,
        };
      default:
        return {
          container: styles.container,
          icon: styles.icon,
          title: styles.title,
          description: styles.description,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const rarityColor = getRarityColor(achievementData.rarity);

  return (
    <Animated.View 
      style={[
        sizeStyles.container,
        actualIsUnlocked ? styles.unlocked : styles.locked,
        { borderColor: rarityColor },
        animatedCardStyle,
        actualIsUnlocked && animatedGlowStyle
      ]}
    >
      {/* Rarity Indicator */}
      <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />
      
      {/* Achievement Icon */}
      <View style={[styles.iconContainer, actualIsUnlocked && styles.iconUnlocked]}>
        <Text style={sizeStyles.icon}>
          {achievementData.icon}
        </Text>
      </View>
      
      {/* Achievement Info */}
      <View style={styles.infoContainer}>
        <Text style={[
          sizeStyles.title,
          actualIsUnlocked ? styles.titleUnlocked : styles.titleLocked
        ]}>
          {achievementData.name}
        </Text>
        
        <Text style={[
          sizeStyles.description,
          actualIsUnlocked ? styles.descriptionUnlocked : styles.descriptionLocked
        ]}>
          {achievementData.description}
        </Text>
        
        {/* Progress Bar */}
        {showProgress && !actualIsUnlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { backgroundColor: rarityColor },
                  animatedProgressStyle
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {actualProgress}/{achievementData.requirement.value}
            </Text>
          </View>
        )}
        
        {/* Reward Info */}
        {actualIsUnlocked && achievementData.reward && (
          <View style={styles.rewardContainer}>
            {achievementData.reward.experience > 0 && (
              <Text style={styles.rewardText}>
                +{achievementData.reward.experience} XP
              </Text>
            )}
            {achievementData.reward.title && (
              <Text style={styles.titleReward}>
                Title: "{achievementData.reward.title}"
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* Unlocked Badge */}
      {actualIsUnlocked && (
        <View style={styles.unlockedBadge}>
          <Text style={styles.unlockedBadgeText}>✓</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Base container styles
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  smallContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 8,
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  largeContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    position: 'relative',
  },
  
  // State styles
  unlocked: {
    backgroundColor: '#1f2937',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  locked: {
    backgroundColor: '#374151',
    opacity: 0.7,
  },
  
  // Rarity indicator
  rarityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  
  // Icon styles
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconUnlocked: {
    backgroundColor: '#6366f1',
  },
  icon: {
    fontSize: 24,
  },
  smallIcon: {
    fontSize: 16,
  },
  largeIcon: {
    fontSize: 32,
  },
  
  // Info container
  infoContainer: {
    flex: 1,
  },
  
  // Title styles
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  smallTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  largeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  titleUnlocked: {
    color: '#ffffff',
  },
  titleLocked: {
    color: '#9ca3af',
  },
  
  // Description styles
  description: {
    fontSize: 14,
    lineHeight: 18,
  },
  smallDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  largeDescription: {
    fontSize: 16,
    lineHeight: 20,
  },
  descriptionUnlocked: {
    color: '#d1d5db',
  },
  descriptionLocked: {
    color: '#6b7280',
  },
  
  // Progress styles
  progressContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#4b5563',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  
  // Reward styles
  rewardContainer: {
    marginTop: 6,
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
  
  // Unlocked badge
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});