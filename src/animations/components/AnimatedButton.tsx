import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, runOnJS } from 'react-native-reanimated';
import { ANIMATION_DURATIONS, EASING_FUNCTIONS, SCALE_VALUES, OPACITY_VALUES } from '../AnimationConfig';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    
    scale.value = withTiming(SCALE_VALUES.BUTTON_PRESS, {
      duration: ANIMATION_DURATIONS.BUTTON_PRESS,
      easing: EASING_FUNCTIONS.EASE_OUT,
    });
    
    opacity.value = withTiming(0.8, {
      duration: ANIMATION_DURATIONS.BUTTON_PRESS,
      easing: EASING_FUNCTIONS.EASE_OUT,
    });
  }, [disabled, scale, opacity]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    
    scale.value = withSequence(
      withTiming(SCALE_VALUES.BUTTON_HOVER, {
        duration: ANIMATION_DURATIONS.BUTTON_RELEASE / 2,
        easing: EASING_FUNCTIONS.EASE_OUT,
      }),
      withTiming(1, {
        duration: ANIMATION_DURATIONS.BUTTON_RELEASE / 2,
        easing: EASING_FUNCTIONS.EASE_OUT,
      })
    );
    
    opacity.value = withTiming(OPACITY_VALUES.VISIBLE, {
      duration: ANIMATION_DURATIONS.BUTTON_RELEASE,
      easing: EASING_FUNCTIONS.EASE_OUT,
    });
  }, [disabled, scale, opacity]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    
    // Add haptic feedback if enabled
    if (hapticFeedback) {
      // This would be implemented with expo-haptics in a real app
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    runOnJS(onPress)();
  }, [disabled, onPress, hapticFeedback]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <AnimatedTouchableOpacity
      style={[buttonStyle, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1} // We handle opacity with animations
    >
      <Text style={buttonTextStyle}>{title}</Text>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Variants
  primary: {
    backgroundColor: '#6366f1',
  },
  secondary: {
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  danger: {
    backgroundColor: '#ef4444',
  },
  
  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  
  // Disabled state
  disabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Variant text styles
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#374151',
  },
  dangerText: {
    color: '#ffffff',
  },
  
  // Size text styles
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Disabled text
  disabledText: {
    color: '#6b7280',
  },
});