import { clientCacheManager } from '../clientCache';
import { memoryMonitor } from '../memoryMonitor';
import { performanceBenchmarks } from '../performanceBenchmarks';

// Mock React for testing
const React = {
  useState: jest.fn(() => [null, jest.fn()]),
  useEffect: jest.fn(),
};

global.React = React;

describe('Frontend Performance Utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Client Cache Manager', () => {
    it('should create and manage caches', async () => {
      const cache = clientCacheManager.createCache('test-cache', {
        ttl: 300,
        maxSize: 1024 * 1024, // 1MB
      });

      await cache.set('test-key', { data: 'test-value' });
      const result = cache.get('test-key');

      expect(result).toEqual({ data: 'test-value' });
      expect(cache.has('test-key')).toBe(true);
    });

    it('should handle cache expiration', async () => {
      const cache = clientCacheManager.createCache('expiry-test', {
        ttl: 0.1, // 100ms
        maxSize: 1024 * 1024,
      });

      await cache.set('expiring-key', 'expiring-value');
      expect(cache.get('expiring-key')).toBe('expiring-value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('expiring-key')).toBeUndefined();
    });

    it('should provide cache statistics', async () => {
      const cache = clientCacheManager.createCache('stats-test');
      
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Memory Monitor', () => {
    it('should track memory usage', () => {
      const currentStats = memoryMonitor.getCurrentMemoryUsage();
      
      expect(currentStats).toBeDefined();
      expect(currentStats.usedJSHeapSize).toBeGreaterThan(0);
      expect(currentStats.totalJSHeapSize).toBeGreaterThan(0);
      expect(currentStats.timestamp).toBeGreaterThan(0);
    });

    it('should detect memory trends', () => {
      // Simulate some memory history
      for (let i = 0; i < 10; i++) {
        memoryMonitor['memoryHistory'].push({
          usedJSHeapSize: 50 * 1024 * 1024 + (i * 1024 * 1024), // Increasing memory
          totalJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 500 * 1024 * 1024,
          timestamp: Date.now() + (i * 1000),
        });
      }

      const trend = memoryMonitor.getMemoryTrend();
      expect(['increasing', 'decreasing', 'stable']).toContain(trend);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should run benchmarks correctly', async () => {
      const result = await performanceBenchmarks.runBenchmark(
        'test-benchmark',
        () => {
          // Simple operation
          return Math.random() * 100;
        },
        10
      );

      expect(result.name).toBe('test-benchmark');
      expect(result.iterations).toBe(10);
      expect(result.averageTime).toBeGreaterThan(0);
      expect(result.throughput).toBeGreaterThan(0);
    });

    it('should track component render metrics', () => {
      performanceBenchmarks.trackComponentRender('TestComponent', 15.5);
      
      const metrics = performanceBenchmarks.getRenderMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].componentName).toBe('TestComponent');
      expect(metrics[0].renderTime).toBe(15.5);
      expect(metrics[0].rerenderCount).toBe(1);
    });

    it('should generate performance reports', async () => {
      // Run a few benchmarks
      await performanceBenchmarks.runBenchmark('operation-1', () => Math.random(), 5);
      await performanceBenchmarks.runBenchmark('operation-2', () => Math.random(), 5);
      
      performanceBenchmarks.trackComponentRender('Component1', 10);
      performanceBenchmarks.trackComponentRender('Component2', 20);

      const report = performanceBenchmarks.generateReport();
      
      expect(report.summary.totalBenchmarks).toBe(2);
      expect(report.benchmarks).toHaveLength(2);
      expect(report.renderMetrics).toHaveLength(2);
      expect(report.summary.averagePerformance).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for comprehensive performance monitoring', async () => {
      // Create cache
      const cache = clientCacheManager.createCache('integration-test');
      
      // Run benchmark that uses cache
      const benchmark = await performanceBenchmarks.runBenchmark(
        'cache-integration-test',
        async () => {
          await cache.set(`key-${Math.random()}`, { data: 'test' });
          return cache.get('key-0.5');
        },
        10
      );

      expect(benchmark.averageTime).toBeGreaterThan(0);
      
      // Check memory usage
      const memoryStats = memoryMonitor.getCurrentMemoryUsage();
      expect(memoryStats.usedJSHeapSize).toBeGreaterThan(0);
      
      // Check cache stats
      const cacheStats = clientCacheManager.getAllStats();
      expect(cacheStats['integration-test']).toBeDefined();
    });
  });
});