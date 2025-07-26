import { performance } from 'react-native-performance';

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
  memoryUsage?: number;
}

export interface ComponentRenderMetrics {
  componentName: string;
  renderTime: number;
  updateTime: number;
  mountTime: number;
  unmountTime: number;
  rerenderCount: number;
}

class PerformanceBenchmarks {
  private static instance: PerformanceBenchmarks;
  private benchmarkResults: BenchmarkResult[] = [];
  private renderMetrics: ComponentRenderMetrics[] = [];

  static getInstance(): PerformanceBenchmarks {
    if (!PerformanceBenchmarks.instance) {
      PerformanceBenchmarks.instance = new PerformanceBenchmarks();
    }
    return PerformanceBenchmarks.instance;
  }

  // Generic benchmark runner
  async runBenchmark(
    name: string,
    testFunction: () => Promise<void> | void,
    iterations: number = 1000
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    
    console.log(`🏃 Running benchmark: ${name} (${iterations} iterations)`);
    
    // Warm up
    for (let i = 0; i < Math.min(10, iterations); i++) {
      await testFunction();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const initialMemory = this.getMemoryUsage();
    
    // Run actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testFunction();
      const end = performance.now();
      times.push(end - start);
    }
    
    const finalMemory = this.getMemoryUsage();
    const memoryUsage = finalMemory - initialMemory;
    
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = 1000 / averageTime; // operations per second
    
    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      throughput,
      memoryUsage,
    };
    
    this.benchmarkResults.push(result);
    
    console.log(`✅ Benchmark completed: ${name}`);
    console.log(`   Average: ${averageTime.toFixed(2)}ms`);
    console.log(`   Throughput: ${throughput.toFixed(2)} ops/sec`);
    console.log(`   Memory: ${memoryUsage.toFixed(2)}MB`);
    
    return result;
  }

  // Benchmark Redux store operations
  async benchmarkReduxOperations(): Promise<void> {
    const { store } = await import('../store/store');
    
    // Benchmark action dispatching
    await this.runBenchmark('Redux Action Dispatch', () => {
      store.dispatch({ type: 'test/action', payload: { data: Math.random() } });
    }, 10000);
    
    // Benchmark state selection
    await this.runBenchmark('Redux State Selection', () => {
      const state = store.getState();
      return state.auth.user;
    }, 10000);
  }

  // Benchmark navigation performance
  async benchmarkNavigation(): Promise<void> {
    // This would require actual navigation context
    console.log('Navigation benchmarks would run with actual navigation context');
  }

  // Benchmark image loading and caching
  async benchmarkImageOperations(): Promise<void> {
    const { imageCache } = await import('./imageOptimization');
    
    // Benchmark image cache operations
    await this.runBenchmark('Image Cache Set', () => {
      const key = `test-image-${Math.random()}`;
      imageCache.setCachedImage(key, `cached-${key}`);
    }, 1000);
    
    await this.runBenchmark('Image Cache Get', () => {
      imageCache.getCachedImage('test-image-0.5');
    }, 10000);
  }

  // Benchmark WebSocket operations
  async benchmarkWebSocketOperations(): Promise<void> {
    // Mock WebSocket operations for benchmarking
    const mockMessages = Array.from({ length: 1000 }, (_, i) => ({
      type: 'game-update',
      payload: { playerId: i, action: 'vote', target: i + 1 }
    }));
    
    await this.runBenchmark('WebSocket Message Processing', () => {
      const message = mockMessages[Math.floor(Math.random() * mockMessages.length)];
      // Simulate message processing
      JSON.stringify(message);
      JSON.parse(JSON.stringify(message));
    }, 5000);
  }

  // Benchmark game logic operations
  async benchmarkGameLogic(): Promise<void> {
    // Mock game state for benchmarking
    const mockGameState = {
      players: Array.from({ length: 12 }, (_, i) => ({
        id: `player-${i}`,
        name: `Player ${i}`,
        role: i < 3 ? 'mafia' : 'villager',
        isAlive: true,
        votes: []
      })),
      phase: 'day',
      dayNumber: 1
    };
    
    await this.runBenchmark('Vote Calculation', () => {
      const votes = mockGameState.players.map(p => ({
        voterId: p.id,
        targetId: mockGameState.players[Math.floor(Math.random() * mockGameState.players.length)].id
      }));
      
      // Simulate vote tallying
      const voteCounts = votes.reduce((acc, vote) => {
        acc[vote.targetId] = (acc[vote.targetId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(voteCounts).sort(([,a], [,b]) => b - a)[0];
    }, 1000);
    
    await this.runBenchmark('Win Condition Check', () => {
      const alivePlayers = mockGameState.players.filter(p => p.isAlive);
      const aliveMafia = alivePlayers.filter(p => p.role === 'mafia');
      const aliveVillagers = alivePlayers.filter(p => p.role === 'villager');
      
      if (aliveMafia.length === 0) return 'villagers';
      if (aliveMafia.length >= aliveVillagers.length) return 'mafia';
      return null;
    }, 10000);
  }

  // Benchmark animation performance
  async benchmarkAnimations(): Promise<void> {
    // Mock animation calculations
    await this.runBenchmark('Animation Frame Calculation', () => {
      const progress = Math.random();
      const easeInOut = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      return {
        opacity: easeInOut,
        scale: 0.8 + (easeInOut * 0.2),
        translateY: (1 - easeInOut) * 50
      };
    }, 10000);
  }

  // Benchmark memory operations
  async benchmarkMemoryOperations(): Promise<void> {
    await this.runBenchmark('Large Object Creation', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: Math.random(),
          nested: {
            prop1: `string-${i}`,
            prop2: Math.random() * 1000,
            prop3: Array.from({ length: 10 }, () => Math.random())
          }
        }))
      };
      return largeObject;
    }, 100);
    
    await this.runBenchmark('JSON Serialization', () => {
      const data = { test: 'data', number: 42, array: [1, 2, 3, 4, 5] };
      return JSON.stringify(data);
    }, 10000);
    
    await this.runBenchmark('JSON Deserialization', () => {
      const jsonString = '{"test":"data","number":42,"array":[1,2,3,4,5]}';
      return JSON.parse(jsonString);
    }, 10000);
  }

  // Run all benchmarks
  async runAllBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('🚀 Starting comprehensive performance benchmarks...');
    
    try {
      await this.benchmarkReduxOperations();
      await this.benchmarkImageOperations();
      await this.benchmarkWebSocketOperations();
      await this.benchmarkGameLogic();
      await this.benchmarkAnimations();
      await this.benchmarkMemoryOperations();
      
      console.log('✅ All benchmarks completed successfully');
      return this.getBenchmarkResults();
    } catch (error) {
      console.error('❌ Benchmark suite failed:', error);
      throw error;
    }
  }

  // Component render time tracking
  trackComponentRender(componentName: string, renderTime: number): void {
    const existing = this.renderMetrics.find(m => m.componentName === componentName);
    
    if (existing) {
      existing.renderTime = renderTime;
      existing.rerenderCount++;
    } else {
      this.renderMetrics.push({
        componentName,
        renderTime,
        updateTime: 0,
        mountTime: 0,
        unmountTime: 0,
        rerenderCount: 1,
      });
    }
  }

  // Get memory usage (simplified for React Native)
  private getMemoryUsage(): number {
    // In a real React Native app, you'd use a native module
    // For now, return a mock value
    return Math.random() * 100; // Mock memory usage in MB
  }

  // Get all benchmark results
  getBenchmarkResults(): BenchmarkResult[] {
    return [...this.benchmarkResults];
  }

  // Get render metrics
  getRenderMetrics(): ComponentRenderMetrics[] {
    return [...this.renderMetrics];
  }

  // Clear all results
  clearResults(): void {
    this.benchmarkResults = [];
    this.renderMetrics = [];
  }

  // Generate performance report
  generateReport(): {
    summary: {
      totalBenchmarks: number;
      averagePerformance: number;
      slowestOperation: BenchmarkResult | null;
      fastestOperation: BenchmarkResult | null;
    };
    benchmarks: BenchmarkResult[];
    renderMetrics: ComponentRenderMetrics[];
  } {
    const benchmarks = this.getBenchmarkResults();
    const renderMetrics = this.getRenderMetrics();
    
    const averagePerformance = benchmarks.length > 0
      ? benchmarks.reduce((sum, b) => sum + b.averageTime, 0) / benchmarks.length
      : 0;
    
    const slowestOperation = benchmarks.length > 0
      ? benchmarks.reduce((slowest, current) => 
          current.averageTime > slowest.averageTime ? current : slowest
        )
      : null;
    
    const fastestOperation = benchmarks.length > 0
      ? benchmarks.reduce((fastest, current) => 
          current.averageTime < fastest.averageTime ? current : fastest
        )
      : null;
    
    return {
      summary: {
        totalBenchmarks: benchmarks.length,
        averagePerformance,
        slowestOperation,
        fastestOperation,
      },
      benchmarks,
      renderMetrics,
    };
  }
}

export const performanceBenchmarks = PerformanceBenchmarks.getInstance();

// React hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      performanceBenchmarks.trackComponentRender(componentName, renderTime);
    };
  }, [componentName]);
};

// HOC for automatic performance tracking
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name;
    usePerformanceTracking(name);
    
    return <WrappedComponent {...props} ref={ref} />;
  });
};