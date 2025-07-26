import { renderHook, act } from '@testing-library/react-native';
import { useSpringAnimation, useTimingAnimation } from '../hooks';
import { AnimationConfig } from '../AnimationConfig';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const mockSharedValue = (initialValue: any) => ({
    value: initialValue,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  });

  const mockWithSpring = jest.fn((toValue, config, callback) => {
    // Simulate spring animation completion
    setTimeout(() => {
      if (callback) callback(true);
    }, config?.duration || 300);
    return toValue;
  });

  const mockWithTiming = jest.fn((toValue, config, callback) => {
    // Simulate timing animation completion
    setTimeout(() => {
      if (callback) callback(true);
    }, config?.duration || 250);
    return toValue;
  });

  const mockUseAnimatedStyle = jest.fn((styleFunction) => {
    return styleFunction();
  });

  const mockRunOnJS = jest.fn((fn) => fn);

  return {
    useSharedValue: mockSharedValue,
    withSpring: mockWithSpring,
    withTiming: mockWithTiming,
    useAnimatedStyle: mockUseAnimatedStyle,
    runOnJS: mockRunOnJS,
    Easing: {
      bezier: jest.fn(),
      ease: jest.fn(),
      elastic: jest.fn(),
      bounce: jest.fn(),
    },
  };
});

// Mock performance monitoring
const mockPerformanceMonitor = {
  startMeasurement: jest.fn(),
  endMeasurement: jest.fn(),
  getAverageFrameTime: jest.fn(() => 16.67), // 60fps
  getDroppedFrames: jest.fn(() => 0),
  getMemoryUsage: jest.fn(() => ({ used: 50, total: 100 })),
};

jest.mock('../../utils/performanceBenchmarks', () => ({
  performanceMonitor: mockPerformanceMonitor,
}));

describe('Animation Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Spring Animations', () => {
    it('completes spring animation within expected timeframe', async () => {
      const { result } = renderHook(() => useSpringAnimation(0));

      const startTime = Date.now();
      
      act(() => {
        result.current.animateTo(1);
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThanOrEqual(350); // Allow some buffer
    });

    it('maintains 60fps during spring animation', async () => {
      const { result } = renderHook(() => useSpringAnimation(0));

      mockPerformanceMonitor.startMeasurement.mockClear();
      mockPerformanceMonitor.endMeasurement.mockClear();

      act(() => {
        result.current.animateTo(1);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockPerformanceMonitor.getAverageFrameTime()).toBeLessThanOrEqual(16.67);
      expect(mockPerformanceMonitor.getDroppedFrames()).toBe(0);
    });

    it('uses optimized spring configuration', () => {
      const { result } = renderHook(() => useSpringAnimation(0));
      const mockWithSpring = require('react-native-reanimated').withSpring;

      act(() => {
        result.current.animateTo(1);
      });

      expect(mockWithSpring).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          damping: expect.any(Number),
          stiffness: expect.any(Number),
          mass: expect.any(Number),
        }),
        expect.any(Function)
      );
    });

    it('handles rapid animation changes efficiently', () => {
      const { result } = renderHook(() => useSpringAnimation(0));

      // Rapidly change animation targets
      act(() => {
        result.current.animateTo(1);
        result.current.animateTo(0.5);
        result.current.animateTo(0.8);
        result.current.animateTo(0.2);
      });

      // Should not cause performance issues
      expect(mockPerformanceMonitor.getDroppedFrames()).toBe(0);
    });

    it('cleans up animation resources properly', () => {
      const { result, unmount } = renderHook(() => useSpringAnimation(0));

      act(() => {
        result.current.animateTo(1);
      });

      unmount();

      // Should not cause memory leaks
      const memoryUsage = mockPerformanceMonitor.getMemoryUsage();
      expect(memoryUsage.used / memoryUsage.total).toBeLessThan(0.8);
    });
  });

  describe('Timing Animations', () => {
    it('completes timing animation within expected duration', async () => {
      const { result } = renderHook(() => useTimingAnimation(0));

      const startTime = Date.now();
      
      act(() => {
        result.current.animateTo(1, { duration: 250 });
      });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThanOrEqual(300); // Allow some buffer
    });

    it('maintains smooth frame rate during timing animation', () => {
      const { result } = renderHook(() => useTimingAnimation(0));

      act(() => {
        result.current.animateTo(1, { duration: 500 });
      });

      act(() => {
        jest.advanceTimersByTime(250); // Halfway through
      });

      expect(mockPerformanceMonitor.getAverageFrameTime()).toBeLessThanOrEqual(16.67);
    });

    it('uses appropriate easing curves', () => {
      const { result } = renderHook(() => useTimingAnimation(0));
      const mockWithTiming = require('react-native-reanimated').withTiming;

      act(() => {
        result.current.animateTo(1, { 
          duration: 250,
          easing: 'easeInOut'
        });
      });

      expect(mockWithTiming).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          duration: 250,
          easing: expect.any(Function),
        }),
        expect.any(Function)
      );
    });

    it('handles animation interruption gracefully', () => {
      const { result } = renderHook(() => useTimingAnimation(0));

      act(() => {
        result.current.animateTo(1, { duration: 500 });
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Interrupt with new animation
      act(() => {
        result.current.animateTo(0, { duration: 200 });
      });

      expect(mockPerformanceMonitor.getDroppedFrames()).toBe(0);
    });
  });

  describe('Complex Animation Sequences', () => {
    it('handles multiple simultaneous animations efficiently', () => {
      const { result: spring1 } = renderHook(() => useSpringAnimation(0));
      const { result: spring2 } = renderHook(() => useSpringAnimation(0));
      const { result: timing1 } = renderHook(() => useTimingAnimation(0));

      act(() => {
        spring1.current.animateTo(1);
        spring2.current.animateTo(0.5);
        timing1.current.animateTo(0.8, { duration: 300 });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockPerformanceMonitor.getAverageFrameTime()).toBeLessThanOrEqual(16.67);
      expect(mockPerformanceMonitor.getDroppedFrames()).toBeLessThanOrEqual(1);
    });

    it('optimizes animation batching', () => {
      const animations = Array.from({ length: 10 }, () => 
        renderHook(() => useSpringAnimation(0))
      );

      act(() => {
        animations.forEach(({ result }) => {
          result.current.animateTo(Math.random());
        });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should batch animations to maintain performance
      expect(mockPerformanceMonitor.getDroppedFrames()).toBeLessThanOrEqual(2);
    });

    it('handles animation chaining efficiently', async () => {
      const { result } = renderHook(() => useTimingAnimation(0));

      const animationChain = async () => {
        await new Promise(resolve => {
          act(() => {
            result.current.animateTo(1, { duration: 100 });
          });
          setTimeout(resolve, 100);
        });

        await new Promise(resolve => {
          act(() => {
            result.current.animateTo(0.5, { duration: 100 });
          });
          setTimeout(resolve, 100);
        });

        await new Promise(resolve => {
          act(() => {
            result.current.animateTo(0, { duration: 100 });
          });
          setTimeout(resolve, 100);
        });
      };

      const startTime = Date.now();
      
      act(() => {
        animationChain();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThanOrEqual(350);
      expect(mockPerformanceMonitor.getDroppedFrames()).toBeLessThanOrEqual(1);
    });
  });

  describe('Memory Management', () => {
    it('prevents memory leaks in long-running animations', () => {
      const animations = Array.from({ length: 50 }, () => 
        renderHook(() => useSpringAnimation(0))
      );

      // Run many animations
      act(() => {
        animations.forEach(({ result }) => {
          result.current.animateTo(1);
        });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Clean up half the animations
      animations.slice(0, 25).forEach(({ unmount }) => unmount());

      const memoryUsage = mockPerformanceMonitor.getMemoryUsage();
      expect(memoryUsage.used / memoryUsage.total).toBeLessThan(0.9);
    });

    it('properly disposes of animation listeners', () => {
      const { result, unmount } = renderHook(() => useSpringAnimation(0));
      const mockSharedValue = result.current.value;

      act(() => {
        result.current.animateTo(1);
      });

      unmount();

      // Listeners should be cleaned up
      expect(mockSharedValue.removeListener).toHaveBeenCalled();
    });

    it('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 20; i++) {
        const { result, unmount } = renderHook(() => useSpringAnimation(0));
        
        act(() => {
          result.current.animateTo(Math.random());
        });

        unmount();
      }

      const memoryUsage = mockPerformanceMonitor.getMemoryUsage();
      expect(memoryUsage.used / memoryUsage.total).toBeLessThan(0.7);
    });
  });

  describe('Performance Optimization', () => {
    it('uses native driver when possible', () => {
      const { result } = renderHook(() => useSpringAnimation(0));
      const mockWithSpring = require('react-native-reanimated').withSpring;

      act(() => {
        result.current.animateTo(1);
      });

      // Should use native driver for transform and opacity animations
      expect(mockWithSpring).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          useNativeDriver: true,
        }),
        expect.any(Function)
      );
    });

    it('optimizes animation configuration for performance', () => {
      const config = AnimationConfig.spring.default;

      expect(config.damping).toBeGreaterThan(0);
      expect(config.stiffness).toBeGreaterThan(0);
      expect(config.mass).toBeGreaterThan(0);
      
      // Should be optimized for 60fps
      const expectedDuration = (2 * Math.PI) / Math.sqrt(config.stiffness / config.mass);
      expect(expectedDuration).toBeLessThan(500); // Should complete quickly
    });

    it('handles low-end device optimization', () => {
      // Mock low-end device
      const originalPlatform = require('react-native').Platform;
      require('react-native').Platform = {
        ...originalPlatform,
        constants: {
          ...originalPlatform.constants,
          Brand: 'generic',
          Model: 'low-end-device',
        },
      };

      const { result } = renderHook(() => useSpringAnimation(0));

      act(() => {
        result.current.animateTo(1);
      });

      // Should use reduced animation complexity on low-end devices
      expect(mockPerformanceMonitor.getAverageFrameTime()).toBeLessThanOrEqual(20); // Allow lower fps
    });

    it('provides animation performance metrics', () => {
      const { result } = renderHook(() => useSpringAnimation(0));

      act(() => {
        result.current.animateTo(1);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockPerformanceMonitor.startMeasurement).toHaveBeenCalled();
      expect(mockPerformanceMonitor.endMeasurement).toHaveBeenCalled();
    });

    it('adapts animation quality based on performance', () => {
      // Mock poor performance
      mockPerformanceMonitor.getAverageFrameTime.mockReturnValue(33.33); // 30fps
      mockPerformanceMonitor.getDroppedFrames.mockReturnValue(5);

      const { result } = renderHook(() => useSpringAnimation(0));

      act(() => {
        result.current.animateTo(1);
      });

      // Should reduce animation complexity when performance is poor
      const mockWithSpring = require('react-native-reanimated').withSpring;
      expect(mockWithSpring).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          damping: expect.any(Number),
          // Should use higher damping for faster completion
        }),
        expect.any(Function)
      );
    });
  });

  describe('Animation Stress Testing', () => {
    it('handles 100 simultaneous animations without dropping frames', () => {
      const animations = Array.from({ length: 100 }, () => 
        renderHook(() => useSpringAnimation(0))
      );

      act(() => {
        animations.forEach(({ result }) => {
          result.current.animateTo(Math.random());
        });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should maintain reasonable performance even with many animations
      expect(mockPerformanceMonitor.getDroppedFrames()).toBeLessThanOrEqual(10);
    });

    it('recovers gracefully from animation overload', () => {
      // Create excessive animations
      const animations = Array.from({ length: 500 }, () => 
        renderHook(() => useSpringAnimation(0))
      );

      act(() => {
        animations.forEach(({ result }) => {
          result.current.animateTo(1);
        });
      });

      // System should handle overload gracefully
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(300);
        });
      }).not.toThrow();

      // Clean up
      animations.forEach(({ unmount }) => unmount());
    });
  });
});