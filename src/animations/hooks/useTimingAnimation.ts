import { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useCallback } from 'react';
import { ANIMATION_DURATIONS, EASING_FUNCTIONS } from '../AnimationConfig';

interface TimingAnimationConfig {
  duration?: number;
  easing?: typeof Easing.linear;
}

// Hook for timing-based animations with customizable config
export const useTimingAnimation = (
  initialValue: number = 0,
  defaultConfig: TimingAnimationConfig = {
    duration: ANIMATION_DURATIONS.SCREEN_TRANSITION,
    easing: EASING_FUNCTIONS.EASE_OUT,
  }
) => {
  const value = useSharedValue(initialValue);

  const animateTo = useCallback((
    toValue: number,
    customConfig?: TimingAnimationConfig,
    onComplete?: () => void
  ) => {
    const config = { ...defaultConfig, ...customConfig };
    value.value = withTiming(toValue, config, onComplete);
  }, [value, defaultConfig]);

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

  const animatedWidthStyle = useAnimatedStyle(() => ({
    width: value.value,
  }));

  const animatedHeightStyle = useAnimatedStyle(() => ({
    height: value.value,
  }));

  return {
    value,
    animateTo,
    animatedStyle,
    animatedOpacityStyle,
    animatedTranslateXStyle,
    animatedTranslateYStyle,
    animatedRotateStyle,
    animatedWidthStyle,
    animatedHeightStyle,
  };
};