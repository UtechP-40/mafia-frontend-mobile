import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PushToTalkButtonProps {
  isActive: boolean;
  isMuted: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  onToggleMute: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({
  isActive,
  isMuted,
  onPressIn,
  onPressOut,
  onToggleMute,
  disabled = false,
  size = 'medium'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 50, height: 50, borderRadius: 25 };
      case 'large':
        return { width: 80, height: 80, borderRadius: 40 };
      default:
        return { width: 60, height: 60, borderRadius: 30 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(true);
    onPressIn();

    // Scale down animation
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();

    // Start glow animation
    Animated.timing(glowAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [disabled, onPressIn, scaleAnim, glowAnim]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(false);
    onPressOut();

    // Scale back up animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // Stop glow animation
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [disabled, onPressOut, scaleAnim, glowAnim]);

  // Pulse animation when active
  React.useEffect(() => {
    if (isActive && !disabled) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
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
  }, [isActive, disabled, pulseAnim]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: handlePressIn,
    onPanResponderRelease: handlePressOut,
    onPanResponderTerminate: handlePressOut,
  });

  const getButtonColor = () => {
    if (disabled) return '#9CA3AF';
    if (isMuted) return '#EF4444';
    if (isActive || isPressed) return '#10B981';
    return '#6366F1';
  };

  const getIconName = () => {
    if (isMuted) return 'mic-off';
    return 'mic';
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(99, 102, 241, 0)', 'rgba(99, 102, 241, 0.4)']
  });

  return (
    <View style={styles.container}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowContainer,
          getSizeStyles(),
          {
            backgroundColor: glowColor,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }]
          }
        ]}
      />
      
      {/* Main button */}
      <Animated.View
        style={[
          styles.button,
          getSizeStyles(),
          {
            backgroundColor: getButtonColor(),
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.buttonInner, getSizeStyles()]}
          onLongPress={onToggleMute}
          delayLongPress={500}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={getIconName()} 
            size={getIconSize()} 
            color="white" 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Status indicator */}
      {(isActive || isPressed) && (
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.statusText}>
            {isPressed ? 'Speaking...' : 'Active'}
          </Text>
        </View>
      )}

      {/* Instructions */}
      <Text style={styles.instructions}>
        {isMuted ? 'Long press to unmute' : 'Hold to talk • Long press to mute'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  glowContainer: {
    position: 'absolute',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  instructions: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 200,
  },
});

export default PushToTalkButton;