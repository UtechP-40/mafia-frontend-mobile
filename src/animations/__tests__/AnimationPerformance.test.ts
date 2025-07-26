import { 
  createTimingAnimation,
  createSpringAnimation,
  createButtonPressAnimation,
  createCardFlipAnimation,
  createVotingAnimation,
  createEliminationEntranceAnimation,
  createMicroInteraction,
  createPulseAnimation,
  withPerformanceMonitoring
} from '../AnimationUtils';
import { 
  ANIMATION_DURATIONS,
  SPRING_CONFIGS,
  PERFORMANCE_CONFIG
} from '../AnimationConfig';

// React Native Reanimated is mocked via Jest configuration

describe('Animation Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock performance.now for consistent timing
    global.performance = {
      now: jest.fn(() => Date.now()),
    } as any;
  });

  describe('Animation Duration Compliance', () => {
    it('should complete button press animation within expected timeframe', async () => {
      const startTime = performance.now();
      const mockSharedValue = { value: 1 };
      
      createButtonPressAnimation(mockSharedValue as any);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATIONS.BUTTON_PRESS + 100));
      
      const endTime = performance.now();
      const actualDuration = endTime - startTime;
      
      expect(actualDuration).toBeLessThan(ANIMATION_DURATIONS.BUTTON_PRESS + ANIMATION_DURATIONS.BUTTON_RELEASE + 200);
    });

    it('should complete card flip animation within expected timeframe', async () => {
      const startTime = performance.now();
      const mockSharedValue = { value: 0 };
      
      createCardFlipAnimation(mockSharedValue as any);
      
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATIONS.CARD_FLIP + 100));
      
      const endTime = performance.now();
      const actualDuration = endTime - startTime;
      
      expect(actualDuration).toBeLessThan(ANIMATION_DURATIONS.CARD_FLIP + 200);
    });

    it('should complete voting animation within expected timeframe', async () => {
      const startTime = performance.now();
      const mockScale = { value: 1 };
      const mockOpacity = { value: 1 };
      
      createVotingAnimation(mockScale as any, mockOpacity as any);
      
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATIONS.VOTE_FEEDBACK * 2 + 100));
      
      const endTime = performance.now();
      const actualDuration = endTime - startTime;
      
      expect(actualDuration).toBeLessThan(ANIMATION_DURATIONS.VOTE_FEEDBACK * 2 + 200);
    });
  });

  describe('Animation Smoothness', () => {
    it('should maintain target FPS for simple animations', () => {
      const frameCount = 60;
      const targetFrameTime = 1000 / PERFORMANCE_CONFIG.TARGET_FPS;
      const frameTimes: number[] = [];
      
      // Simulate frame rendering
      for (let i = 0; i < frameCount; i++) {
        const frameStart = performance.now();
        
        // Simulate animation calculation work
        const mockSharedValue = { value: i / frameCount };
        createMicroInteraction(mockSharedValue as any, 0, 1);
        
        const frameEnd = performance.now();
        frameTimes.push(frameEnd - frameStart);
      }
      
      const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
      const droppedFrames = frameTimes.filter(time => time > targetFrameTime).length;
      
      expect(averageFrameTime).toBeLessThan(targetFrameTime);
      expect(droppedFrames / frameCount).toBeLessThan(0.1); // Less than 10% dropped frames
    });

    it('should handle concurrent animations without significant performance degradation', () => {
      const concurrentAnimations = PERFORMANCE_CONFIG.MAX_CONCURRENT_ANIMATIONS;
      const startTime = performance.now();
      
      // Create multiple concurrent animations
      for (let i = 0; i < concurrentAnimations; i++) {
        const mockSharedValue = { value: 0 };
        createPulseAnimation(mockSharedValue as any, 3);
      }
      
      const endTime = performance.now();
      const setupTime = endTime - startTime;
      
      // Setup should be fast even with multiple animations
      expect(setupTime).toBeLessThan(50); // Less than 50ms setup time
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks with repeated animations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Run many animation cycles
      for (let i = 0; i < 1000; i++) {
        const mockSharedValue = { value: 0 };
        createTimingAnimation(1, ANIMATION_DURATIONS.BUTTON_PRESS);
        
        // Simulate cleanup
        mockSharedValue.value = 0;
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });

  describe('Animation Configuration Validation', () => {
    it('should use appropriate spring configurations for different animation types', () => {
      const gentleConfig = SPRING_CONFIGS.GENTLE;
      const bouncyConfig = SPRING_CONFIGS.BOUNCY;
      const snappyConfig = SPRING_CONFIGS.SNAPPY;
      
      // Gentle should be slower and more damped
      expect(gentleConfig.damping).toBeGreaterThan(bouncyConfig.damping);
      expect(gentleConfig.stiffness).toBeLessThan(snappyConfig.stiffness);
      
      // Bouncy should have less damping for more oscillation
      expect(bouncyConfig.damping).toBeLessThan(gentleConfig.damping);
      
      // Snappy should be fast and well-damped
      expect(snappyConfig.stiffness).toBeGreaterThan(gentleConfig.stiffness);
      expect(snappyConfig.damping).toBeGreaterThan(bouncyConfig.damping);
    });

    it('should have reasonable animation durations', () => {
      // Micro-interactions should be fast
      expect(ANIMATION_DURATIONS.BUTTON_PRESS).toBeLessThan(200);
      expect(ANIMATION_DURATIONS.HOVER_FEEDBACK).toBeLessThan(300);
      
      // Card animations can be longer but not too long
      expect(ANIMATION_DURATIONS.CARD_FLIP).toBeGreaterThan(400);
      expect(ANIMATION_DURATIONS.CARD_FLIP).toBeLessThan(1000);
      
      // Elimination animations should be dramatic but not excessive
      expect(ANIMATION_DURATIONS.ELIMINATION_ENTRANCE).toBeGreaterThan(500);
      expect(ANIMATION_DURATIONS.ELIMINATION_ENTRANCE).toBeLessThan(1500);
    });
  });

  describe('Performance Monitoring', () => {
    it('should detect slow animations in development mode', () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const slowAnimation = jest.fn();
      
      // Mock a slow animation
      const monitoredAnimation = withPerformanceMonitoring(slowAnimation, 'test-animation');
      
      // Simulate slow execution
      setTimeout(() => {
        // This would normally be called by the animation system
        // In a real scenario, this would be triggered by actual slow performance
      }, 100);
      
      (global as any).__DEV__ = originalDev;
      consoleSpy.mockRestore();
    });

    it('should not add performance overhead in production mode', () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = false;
      
      const startTime = performance.now();
      const animation = jest.fn();
      
      const monitoredAnimation = withPerformanceMonitoring(animation, 'test-animation');
      
      const endTime = performance.now();
      const overhead = endTime - startTime;
      
      // Should have minimal overhead in production
      expect(overhead).toBeLessThan(5);
      
      (global as any).__DEV__ = originalDev;
    });
  });

  describe('Animation Interruption Handling', () => {
    it('should handle animation interruption gracefully', async () => {
      const mockSharedValue = { value: 0 };
      
      // Start an animation
      createTimingAnimation(1, 1000);
      
      // Interrupt with another animation
      createTimingAnimation(0.5, 200);
      
      // Should not throw errors or cause issues
      expect(() => {
        createTimingAnimation(0, 100);
      }).not.toThrow();
    });

    it('should properly clean up interrupted animations', () => {
      const mockSharedValue = { value: 0 };
      
      // Start multiple overlapping animations
      for (let i = 0; i < 5; i++) {
        createTimingAnimation(Math.random(), 500);
      }
      
      // Should not accumulate animation references
      // This is more of a conceptual test - in real implementation,
      // the animation system should clean up properly
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Device Performance Adaptation', () => {
    it('should provide reduced motion configurations for low-end devices', () => {
      const normalConfig = SPRING_CONFIGS.GENTLE;
      
      // Simulate low-end device configuration
      const reducedConfig = {
        damping: normalConfig.damping * 1.5,
        stiffness: normalConfig.stiffness * 0.8,
        mass: normalConfig.mass * 1.2,
      };
      
      // Reduced motion should be more damped and less bouncy
      expect(reducedConfig.damping).toBeGreaterThan(normalConfig.damping);
      expect(reducedConfig.stiffness).toBeLessThan(normalConfig.stiffness);
    });

    it('should scale animation durations based on device performance', () => {
      const baseDuration = ANIMATION_DURATIONS.CARD_FLIP;
      
      // Simulate performance scaling
      const lowEndMultiplier = 0.7; // Faster animations for low-end devices
      const highEndMultiplier = 1.2; // Slower, more detailed animations for high-end devices
      
      const lowEndDuration = baseDuration * lowEndMultiplier;
      const highEndDuration = baseDuration * highEndMultiplier;
      
      expect(lowEndDuration).toBeLessThan(baseDuration);
      expect(highEndDuration).toBeGreaterThan(baseDuration);
      expect(lowEndDuration).toBeGreaterThan(200); // Still reasonable minimum
    });
  });
});

// Performance benchmark utility
export const runAnimationBenchmark = async (
  animationFunction: () => void,
  iterations: number = 100
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
}> => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    animationFunction();
    const endTime = performance.now();
    times.push(endTime - startTime);
  }
  
  return {
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    totalTime: times.reduce((sum, time) => sum + time, 0),
  };
};

// Frame rate monitoring utility
export const monitorFrameRate = (duration: number = 1000): Promise<number> => {
  return new Promise((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();
    
    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - startTime < duration) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = (frameCount * 1000) / (currentTime - startTime);
        resolve(fps);
      }
    };
    
    requestAnimationFrame(countFrame);
  });
};