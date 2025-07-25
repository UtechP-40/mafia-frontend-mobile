import { Easing } from 'react-native-reanimated';

// Animation timing configurations
export const ANIMATION_DURATIONS = {
  // Micro-interactions
  BUTTON_PRESS: 150,
  BUTTON_RELEASE: 100,
  HOVER_FEEDBACK: 200,
  
  // Card animations
  CARD_FLIP: 600,
  CARD_REVEAL: 800,
  CARD_SELECTION: 250,
  
  // Voting animations
  VOTE_CAST: 400,
  VOTE_FEEDBACK: 300,
  VOTE_RESULT: 500,
  
  // Elimination animations
  ELIMINATION_ENTRANCE: 800,
  ELIMINATION_HOLD: 2000,
  ELIMINATION_EXIT: 600,
  
  // Phase transitions
  PHASE_CHANGE: 1000,
  GAME_START: 1200,
  
  // UI transitions
  SCREEN_TRANSITION: 300,
  MODAL_APPEAR: 250,
  MODAL_DISMISS: 200,
} as const;

// Spring animation configurations
export const SPRING_CONFIGS = {
  // Gentle spring for UI elements
  GENTLE: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
  
  // Bouncy spring for playful interactions
  BOUNCY: {
    damping: 15,
    stiffness: 400,
    mass: 1,
  },
  
  // Snappy spring for quick feedback
  SNAPPY: {
    damping: 25,
    stiffness: 500,
    mass: 0.8,
  },
  
  // Smooth spring for card flips
  SMOOTH: {
    damping: 30,
    stiffness: 200,
    mass: 1.2,
  },
} as const;

// Easing functions for different animation types
export const EASING_FUNCTIONS = {
  // Standard easing
  EASE_OUT: Easing.out(Easing.cubic),
  EASE_IN: Easing.in(Easing.cubic),
  EASE_IN_OUT: Easing.inOut(Easing.cubic),
  
  // Bouncy easing
  BOUNCE_OUT: Easing.out(Easing.bounce),
  BOUNCE_IN: Easing.in(Easing.bounce),
  
  // Elastic easing
  ELASTIC_OUT: Easing.out(Easing.elastic(1.3)),
  ELASTIC_IN: Easing.in(Easing.elastic(1.3)),
  
  // Back easing for overshoot effects
  BACK_OUT: Easing.out(Easing.back(1.7)),
  BACK_IN: Easing.in(Easing.back(1.7)),
  
  // Linear for consistent motion
  LINEAR: Easing.linear,
} as const;

// Animation scale values
export const SCALE_VALUES = {
  BUTTON_PRESS: 0.95,
  BUTTON_HOVER: 1.05,
  CARD_SELECTION: 1.02,
  CARD_FLIP_MIDPOINT: 0.1,
  ELIMINATION_ENTRANCE: 1.1,
  ELIMINATION_EXIT: 0.9,
} as const;

// Opacity values
export const OPACITY_VALUES = {
  HIDDEN: 0,
  VISIBLE: 1,
  SEMI_TRANSPARENT: 0.7,
  DISABLED: 0.5,
  OVERLAY: 0.8,
} as const;

// Transform values
export const TRANSFORM_VALUES = {
  CARD_FLIP_HALF: 90,
  CARD_FLIP_FULL: 180,
  ROTATION_QUARTER: 90,
  ROTATION_HALF: 180,
  ROTATION_FULL: 360,
  SLIDE_DISTANCE: 50,
} as const;

// Performance optimization settings
export const PERFORMANCE_CONFIG = {
  // Use native driver for transform and opacity animations
  USE_NATIVE_DRIVER: true,
  
  // Reduce motion for accessibility
  REDUCE_MOTION: false,
  
  // Frame rate targets
  TARGET_FPS: 60,
  MIN_FPS: 30,
  
  // Animation complexity thresholds
  MAX_CONCURRENT_ANIMATIONS: 5,
  COMPLEX_ANIMATION_THRESHOLD: 3,
} as const;

// Color animation values
export const COLOR_VALUES = {
  SELECTION_BORDER: '#6366f1',
  VOTING_BORDER: '#f59e0b',
  ELIMINATION_BORDER: '#ef4444',
  SUCCESS_COLOR: '#10b981',
  WARNING_COLOR: '#f59e0b',
  ERROR_COLOR: '#ef4444',
} as const;