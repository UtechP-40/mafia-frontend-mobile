import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ConnectionQuality } from '../../types/voice';

interface VoiceActivityIndicatorProps {
  audioLevel: number;
  isSpeaking: boolean;
  isMuted: boolean;
  connectionQuality: ConnectionQuality;
  size?: 'small' | 'medium' | 'large';
  showConnectionQuality?: boolean;
}

const VoiceActivityIndicator: React.FC<VoiceActivityIndicatorProps> = ({
  audioLevel,
  isSpeaking,
  isMuted,
  connectionQuality,
  size = 'medium',
  showConnectionQuality = true
}) => {
  const animatedValues = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { barWidth: 2, barHeight: 12, spacing: 2, containerSize: 20 };
      case 'large':
        return { barWidth: 4, barHeight: 24, spacing: 4, containerSize: 40 };
      default:
        return { barWidth: 3, barHeight: 18, spacing: 3, containerSize: 30 };
    }
  };

  const { barWidth, barHeight, spacing, containerSize } = getSizeConfig();

  // Animate bars based on audio level
  useEffect(() => {
    if (isMuted) {
      // All bars to minimum when muted
      animatedValues.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    if (isSpeaking && audioLevel > 0) {
      // Calculate how many bars should be active based on audio level
      const activeBars = Math.ceil(audioLevel * 5);
      
      animatedValues.forEach((anim, index) => {
        const targetValue = index < activeBars 
          ? Math.max(0.3, audioLevel * (1 + index * 0.2)) 
          : 0.3;
        
        Animated.timing(anim, {
          toValue: Math.min(targetValue, 1),
          duration: 100,
          useNativeDriver: false,
        }).start();
      });
    } else {
      // Return to idle state
      animatedValues.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [audioLevel, isSpeaking, isMuted, animatedValues]);

  // Pulse animation when speaking
  useEffect(() => {
    if (isSpeaking && !isMuted) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
      };
    }
  }, [isSpeaking, isMuted, pulseAnim]);

  const getBarColor = (index: number) => {
    if (isMuted) return '#9CA3AF';
    
    const intensity = index / 4; // 0 to 1
    if (intensity < 0.3) return '#10B981'; // Green for low levels
    if (intensity < 0.7) return '#F59E0B'; // Yellow for medium levels
    return '#EF4444'; // Red for high levels
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case ConnectionQuality.EXCELLENT:
        return '#10B981';
      case ConnectionQuality.GOOD:
        return '#84CC16';
      case ConnectionQuality.FAIR:
        return '#F59E0B';
      case ConnectionQuality.POOR:
        return '#EF4444';
      case ConnectionQuality.DISCONNECTED:
        return '#9CA3AF';
      default:
        return '#9CA3AF';
    }
  };

  const getConnectionQualitySize = () => {
    switch (connectionQuality) {
      case ConnectionQuality.EXCELLENT:
        return 3;
      case ConnectionQuality.GOOD:
        return 2;
      case ConnectionQuality.FAIR:
      case ConnectionQuality.POOR:
        return 1;
      default:
        return 0;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          width: containerSize, 
          height: containerSize,
          transform: [{ scale: pulseAnim }]
        }
      ]}
    >
      {/* Audio level bars */}
      <View style={styles.barsContainer}>
        {animatedValues.map((animValue, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [barHeight * 0.2, barHeight],
                }),
                backgroundColor: getBarColor(index),
                marginHorizontal: spacing / 2,
              }
            ]}
          />
        ))}
      </View>

      {/* Connection quality indicator */}
      {showConnectionQuality && (
        <View style={styles.connectionIndicator}>
          {Array.from({ length: 3 }, (_, index) => (
            <View
              key={index}
              style={[
                styles.connectionBar,
                {
                  backgroundColor: index < getConnectionQualitySize() 
                    ? getConnectionQualityColor() 
                    : 'rgba(156, 163, 175, 0.3)',
                  height: 2 + index * 1,
                  width: 2,
                }
              ]}
            />
          ))}
        </View>
      )}

      {/* Muted indicator */}
      {isMuted && (
        <View style={styles.mutedOverlay}>
          <View style={styles.mutedLine} />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '80%',
  },
  bar: {
    borderRadius: 1,
    minHeight: 2,
  },
  connectionIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  connectionBar: {
    borderRadius: 0.5,
  },
  mutedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#EF4444',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});

export default VoiceActivityIndicator;