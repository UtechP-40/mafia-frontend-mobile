import { 
  withTiming, 
  withSpring, 
  withSequence, 
  withDelay,
  withRepeat,
  runOnJS,
  SharedValue,
  AnimationCallback,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  SPRING_CONFIGS, 
  EASING_FUNCTIONS,
  PERFORMANCE_CONFIG 
} from './AnimationConfig';

// Utility function to create timing animations with consistent config
export const createTimingAnimation = (
  toValue: number,
  duration: number = ANIMATION_DURATIONS.BUTTON_PRESS,
  easing = EASING_FUNCTIONS.EASE_OUT,
  callback?: AnimationCallback
) => {
  return withTiming(toValue, {
    duration,
    easing,
  }, callback);
};

// Utility function to create spring animations with consistent config
export const createSpringAnimation = (
  toValue: number,
  config = SPRING_CONFIGS.GENTLE,
  callback?: AnimationCallback
) => {
  return withSpring(toValue, config, callback);
};

// Button press animation sequence
export const createButtonPressAnimation = (
  scale: SharedValue<number>,
  onComplete?: () => void
) => {
  'worklet';
  
  scale.value = withSequence(
    withTiming(0.95, { 
      duration: ANIMATION_DURATIONS.BUTTON_PRESS,
      easing: EASING_FUNCTIONS.EASE_OUT 
    }),
    withTiming(1, { 
      duration: ANIMATION_DURATIONS.BUTTON_RELEASE,
      easing: EASING_FUNCTIONS.EASE_OUT 
    }, onComplete ? runOnJS(onComplete) : undefined)
  );
};

// Card flip animation sequence
export const createCardFlipAnimation = (
  rotateY: SharedValue<number>,
  onMidpoint?: () => void,
  onComplete?: () => void
) => {
  'worklet';
  
  rotateY.value = withSequence(
    withTiming(90, {
      duration: ANIMATION_DURATIONS.CARD_FLIP / 2,
      easing: EASING_FUNCTIONS.EASE_IN,
    }, onMidpoint ? runOnJS(onMidpoint) : undefined),
    withTiming(0, {
      duration: ANIMATION_DURATIONS.CARD_FLIP / 2,
      easing: EASING_FUNCTIONS.EASE_OUT,
    }, onComplete ? runOnJS(onComplete) : undefined)
  );
};

// Voting animation with feedback
export const createVotingAnimation = (
  scale: SharedValue<number>,
  opacity: SharedValue<number>,
  onComplete?: () => void
) => {
  'worklet';
  
  // Scale animation
  scale.value = withSequence(
    withSpring(1.1, SPRING_CONFIGS.BOUNCY),
    withSpring(1, SPRING_CONFIGS.GENTLE)
  );
  
  // Opacity pulse
  opacity.value = withSequence(
    withTiming(0.7, { duration: ANIMATION_DURATIONS.VOTE_FEEDBACK }),
    withTiming(1, { 
      duration: ANIMATION_DURATIONS.VOTE_FEEDBACK 
    }, onComplete ? runOnJS(onComplete) : undefined)
  );
};

// Elimination entrance animation
export const createEliminationEntranceAnimation = (
  scale: SharedValue<number>,
  opacity: SharedValue<number>,
  translateY: SharedValue<number>,
  onComplete?: () => void
) => {
  'worklet';
  
  // Dramatic entrance
  scale.value = withSpring(1, SPRING_CONFIGS.BOUNCY);
  opacity.value = withTiming(1, { 
    duration: ANIMATION_DURATIONS.ELIMINATION_ENTRANCE,
    easing: EASING_FUNCTIONS.EASE_OUT 
  });
  translateY.value = withSpring(0, SPRING_CONFIGS.SMOOTH, 
    onComplete ? runOnJS(onComplete) : undefined
  );
};

// Elimination exit animation
export const createEliminationExitAnimation = (
  scale: SharedValue<number>,
  opacity: SharedValue<number>,
  rotate: SharedValue<number>,
  onComplete?: () => void
) => {
  'worklet';
  
  scale.value = withTiming(0.8, {
    duration: ANIMATION_DURATIONS.ELIMINATION_EXIT,
    easing: EASING_FUNCTIONS.EASE_IN,
  });
  
  opacity.value = withTiming(0, {
    duration: ANIMATION_DURATIONS.ELIMINATION_EXIT,
    easing: EASING_FUNCTIONS.EASE_IN,
  });
  
  rotate.value = withTiming(360, {
    duration: ANIMATION_DURATIONS.ELIMINATION_EXIT,
    easing: EASING_FUNCTIONS.EASE_IN,
  }, onComplete ? runOnJS(onComplete) : undefined);
};

// Micro-interaction for state changes
export const createMicroInteraction = (
  value: SharedValue<number>,
  fromValue: number,
  toValue: number,
  onComplete?: () => void
) => {
  'worklet';
  
  value.value = withSequence(
    withTiming(fromValue, { 
      duration: ANIMATION_DURATIONS.HOVER_FEEDBACK / 2,
      easing: EASING_FUNCTIONS.EASE_OUT 
    }),
    withTiming(toValue, { 
      duration: ANIMATION_DURATIONS.HOVER_FEEDBACK / 2,
      easing: EASING_FUNCTIONS.EASE_OUT 
    }, onComplete ? runOnJS(onComplete) : undefined)
  );
};

// Staggered animation for multiple elements
export const createStaggeredAnimation = (
  values: SharedValue<number>[],
  toValue: number,
  staggerDelay: number = 100,
  animationConfig = { duration: ANIMATION_DURATIONS.SCREEN_TRANSITION }
) => {
  'worklet';
  
  values.forEach((value, index) => {
    value.value = withDelay(
      index * staggerDelay,
      withTiming(toValue, animationConfig)
    );
  });
};

// Pulse animation for attention-grabbing effects
export const createPulseAnimation = (
  scale: SharedValue<number>,
  pulseCount: number = 3,
  onComplete?: () => void
) => {
  'worklet';
  
  scale.value = withRepeat(
    withSequence(
      withTiming(1.05, { 
        duration: ANIMATION_DURATIONS.HOVER_FEEDBACK,
        easing: EASING_FUNCTIONS.EASE_OUT 
      }),
      withTiming(1, { 
        duration: ANIMATION_DURATIONS.HOVER_FEEDBACK,
        easing: EASING_FUNCTIONS.EASE_OUT 
      })
    ),
    pulseCount,
    false,
    onComplete ? runOnJS(onComplete) : undefined
  );
};

// Shake animation for error feedback
export const createShakeAnimation = (
  translateX: SharedValue<number>,
  intensity: number = 10,
  onComplete?: () => void
) => {
  'worklet';
  
  translateX.value = withSequence(
    withTiming(-intensity, { duration: 50 }),
    withTiming(intensity, { duration: 50 }),
    withTiming(-intensity, { duration: 50 }),
    withTiming(intensity, { duration: 50 }),
    withTiming(0, { duration: 50 }, onComplete ? runOnJS(onComplete) : undefined)
  );
};

// Fade transition utility
export const createFadeTransition = (
  opacity: SharedValue<number>,
  toValue: number,
  duration: number = ANIMATION_DURATIONS.SCREEN_TRANSITION,
  onComplete?: () => void
) => {
  'worklet';
  
  opacity.value = withTiming(toValue, {
    duration,
    easing: EASING_FUNCTIONS.EASE_IN_OUT,
  }, onComplete ? runOnJS(onComplete) : undefined);
};

// Scale transition utility
export const createScaleTransition = (
  scale: SharedValue<number>,
  toValue: number,
  config = SPRING_CONFIGS.GENTLE,
  onComplete?: () => void
) => {
  'worklet';
  
  scale.value = withSpring(toValue, config, onComplete ? runOnJS(onComplete) : undefined);
};

// Performance monitoring utility
export const withPerformanceMonitoring = (
  animation: any,
  animationName: string
) => {
  'worklet';
  
  if (__DEV__) {
    const startTime = Date.now();
    return withTiming(animation, {}, () => {
      'worklet';
      const duration = Date.now() - startTime;
      if (duration > 1000 / PERFORMANCE_CONFIG.MIN_FPS) {
        console.warn(`Animation "${animationName}" took ${duration}ms, may cause frame drops`);
      }
    });
  }
  
  return animation;
};