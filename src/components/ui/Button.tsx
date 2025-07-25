import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { 
  ANIMATION_CONFIG,
  createButtonPressAnimation
} from '../../utils/animations';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
  animated?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
  animated = true
}) => {
  // Animation values
  const isPressed = useSharedValue(false);
  const rippleScale = useSharedValue(0);

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.button;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.text;
    }
  };

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => {
    if (!animated) return {};
    return createButtonPressAnimation(isPressed, disabled);
  });

  const animatedRippleStyle = useAnimatedStyle(() => {
    if (!animated) return {};
    
    return {
      opacity: withTiming(rippleScale.value > 0 ? 0.3 : 0, { duration: 200 }),
      transform: [{ scale: rippleScale.value }],
    };
  });

  const handlePressIn = () => {
    if (animated && !disabled) {
      isPressed.value = true;
      rippleScale.value = withSpring(1, ANIMATION_CONFIG.spring.snappy);
    }
  };

  const handlePressOut = () => {
    if (animated) {
      isPressed.value = false;
      rippleScale.value = withTiming(0, ANIMATION_CONFIG.timing.fast);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      if (animated) {
        // Add haptic feedback simulation through animation
        isPressed.value = withSpring(false, ANIMATION_CONFIG.spring.snappy);
      }
      runOnJS(onPress)();
    }
  };

  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(
    require('react-native').TouchableOpacity
  );

  return (
    <AnimatedTouchableOpacity
      style={[
        getButtonStyle(),
        disabled && styles.disabled,
        style,
        animatedButtonStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={animated ? 1 : 0.7}
    >
      {/* Ripple effect */}
      {animated && (
        <Animated.View style={[styles.ripple, animatedRippleStyle]} />
      )}
      
      <Text style={[getTextStyle(), disabled && styles.disabledText, textStyle]}>
        {title}
      </Text>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  disabled: {
    backgroundColor: '#6b7280',
    borderColor: '#6b7280',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#9ca3af',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
});