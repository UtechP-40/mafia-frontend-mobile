import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { memoryMonitor } from '../utils/memoryMonitor';

export interface MemoryOptimizationOptions {
  enableAutoCleanup?: boolean;
  cleanupOnBackground?: boolean;
  maxCacheSize?: number;
  cleanupInterval?: number;
}

export const useMemoryOptimization = (options: MemoryOptimizationOptions = {}) => {
  const {
    enableAutoCleanup = true,
    cleanupOnBackground = true,
    maxCacheSize = 50,
    cleanupInterval = 30000, // 30 seconds
  } = options;

  const cacheRef = useRef(new Map<string, any>());
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const listenersRef = useRef<Set<() => void>>(new Set());
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to clear all resources
  const cleanup = useCallback(() => {
    // Clear cache
    cacheRef.current.clear();

    // Clear all timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();

    // Remove all listeners
    listenersRef.current.forEach(removeListener => removeListener());
    listenersRef.current.clear();

    // Clear cleanup interval
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
      cleanupIntervalRef.current = null;
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }, []);

  // Cache management functions
  const setCache = useCallback((key: string, value: any) => {
    const cache = cacheRef.current;
    
    // Remove oldest entries if cache is full
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, value);
  }, [maxCacheSize]);

  const getCache = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Timer management
  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    timersRef.current.add(timer);
    return () => {
      clearTimeout(timer);
      timersRef.current.delete(timer);
    };
  }, []);

  // Listener management
  const addListener = useCallback((removeListener: () => void) => {
    listenersRef.current.add(removeListener);
    return () => {
      removeListener();
      listenersRef.current.delete(removeListener);
    };
  }, []);

  // App state change handler
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && cleanupOnBackground) {
      cleanup();
    }
  }, [cleanup, cleanupOnBackground]);

  // Memory warning handler
  const handleMemoryWarning = useCallback((warning: any) => {
    if (warning.level === 'high' || warning.level === 'critical') {
      console.warn('Memory warning received, performing cleanup:', warning.message);
      cleanup();
    }
  }, [cleanup]);

  useEffect(() => {
    if (!enableAutoCleanup) {
      return;
    }

    // Start memory monitoring
    memoryMonitor.startMonitoring();

    // Register memory warning callback
    const unsubscribeMemoryWarning = memoryMonitor.onMemoryWarning(handleMemoryWarning);
    addListener(unsubscribeMemoryWarning);

    // Register cleanup callback with memory monitor
    const unsubscribeCleanup = memoryMonitor.registerCleanupCallback(cleanup);
    addListener(unsubscribeCleanup);

    // Listen to app state changes
    const appStateListener = AppState.addEventListener('change', handleAppStateChange);
    addListener(() => appStateListener?.remove());

    // Set up periodic cleanup
    cleanupIntervalRef.current = setInterval(() => {
      const memoryTrend = memoryMonitor.getMemoryTrend();
      if (memoryTrend === 'increasing') {
        console.log('Memory trend increasing, performing periodic cleanup');
        clearCache();
      }
    }, cleanupInterval);

    return () => {
      cleanup();
      memoryMonitor.stopMonitoring();
    };
  }, [
    enableAutoCleanup,
    handleMemoryWarning,
    handleAppStateChange,
    cleanup,
    cleanupInterval,
    addListener,
    clearCache,
  ]);

  return {
    setCache,
    getCache,
    clearCache,
    addTimer,
    addListener,
    cleanup,
    getCacheSize: () => cacheRef.current.size,
    getTimerCount: () => timersRef.current.size,
    getListenerCount: () => listenersRef.current.size,
  };
};

// Hook for component-level memory optimization
export const useComponentMemoryOptimization = () => {
  const componentCache = useRef(new Map<string, any>());
  const componentTimers = useRef<Set<NodeJS.Timeout>>(new Set());

  const cleanup = useCallback(() => {
    componentCache.current.clear();
    componentTimers.current.forEach(timer => clearTimeout(timer));
    componentTimers.current.clear();
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const memoize = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ) => {
    return (...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (componentCache.current.has(key)) {
        return componentCache.current.get(key);
      }

      const result = fn(...args);
      componentCache.current.set(key, result);
      return result;
    };
  }, []);

  const debounce = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        componentTimers.current.delete(timeoutId);
      }

      timeoutId = setTimeout(() => {
        fn(...args);
        componentTimers.current.delete(timeoutId);
      }, delay);

      componentTimers.current.add(timeoutId);
    };
  }, []);

  const throttle = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ) => {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        
        const timeoutId = setTimeout(() => {
          inThrottle = false;
          componentTimers.current.delete(timeoutId);
        }, limit);

        componentTimers.current.add(timeoutId);
      }
    };
  }, []);

  return {
    cleanup,
    memoize,
    debounce,
    throttle,
    getCacheSize: () => componentCache.current.size,
  };
};