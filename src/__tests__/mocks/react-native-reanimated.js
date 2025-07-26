// Mock for react-native-reanimated
const Reanimated = {
  // Shared values
  useSharedValue: (initialValue) => ({
    value: initialValue,
  }),

  // Animated styles
  useAnimatedStyle: (styleFunction) => {
    try {
      return styleFunction();
    } catch (error) {
      return {};
    }
  },

  // Animation functions
  withTiming: jest.fn((toValue, config, callback) => {
    if (callback) {
      setTimeout(() => callback(true), config?.duration || 300);
    }
    return toValue;
  }),

  withSpring: jest.fn((toValue, config, callback) => {
    if (callback) {
      setTimeout(() => callback(true), 500);
    }
    return toValue;
  }),

  withSequence: jest.fn((...animations) => animations[animations.length - 1]),

  withDelay: jest.fn((delay, animation) => animation),

  withRepeat: jest.fn((animation, numberOfReps, reverse, callback) => {
    if (callback) {
      setTimeout(() => callback(true), 1000);
    }
    return animation;
  }),

  // Utilities
  runOnJS: jest.fn((fn) => fn),

  interpolate: jest.fn((value, inputRange, outputRange, extrapolate) => {
    // Simple linear interpolation for testing
    if (inputRange.length !== outputRange.length) return outputRange[0];
    
    const index = inputRange.findIndex(input => value <= input);
    if (index === -1) return outputRange[outputRange.length - 1];
    if (index === 0) return outputRange[0];
    
    const inputStart = inputRange[index - 1];
    const inputEnd = inputRange[index];
    const outputStart = outputRange[index - 1];
    const outputEnd = outputRange[index];
    
    const ratio = (value - inputStart) / (inputEnd - inputStart);
    return outputStart + ratio * (outputEnd - outputStart);
  }),

  // Extrapolate constants
  Extrapolate: {
    CLAMP: 'clamp',
    IDENTITY: 'identity',
    EXTEND: 'extend',
  },

  // Easing functions
  Easing: {
    linear: (t) => t,
    ease: (t) => t,
    quad: (t) => t * t,
    cubic: (t) => t * t * t,
    bezier: () => (t) => t,
    circle: (t) => 1 - Math.sqrt(1 - t * t),
    back: (s = 1.70158) => (t) => t * t * ((s + 1) * t - s),
    bounce: (t) => {
      if (t < 1 / 2.75) return 7.5625 * t * t;
      if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    },
    elastic: (bounciness = 1) => (t) => {
      const p = 0.3;
      const s = p / 4;
      return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    },
    in: (easing) => easing,
    out: (easing) => (t) => 1 - easing(1 - t),
    inOut: (easing) => (t) => t < 0.5 ? easing(t * 2) / 2 : (2 - easing((1 - t) * 2)) / 2,
  },

  // Animated component creator
  createAnimatedComponent: (Component) => {
    if (typeof Component === 'string') {
      // For string components like 'View', 'Text', etc.
      const AnimatedComponent = (props) => {
        const React = require('react');
        const { View } = require('react-native');
        return React.createElement(View, props);
      };
      AnimatedComponent.displayName = `Animated(${Component})`;
      return AnimatedComponent;
    }
    
    // For actual component functions
    const AnimatedComponent = (props) => {
      return Component(props);
    };
    AnimatedComponent.displayName = `Animated(${Component.displayName || Component.name || 'Component'})`;
    return AnimatedComponent;
  },

  // Default animated components
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  Image: 'Image',
  TouchableOpacity: 'TouchableOpacity',

  // Gesture handler mocks (if needed)
  GestureHandlerRootView: ({ children }) => children,
  
  // Layout animations
  Layout: {
    duration: jest.fn(() => ({})),
    springify: jest.fn(() => ({})),
    damping: jest.fn(() => ({})),
    stiffness: jest.fn(() => ({})),
    mass: jest.fn(() => ({})),
  },

  // Entering animations
  FadeIn: {
    duration: jest.fn(() => ({})),
    delay: jest.fn(() => ({})),
  },

  FadeOut: {
    duration: jest.fn(() => ({})),
    delay: jest.fn(() => ({})),
  },

  SlideInUp: {
    duration: jest.fn(() => ({})),
    delay: jest.fn(() => ({})),
  },

  SlideOutDown: {
    duration: jest.fn(() => ({})),
    delay: jest.fn(() => ({})),
  },

  // Worklet directive (no-op in tests)
  'worklet': undefined,
};

// Create Animated object with View, Text, etc.
const Animated = {
  ...Reanimated,
  View: Reanimated.createAnimatedComponent('View'),
  Text: Reanimated.createAnimatedComponent('Text'),
  ScrollView: Reanimated.createAnimatedComponent('ScrollView'),
  Image: Reanimated.createAnimatedComponent('Image'),
  TouchableOpacity: Reanimated.createAnimatedComponent('TouchableOpacity'),
};

module.exports = Animated;
module.exports.default = Animated;