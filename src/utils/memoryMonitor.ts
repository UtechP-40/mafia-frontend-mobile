import { AppState, AppStateStatus } from 'react-native';

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface MemoryWarning {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  stats: MemoryStats;
}

class MemoryMonitor {
  private static instance: MemoryMonitor;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private memoryHistory: MemoryStats[] = [];
  private maxHistorySize = 100;
  private warningCallbacks: ((warning: MemoryWarning) => void)[] = [];
  private cleanupCallbacks: (() => void)[] = [];

  // Memory thresholds (in MB)
  private readonly MEMORY_THRESHOLDS = {
    low: 50,
    medium: 100,
    high: 150,
    critical: 200,
  };

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, intervalMs);

    // Monitor app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'background') {
      this.triggerCleanup();
    } else if (nextAppState === 'active') {
      this.checkMemoryUsage();
    }
  };

  private checkMemoryUsage(): void {
    const stats = this.getCurrentMemoryStats();
    this.memoryHistory.push(stats);

    // Keep history size manageable
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    const usedMemoryMB = stats.usedJSHeapSize / (1024 * 1024);
    const warningLevel = this.getWarningLevel(usedMemoryMB);

    if (warningLevel) {
      const warning: MemoryWarning = {
        level: warningLevel,
        message: this.getWarningMessage(warningLevel, usedMemoryMB),
        timestamp: Date.now(),
        stats,
      };

      this.notifyWarning(warning);

      if (warningLevel === 'critical') {
        this.triggerEmergencyCleanup();
      }
    }
  }

  private getCurrentMemoryStats(): MemoryStats {
    // In a real React Native app, you'd use a native module to get actual memory stats
    // For now, we'll simulate with performance.memory if available
    const memory = (performance as any).memory;
    
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }

    // Fallback simulation
    return {
      usedJSHeapSize: Math.random() * 100 * 1024 * 1024, // Random value up to 100MB
      totalJSHeapSize: 200 * 1024 * 1024, // 200MB
      jsHeapSizeLimit: 500 * 1024 * 1024, // 500MB
      timestamp: Date.now(),
    };
  }

  private getWarningLevel(usedMemoryMB: number): 'low' | 'medium' | 'high' | 'critical' | null {
    if (usedMemoryMB > this.MEMORY_THRESHOLDS.critical) {
      return 'critical';
    } else if (usedMemoryMB > this.MEMORY_THRESHOLDS.high) {
      return 'high';
    } else if (usedMemoryMB > this.MEMORY_THRESHOLDS.medium) {
      return 'medium';
    } else if (usedMemoryMB > this.MEMORY_THRESHOLDS.low) {
      return 'low';
    }
    return null;
  }

  private getWarningMessage(level: string, usedMemoryMB: number): string {
    const messages = {
      low: `Memory usage is elevated: ${usedMemoryMB.toFixed(1)}MB`,
      medium: `Memory usage is high: ${usedMemoryMB.toFixed(1)}MB`,
      high: `Memory usage is very high: ${usedMemoryMB.toFixed(1)}MB`,
      critical: `Critical memory usage: ${usedMemoryMB.toFixed(1)}MB - triggering cleanup`,
    };
    return messages[level as keyof typeof messages];
  }

  private notifyWarning(warning: MemoryWarning): void {
    this.warningCallbacks.forEach(callback => {
      try {
        callback(warning);
      } catch (error) {
        console.error('Error in memory warning callback:', error);
      }
    });
  }

  private triggerCleanup(): void {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });
  }

  private triggerEmergencyCleanup(): void {
    console.warn('Triggering emergency memory cleanup');
    
    // Clear memory history except for the last few entries
    this.memoryHistory = this.memoryHistory.slice(-10);
    
    // Trigger all cleanup callbacks
    this.triggerCleanup();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  // Public API methods
  onMemoryWarning(callback: (warning: MemoryWarning) => void): () => void {
    this.warningCallbacks.push(callback);
    return () => {
      const index = this.warningCallbacks.indexOf(callback);
      if (index > -1) {
        this.warningCallbacks.splice(index, 1);
      }
    };
  }

  registerCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.push(callback);
    return () => {
      const index = this.cleanupCallbacks.indexOf(callback);
      if (index > -1) {
        this.cleanupCallbacks.splice(index, 1);
      }
    };
  }

  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  getCurrentMemoryUsage(): MemoryStats {
    return this.getCurrentMemoryStats();
  }

  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 5) {
      return 'stable';
    }

    const recent = this.memoryHistory.slice(-5);
    const trend = recent.reduce((acc, curr, index) => {
      if (index === 0) return acc;
      const prev = recent[index - 1];
      return acc + (curr.usedJSHeapSize - prev.usedJSHeapSize);
    }, 0);

    const threshold = 5 * 1024 * 1024; // 5MB threshold
    if (trend > threshold) {
      return 'increasing';
    } else if (trend < -threshold) {
      return 'decreasing';
    }
    return 'stable';
  }

  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    } else {
      console.warn('Garbage collection not available');
    }
  }
}

export const memoryMonitor = MemoryMonitor.getInstance();

// React hook for memory monitoring
export const useMemoryMonitor = () => {
  const [memoryStats, setMemoryStats] = React.useState<MemoryStats | null>(null);
  const [memoryWarnings, setMemoryWarnings] = React.useState<MemoryWarning[]>([]);

  React.useEffect(() => {
    const unsubscribeWarning = memoryMonitor.onMemoryWarning((warning) => {
      setMemoryWarnings(prev => [...prev.slice(-9), warning]); // Keep last 10 warnings
    });

    const updateStats = () => {
      setMemoryStats(memoryMonitor.getCurrentMemoryUsage());
    };

    const interval = setInterval(updateStats, 2000);
    updateStats();

    return () => {
      unsubscribeWarning();
      clearInterval(interval);
    };
  }, []);

  return {
    memoryStats,
    memoryWarnings,
    memoryTrend: memoryMonitor.getMemoryTrend(),
    forceCleanup: () => memoryMonitor.forceGarbageCollection(),
  };
};