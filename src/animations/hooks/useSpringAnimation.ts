import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useCallback } from 'react';
import { SPRING_CONFIGS } from '../AnimationConfig';

interface SpringAnimationConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
}

// Hook for spring-based animations with customizable config
export const useSpringAnimation = (
  initialValue: number = 0,
  config: SpringAnimationConfig = SPRING_CONFIGS.GENTLE
) => {
  const value = useSharedValue(initialValue);

  const animateTo = useCallback((
    toValue: number,
    customConfig?: SpringAnimationConfig,
    onComplete?: () => void
  ) => {
    const springConfig = customConfig || config;
    value.value = withSpring(toValue, springConfig, onComplete);
  }, [value, config]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: value.value }],
  }));

  const animatedOpacityStyle = useAnimatedStyle(() => ({
    opacity: value.value,
  }));

  const animatedTranslateXStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: value.value }],
  }));

  const animatedTranslateYStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: value.value }],
  }));

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${value.value}deg` }],
  }));

  return {
    value,
    animateTo,
    animatedStyle,
    animatedOpacityStyle,
    animatedTranslateXStyle,
    animatedTranslateYStyle,
    animatedRotateStyle,
  };
};