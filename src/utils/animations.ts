import { 
  withSpring, 
  withTiming, 
  withSequence, 
  withDelay,
  withRepeat,
  runOnJS,
  Easing,
  SharedValue,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

// Animation configurations for consistent timing and easing
export const ANIMATION_CONFIG = {
  // Timing configurations
  timing: {
    fast: { duration: 200, easing: Easing.out(Easing.quad) },
    medium: { duration: 300, easing: Easing.out(Easing.quad) },
    slow: { duration: 500, easing: Easing.out(Easing.quad) },
    dramatic: { duration: 800, easing: Easing.out(Easing.back(1.5)) },
  },
  
  // Spring configurations
  spring: {
    gentle: { damping: 20, stiffness: 90 },
    bouncy: { damping: 15, stiffness: 150 },
    snappy: { damping: 25, stiffness: 200 },
  },
  
  // Common values
  values: {
    scale: {
      pressed: 0.95,
      selected: 1.05,
      eliminated: 0.8,
      hidden: 0,
      normal: 1,
    },
    opacity: {
      hidden: 0,
      dimmed: 0.5,
      visible: 1,
    },
    rotation: {
      flip: 180,
      full: 360,
    },
  },
};

// Card flip animation for role reveals
export const createCardFlipAnimation = (
  isFlipped: SharedValue<boolean>,
  onMidFlip?: () => void
) => {
  'worklet';
  
  return {
    transform: [
      {
        rotateY: withTiming(
          isFlipped.value ? '180deg' : '0deg',
          ANIMATION_CONFIG.timing.medium,
          (finished) => {
            if (finished && onMidFlip) {
              runOnJS(onMidFlip)();
            }
          }
        ),
      },
    ],
  };
};

// Voting animation with visual feedback
export const createVotingAnimation = (
  isVoting: SharedValue<boolean>,
  hasVoted: SharedValue<boolean>
) => {
  'worklet';
  
  const scale = interpolate(
    isVoting.value ? 1 : 0,
    [0, 1],
    [ANIMATION_CONFIG.values.scale.normal, ANIMATION_CONFIG.values.scale.selected],
    Extrapolate.CLAMP
  );
  
  const borderWidth = withTiming(
    isVoting.value ? 3 : hasVoted.value ? 2 : 0,
    ANIMATION_CONFIG.timing.fast
  );
  
  return {
    transform: [{ scale: withSpring(scale, ANIMATION_CONFIG.spring.gentle) }],
    borderWidth,
  };
};

// Elimination animation with dramatic effects
export const createEliminationAnimation = (
  isEliminated: SharedValue<boolean>,
  onComplete?: () => void
) => {
  'worklet';
  
  if (isEliminated.value) {
    return {
      opacity: withSequence(
        withTiming(0.3, ANIMATION_CONFIG.timing.fast),
        withDelay(500, withTiming(0.1, ANIMATION_CONFIG.timing.slow))
      ),
      transform: [
        {
          scale: withSequence(
            withSpring(1.1, ANIMATION_CONFIG.spring.bouncy),
            withDelay(300, withSpring(0.8, ANIMATION_CONFIG.spring.gentle))
          ),
        },
        {
          rotate: withSequence(
            withTiming('5deg', ANIMATION_CONFIG.timing.fast),
            withTiming('-5deg', ANIMATION_CONFIG.timing.fast),
            withTiming('0deg', ANIMATION_CONFIG.timing.fast, (finished) => {
              if (finished && onComplete) {
                runOnJS(onComplete)();
              }
            })
          ),
        },
      ],
    };
  }
  
  return {
    opacity: withTiming(ANIMATION_CONFIG.values.opacity.visible, ANIMATION_CONFIG.timing.medium),
    transform: [
      { scale: withSpring(ANIMATION_CONFIG.values.scale.normal, ANIMATION_CONFIG.spring.gentle) },
      { rotate: withTiming('0deg', ANIMATION_CONFIG.timing.medium) },
    ],
  };
};

// Button press micro-interactions
export const createButtonPressAnimation = (
  isPressed: SharedValue<boolean>,
  disabled: boolean = false
) => {
  'worklet';
  
  if (disabled) {
    return {
      opacity: ANIMATION_CONFIG.values.opacity.dimmed,
      transform: [{ scale: ANIMATION_CONFIG.values.scale.normal }],
    };
  }
  
  return {
    opacity: withTiming(
      isPressed.value ? 0.8 : ANIMATION_CONFIG.values.opacity.visible,
      ANIMATION_CONFIG.timing.fast
    ),
    transform: [
      {
        scale: withSpring(
          isPressed.value 
            ? ANIMATION_CONFIG.values.scale.pressed 
            : ANIMATION_CONFIG.values.scale.normal,
          ANIMATION_CONFIG.spring.snappy
        ),
      },
    ],
  };
};

// Entrance animations for components
export const createEntranceAnimation = (
  isVisible: SharedValue<boolean>,
  delay: number = 0,
  direction: 'up' | 'down' | 'left' | 'right' | 'scale' = 'scale'
) => {
  'worklet';
  
  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return { translateY: 50 };
      case 'down':
        return { translateY: -50 };
      case 'left':
        return { translateX: -50 };
      case 'right':
        return { translateX: 50 };
      case 'scale':
      default:
        return { scale: 0.8 };
    }
  };
  
  const getFinalTransform = () => {
    switch (direction) {
      case 'up':
      case 'down':
        return { translateY: 0 };
      case 'left':
      case 'right':
        return { translateX: 0 };
      case 'scale':
      default:
        return { scale: 1 };
    }
  };
  
  if (isVisible.value) {
    return {
      opacity: withDelay(delay, withTiming(1, ANIMATION_CONFIG.timing.medium)),
      transform: [
        withDelay(delay, withSpring(getFinalTransform(), ANIMATION_CONFIG.spring.gentle))
      ],
    };
  }
  
  return {
    opacity: 0,
    transform: [getInitialTransform()],
  };
};

// Pulse animation for attention-grabbing elements
export const createPulseAnimation = (
  shouldPulse: SharedValue<boolean>,
  intensity: number = 1.1
) => {
  'worklet';
  
  if (shouldPulse.value) {
    return {
      transform: [
        {
          scale: withRepeat(
            withSequence(
              withTiming(intensity, ANIMATION_CONFIG.timing.medium),
              withTiming(1, ANIMATION_CONFIG.timing.medium)
            ),
            -1,
            true
          ),
        },
      ],
    };
  }
  
  return {
    transform: [{ scale: withTiming(1, ANIMATION_CONFIG.timing.fast) }],
  };
};

// Shake animation for errors or invalid actions
export const createShakeAnimation = (
  shouldShake: SharedValue<boolean>,
  onComplete?: () => void
) => {
  'worklet';
  
  if (shouldShake.value) {
    return {
      transform: [
        {
          translateX: withSequence(
            withTiming(10, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(0, { duration: 50 }, (finished) => {
              if (finished && onComplete) {
                runOnJS(onComplete)();
              }
            })
          ),
        },
      ],
    };
  }
  
  return {
    transform: [{ translateX: 0 }],
  };
};

// Countdown timer animation
export const createCountdownAnimation = (
  timeRemaining: SharedValue<number>,
  totalTime: number
) => {
  'worklet';
  
  const progress = interpolate(
    timeRemaining.value,
    [0, totalTime],
    [0, 1],
    Extrapolate.CLAMP
  );
  
  const color = interpolate(
    progress,
    [0, 0.3, 0.6, 1],
    [0xff4444, 0xf59e0b, 0x10b981, 0x10b981], // Red -> Orange -> Green
    Extrapolate.CLAMP
  );
  
  const scale = interpolate(
    progress,
    [0, 0.1, 1],
    [1.2, 1.1, 1],
    Extrapolate.CLAMP
  );
  
  return {
    transform: [{ scale: withSpring(scale, ANIMATION_CONFIG.spring.gentle) }],
    color: withTiming(color, ANIMATION_CONFIG.timing.fast),
  };
};

// Stagger animation for lists
export const createStaggerAnimation = (
  isVisible: SharedValue<boolean>,
  index: number,
  staggerDelay: number = 100
) => {
  'worklet';
  
  const delay = index * staggerDelay;
  
  return createEntranceAnimation(isVisible, delay, 'up');
};

// Performance optimization utilities
export const optimizeForPerformance = {
  // Use native driver when possible
  useNativeDriver: true,
  
  // Reduce animation complexity on lower-end devices
  getReducedMotionConfig: (isLowEndDevice: boolean) => ({
    timing: {
      fast: { duration: isLowEndDevice ? 100 : 200 },
      medium: { duration: isLowEndDevice ? 150 : 300 },
      slow: { duration: isLowEndDevice ? 250 : 500 },
    },
    spring: {
      gentle: { damping: isLowEndDevice ? 30 : 20, stiffness: isLowEndDevice ? 120 : 90 },
    },
  }),
  
  // Batch animations to reduce frame drops
  batchAnimations: (animations: (() => void)[]) => {
    'worklet';
    animations.forEach(animation => animation());
  },
};

// Animation hooks for React components
export const useAnimationValue = (initialValue: number = 0) => {
  'worklet';
  // This would be implemented as a custom hook in the component files
  return { value: initialValue };
};