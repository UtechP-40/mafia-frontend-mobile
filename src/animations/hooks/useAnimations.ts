import { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useCallback, useEffect } from 'react';
import { 
  ANIMATION_DURATIONS, 
  SPRING_CONFIGS, 
  EASING_FUNCTIONS,
  SCALE_VALUES,
  OPACITY_VALUES 
} from '../AnimationConfig';
import {
  createButtonPressAnimation,
  createCardFlipAnimation,
  createVotingAnimation,
  createMicroInteraction,
  createPulseAnimation,
  createShakeAnimation,
} from '../AnimationUtils';

// Main animation hook that provides common animation functions
export const useAnimations = () => {
  // Shared values for common animations
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  // Button press animation
  const animateButtonPress = useCallback((onComplete?: () => void) => {
    createButtonPressAnimation(scale, onComplete);
  }, [scale]);

  // Card flip animation
  const animateCardFlip = useCallback((onMidpoint?: () => void, onComplete?: () => void) => {
    createCardFlipAnimation(rotateY, onMidpoint, onComplete);
  }, [rotateY]);

  // Voting feedback animation
  const animateVotingFeedback = useCallback((onComplete?: () => void) => {
    createVotingAnimation(scale, opacity, onComplete);
  }, [scale, opacity]);

  // Micro-interaction animation
  const animateMicroInteraction = useCallback((
    fromScale: number = 1,
    toScale: number = SCALE_VALUES.BUTTON_HOVER,
    onComplete?: () => void
  ) => {
    createMicroInteraction(scale, fromScale, toScale, onComplete);
  }, [scale]);

  // Pulse animation
  const animatePulse = useCallback((pulseCount: number = 3, onComplete?: () => void) => {
    createPulseAnimation(scale, pulseCount, onComplete);
  }, [scale]);

  // Shake animation for errors
  const animateShake = useCallback((intensity: number = 10, onComplete?: () => void) => {
    createShakeAnimation(translateX, intensity, onComplete);
  }, [translateX]);

  // Fade in animation
  const animateFadeIn = useCallback((duration: number = ANIMATION_DURATIONS.SCREEN_TRANSITION) => {
    opacity.value = withTiming(OPACITY_VALUES.VISIBLE, {
      duration,
      easing: EASING_FUNCTIONS.EASE_OUT,
    });
  }, [opacity]);

  // Fade out animation
  const animateFadeOut = useCallback((duration: number = ANIMATION_DURATIONS.SCREEN_TRANSITION) => {
    opacity.value = withTiming(OPACITY_VALUES.HIDDEN, {
      duration,
      easing: EASING_FUNCTIONS.EASE_IN,
    });
  }, [opacity]);

  // Scale in animation
  const animateScaleIn = useCallback((config = SPRING_CONFIGS.BOUNCY) => {
    scale.value = withSpring(1, config);
  }, [scale]);

  // Scale out animation
  const animateScaleOut = useCallback((config = SPRING_CONFIGS.GENTLE) => {
    scale.value = withSpring(0, config);
  }, [scale]);

  // Slide in from direction
  const animateSlideIn = useCallback((
    direction: 'left' | 'right' | 'up' | 'down' = 'up',
    distance: number = 50,
    duration: number = ANIMATION_DURATIONS.SCREEN_TRANSITION
  ) => {
    const isHorizontal = direction === 'left' || direction === 'right';
    const isNegative = direction === 'left' || direction === 'up';
    const targetValue = isNegative ? -distance : distance;
    
    if (isHorizontal) {
      translateX.value = targetValue;
      translateX.value = withTiming(0, { duration, easing: EASING_FUNCTIONS.EASE_OUT });
    } else {
      translateY.value = targetValue;
      translateY.value = withTiming(0, { duration, easing: EASING_FUNCTIONS.EASE_OUT });
    }
  }, [translateX, translateY]);

  // Reset all animations to default values
  const resetAnimations = useCallback(() => {
    scale.value = 1;
    opacity.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    rotateY.value = 0;
    rotateZ.value = 0;
  }, [scale, opacity, translateX, translateY, rotateY, rotateZ]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateY: `${rotateY.value}deg` },
      { rotateZ: `${rotateZ.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return {
    // Shared values (for custom animations)
    scale,
    opacity,
    translateX,
    translateY,
    rotateY,
    rotateZ,
    
    // Animation functions
    animateButtonPress,
    animateCardFlip,
    animateVotingFeedback,
    animateMicroInteraction,
    animatePulse,
    animateShake,
    animateFadeIn,
    animateFadeOut,
    animateScaleIn,
    animateScaleOut,
    animateSlideIn,
    resetAnimations,
    
    // Animated style
    animatedStyle,
  };
};