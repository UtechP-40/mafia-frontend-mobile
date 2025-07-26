import { 
  ANIMATION_CONFIG,
  createCardFlipAnimation,
  createVotingAnimation,
  createEliminationAnimation,
  createButtonPressAnimation,
  createEntranceAnimation,
  createPulseAnimation,
  createShakeAnimation,
  createCountdownAnimation,
  createStaggerAnimation,
  optimizeForPerformance
} from '../animations';

// React Native Reanimated is mocked via Jest configuration

describe('Animation Utilities', () => {
  describe('ANIMATION_CONFIG', () => {
    it('should have proper timing configurations', () => {
      expect(ANIMATION_CONFIG.timing.fast.duration).toBe(200);
      expect(ANIMATION_CONFIG.timing.medium.duration).toBe(300);
      expect(ANIMATION_CONFIG.timing.slow.duration).toBe(500);
      expect(ANIMATION_CONFIG.timing.dramatic.duration).toBe(800);
    });

    it('should have proper spring configurations', () => {
      expect(ANIMATION_CONFIG.spring.gentle.damping).toBe(20);
      expect(ANIMATION_CONFIG.spring.bouncy.damping).toBe(15);
      expect(ANIMATION_CONFIG.spring.snappy.damping).toBe(25);
    });

    it('should have proper scale values', () => {
      expect(ANIMATION_CONFIG.values.scale.pressed).toBe(0.95);
      expect(ANIMATION_CONFIG.values.scale.selected).toBe(1.05);
      expect(ANIMATION_CONFIG.values.scale.normal).toBe(1);
    });
  });

  describe('Animation Functions', () => {
    let mockSharedValue: any;

    beforeEach(() => {
      mockSharedValue = { value: false };
    });

    it('should create card flip animation', () => {
      const result = createCardFlipAnimation(mockSharedValue);
      expect(result).toHaveProperty('transform');
      expect(Array.isArray(result.transform)).toBe(true);
    });

    it('should create voting animation', () => {
      const mockIsVoting = { value: false };
      const mockHasVoted = { value: false };
      const result = createVotingAnimation(mockIsVoting, mockHasVoted);
      expect(result).toHaveProperty('transform');
      expect(result).toHaveProperty('borderWidth');
    });

    it('should create elimination animation', () => {
      const mockIsEliminated = { value: true };
      const result = createEliminationAnimation(mockIsEliminated);
      expect(result).toHaveProperty('opacity');
      expect(result).toHaveProperty('transform');
    });

    it('should create button press animation', () => {
      const mockIsPressed = { value: false };
      const result = createButtonPressAnimation(mockIsPressed);
      expect(result).toHaveProperty('opacity');
      expect(result).toHaveProperty('transform');
    });

    it('should create entrance animation', () => {
      const mockIsVisible = { value: true };
      const result = createEntranceAnimation(mockIsVisible);
      expect(result).toHaveProperty('opacity');
      expect(result).toHaveProperty('transform');
    });

    it('should create pulse animation', () => {
      const mockShouldPulse = { value: true };
      const result = createPulseAnimation(mockShouldPulse);
      expect(result).toHaveProperty('transform');
    });

    it('should create shake animation', () => {
      const mockShouldShake = { value: true };
      const result = createShakeAnimation(mockShouldShake);
      expect(result).toHaveProperty('transform');
    });

    it('should create countdown animation', () => {
      const mockTimeRemaining = { value: 30 };
      const result = createCountdownAnimation(mockTimeRemaining, 60);
      expect(result).toHaveProperty('transform');
      expect(result).toHaveProperty('color');
    });

    it('should create stagger animation', () => {
      const mockIsVisible = { value: true };
      const result = createStaggerAnimation(mockIsVisible, 0);
      expect(result).toHaveProperty('opacity');
      expect(result).toHaveProperty('transform');
    });
  });

  describe('Performance Optimization', () => {
    it('should have useNativeDriver enabled', () => {
      expect(optimizeForPerformance.useNativeDriver).toBe(true);
    });

    it('should provide reduced motion config for low-end devices', () => {
      const reducedConfig = optimizeForPerformance.getReducedMotionConfig(true);
      expect(reducedConfig.timing.fast.duration).toBeLessThan(ANIMATION_CONFIG.timing.fast.duration);
    });

    it('should provide normal config for high-end devices', () => {
      const normalConfig = optimizeForPerformance.getReducedMotionConfig(false);
      expect(normalConfig.timing.fast.duration).toBe(ANIMATION_CONFIG.timing.fast.duration);
    });

    it('should batch animations', () => {
      const animation1 = jest.fn();
      const animation2 = jest.fn();
      const animations = [animation1, animation2];
      
      optimizeForPerformance.batchAnimations(animations);
      
      expect(animation1).toHaveBeenCalled();
      expect(animation2).toHaveBeenCalled();
    });
  });

  describe('Animation Value Utilities', () => {
    it('should create animation value with initial value', () => {
      const result = optimizeForPerformance.useAnimationValue(0.5);
      expect(result.value).toBe(0.5);
    });

    it('should create animation value with default initial value', () => {
      const result = optimizeForPerformance.useAnimationValue();
      expect(result.value).toBe(0);
    });
  });
});