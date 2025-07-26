import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { offlineSyncService } from './offlineSync';

// Types for progressive loading
export interface LoadingPriority {
  level: 'critical' | 'high' | 'medium' | 'low';
  order: number;
}

export interface DataChunk {
  id: string;
  type: string;
  data: any;
  priority: LoadingPriority;
  size: number;
  timestamp: number;
  cached: boolean;
}

export interface LoadingStrategy {
  batchSize: number;
  maxConcurrent: number;
  retryAttempts: number;
  cacheExpiry: number; // in milliseconds
}

// Storage keys
const CACHED_DATA_KEY = 'progressive_cache';
const LOADING_METADATA_KEY = 'loading_metadata';

class ProgressiveLoaderService {
  private loadingQueue: DataChunk[] = [];
  private activeLoads: Map<string, Promise<any>> = new Map();
  private cache: Map<string, { data: any; timestamp: number; expiry: number }> = new Map();
  private strategy: LoadingStrategy = {
    batchSize: 5,
    maxConcurrent: 3,
    retryAttempts: 3,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
  };

  constructor() {
    this.initializeCache();
  }

  // Initialize cache from storage
  private async initializeCache(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHED_DATA_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const now = Date.now();
        
        // Filter out expired entries
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (value.timestamp + value.expiry > now) {
            this.cache.set(key, value);
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize progressive loader cache:', error);
    }
  }

  // Save cache to storage
  private async saveCache(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem(CACHED_DATA_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Failed to save progressive loader cache:', error);
    }
  }

  // Load data progressively based on priority
  async loadData(requests: Array<{
    id: string;
    type: string;
    endpoint: string;
    priority: LoadingPriority;
    params?: any;
  }>): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // Check cache first
    const uncachedRequests = requests.filter(req => {
      const cached = this.getCachedData(req.id);
      if (cached) {
        results.set(req.id, cached);
        return false;
      }
      return true;
    });

    if (uncachedRequests.length === 0) {
      return results;
    }

    // Sort by priority
    const sortedRequests = uncachedRequests.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority.level] - priorityOrder[a.priority.level];
      return priorityDiff !== 0 ? priorityDiff : a.priority.order - b.priority.order;
    });

    // Process in batches
    const batches = this.createBatches(sortedRequests, this.strategy.batchSize);
    
    for (const batch of batches) {
      const batchPromises = batch.map(req => this.loadSingleData(req));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const request = batch[index];
        if (result.status === 'fulfilled') {
          results.set(request.id, result.value);
          this.setCachedData(request.id, result.value, request.type);
        } else {
          console.error(`Failed to load ${request.id}:`, result.reason);
          // Store offline if available
          if (!offlineSyncService.getOnlineStatus()) {
            const offlineData = this.getOfflineData(request.id);
            if (offlineData) {
              results.set(request.id, offlineData);
            }
          }
        }
      });
    }

    await this.saveCache();
    return results;
  }

  // Load single data item
  private async loadSingleData(request: {
    id: string;
    type: string;
    endpoint: string;
    params?: any;
  }): Promise<any> {
    // Check if already loading
    if (this.activeLoads.has(request.id)) {
      return this.activeLoads.get(request.id);
    }

    const loadPromise = this.executeLoad(request);
    this.activeLoads.set(request.id, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.activeLoads.delete(request.id);
    }
  }

  // Execute the actual load
  private async executeLoad(request: {
    endpoint: string;
    params?: any;
  }): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.strategy.retryAttempts; attempt++) {
      try {
        if (request.params) {
          const response = await apiService.post(request.endpoint, request.params);
          return response.data;
        } else {
          const response = await apiService.get(request.endpoint);
          return response.data;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Exponential backoff
        if (attempt < this.strategy.retryAttempts - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError;
  }

  // Create batches from requests
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // Get cached data
  private getCachedData(id: string): any | null {
    const cached = this.cache.get(id);
    if (!cached) return null;

    const now = Date.now();
    if (cached.timestamp + cached.expiry < now) {
      this.cache.delete(id);
      return null;
    }

    return cached.data;
  }

  // Set cached data
  private setCachedData(id: string, data: any, type: string): void {
    const expiry = this.getExpiryForType(type);
    this.cache.set(id, {
      data,
      timestamp: Date.now(),
      expiry,
    });
  }

  // Get expiry time based on data type
  private getExpiryForType(type: string): number {
    const expiryMap: Record<string, number> = {
      'player_profile': 10 * 60 * 1000, // 10 minutes
      'game_history': 5 * 60 * 1000,   // 5 minutes
      'friends_list': 2 * 60 * 1000,   // 2 minutes
      'public_rooms': 30 * 1000,       // 30 seconds
      'achievements': 30 * 60 * 1000,  // 30 minutes
      'statistics': 5 * 60 * 1000,     // 5 minutes
    };

    return expiryMap[type] || this.strategy.cacheExpiry;
  }

  // Get offline data fallback
  private getOfflineData(id: string): any | null {
    // This would integrate with the offline sync service
    // to provide cached data when offline
    return null;
  }

  // Preload critical data
  async preloadCriticalData(userId: string): Promise<void> {
    const criticalRequests = [
      {
        id: 'user_profile',
        type: 'player_profile',
        endpoint: '/players/profile',
        priority: { level: 'critical' as const, order: 1 },
      },
      {
        id: 'user_friends',
        type: 'friends_list',
        endpoint: '/players/friends',
        priority: { level: 'critical' as const, order: 2 },
      },
      {
        id: 'user_achievements',
        type: 'achievements',
        endpoint: '/games/achievements',
        priority: { level: 'high' as const, order: 1 },
      },
    ];

    await this.loadData(criticalRequests);
  }

  // Load game-specific data
  async loadGameData(roomId: string): Promise<Map<string, any>> {
    const gameRequests = [
      {
        id: 'room_details',
        type: 'room_details',
        endpoint: `/rooms/${roomId}`,
        priority: { level: 'critical' as const, order: 1 },
      },
      {
        id: 'room_players',
        type: 'room_players',
        endpoint: `/rooms/${roomId}/players`,
        priority: { level: 'critical' as const, order: 2 },
      },
      {
        id: 'game_history',
        type: 'game_history',
        endpoint: '/games/history',
        priority: { level: 'medium' as const, order: 1 },
        params: { limit: 10 },
      },
    ];

    return this.loadData(gameRequests);
  }

  // Load social data
  async loadSocialData(): Promise<Map<string, any>> {
    const socialRequests = [
      {
        id: 'friends_activities',
        type: 'friends_activities',
        endpoint: '/players/friends/activities',
        priority: { level: 'medium' as const, order: 1 },
      },
      {
        id: 'friends_leaderboard',
        type: 'friends_leaderboard',
        endpoint: '/players/friends/leaderboard',
        priority: { level: 'low' as const, order: 1 },
      },
      {
        id: 'public_rooms',
        type: 'public_rooms',
        endpoint: '/rooms/public',
        priority: { level: 'medium' as const, order: 2 },
      },
    ];

    return this.loadData(socialRequests);
  }

  // Invalidate cache for specific data type
  invalidateCache(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    this.saveCache();
  }

  // Clear all cache
  async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem(CACHED_DATA_KEY);
  }

  // Get cache statistics
  getCacheStats(): {
    size: number;
    hitRate: number;
    totalRequests: number;
    cacheHits: number;
  } {
    // This would be implemented with proper tracking
    return {
      size: this.cache.size,
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
    };
  }

  // Update loading strategy
  updateStrategy(newStrategy: Partial<LoadingStrategy>): void {
    this.strategy = { ...this.strategy, ...newStrategy };
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Prefetch data based on user behavior
  async prefetchData(userContext: {
    currentScreen: string;
    recentActions: string[];
    preferences: any;
  }): Promise<void> {
    const prefetchRequests: Array<{
      id: string;
      type: string;
      endpoint: string;
      priority: LoadingPriority;
    }> = [];

    // Predict what data user might need next
    switch (userContext.currentScreen) {
      case 'main_menu':
        prefetchRequests.push(
          {
            id: 'public_rooms_prefetch',
            type: 'public_rooms',
            endpoint: '/rooms/public',
            priority: { level: 'low', order: 1 },
          },
          {
            id: 'friends_status_prefetch',
            type: 'friends_status',
            endpoint: '/players/friends/status',
            priority: { level: 'low', order: 2 },
          }
        );
        break;

      case 'game_lobby':
        prefetchRequests.push({
          id: 'game_settings_prefetch',
          type: 'game_settings',
          endpoint: '/games/settings',
          priority: { level: 'medium', order: 1 },
        });
        break;
    }

    if (prefetchRequests.length > 0) {
      // Load in background without blocking
      this.loadData(prefetchRequests).catch(error => {
        console.warn('Prefetch failed:', error);
      });
    }
  }
}

// Export singleton instance
export const progressiveLoaderService = new ProgressiveLoaderService();