import AsyncStorage from '@react-native-async-storage/async-storage';
import { progressiveLoaderService } from '../progressiveLoader';
import { apiService } from '../api';
import { offlineSyncService } from '../offlineSync';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../api');
jest.mock('../offlineSync');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockOfflineSyncService = offlineSyncService as jest.Mocked<typeof offlineSyncService>;

describe('ProgressiveLoaderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();

    // Mock offline sync service
    mockOfflineSyncService.getOnlineStatus.mockReturnValue(true);
  });

  describe('Data Loading', () => {
    it('should load data with correct priority ordering', async () => {
      const requests = [
        {
          id: 'low_priority',
          type: 'test',
          endpoint: '/test/low',
          priority: { level: 'low' as const, order: 1 },
        },
        {
          id: 'critical_priority',
          type: 'test',
          endpoint: '/test/critical',
          priority: { level: 'critical' as const, order: 1 },
        },
        {
          id: 'high_priority',
          type: 'test',
          endpoint: '/test/high',
          priority: { level: 'high' as const, order: 1 },
        },
      ];

      // Mock API responses
      mockApiService.get.mockImplementation((endpoint) => {
        return Promise.resolve({
          success: true,
          data: { endpoint, data: 'test' },
        });
      });

      const results = await progressiveLoaderService.loadData(requests);

      expect(results.size).toBe(3);
      expect(results.has('critical_priority')).toBe(true);
      expect(results.has('high_priority')).toBe(true);
      expect(results.has('low_priority')).toBe(true);

      // Verify API calls were made in correct order (critical first)
      const calls = mockApiService.get.mock.calls;
      expect(calls[0][0]).toBe('/test/critical');
    });

    it('should use cached data when available', async () => {
      // Mock cached data
      const cachedData = {
        test_id: {
          data: { cached: true },
          timestamp: Date.now(),
          expiry: 5 * 60 * 1000,
        },
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedData));

      const requests = [
        {
          id: 'test_id',
          type: 'test',
          endpoint: '/test',
          priority: { level: 'high' as const, order: 1 },
        },
      ];

      const results = await progressiveLoaderService.loadData(requests);

      expect(results.get('test_id')).toEqual({ cached: true });
      expect(mockApiService.get).not.toHaveBeenCalled();
    });

    it('should handle expired cache correctly', async () => {
      // Mock expired cached data
      const expiredCachedData = {
        test_id: {
          data: { cached: true },
          timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
          expiry: 5 * 60 * 1000, // 5 minute expiry
        },
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(expiredCachedData));
      mockApiService.get.mockResolvedValueOnce({
        success: true,
        data: { fresh: true },
      });

      const requests = [
        {
          id: 'test_id',
          type: 'test',
          endpoint: '/test',
          priority: { level: 'high' as const, order: 1 },
        },
      ];

      const results = await progressiveLoaderService.loadData(requests);

      expect(results.get('test_id')).toEqual({ fresh: true });
      expect(mockApiService.get).toHaveBeenCalledWith('/test');
    });

    it('should process requests in batches', async () => {
      const requests = Array.from({ length: 12 }, (_, i) => ({
        id: `request_${i}`,
        type: 'test',
        endpoint: `/test/${i}`,
        priority: { level: 'medium' as const, order: i },
      }));

      mockApiService.get.mockImplementation((endpoint) => {
        return Promise.resolve({
          success: true,
          data: { endpoint },
        });
      });

      const results = await progressiveLoaderService.loadData(requests);

      expect(results.size).toBe(12);
      expect(mockApiService.get).toHaveBeenCalledTimes(12);
    });

    it('should handle API failures gracefully', async () => {
      const requests = [
        {
          id: 'success_request',
          type: 'test',
          endpoint: '/test/success',
          priority: { level: 'high' as const, order: 1 },
        },
        {
          id: 'fail_request',
          type: 'test',
          endpoint: '/test/fail',
          priority: { level: 'high' as const, order: 2 },
        },
      ];

      mockApiService.get.mockImplementation((endpoint) => {
        if (endpoint === '/test/fail') {
          return Promise.reject(new Error('API Error'));
        }
        return Promise.resolve({
          success: true,
          data: { endpoint },
        });
      });

      const results = await progressiveLoaderService.loadData(requests);

      expect(results.size).toBe(1);
      expect(results.has('success_request')).toBe(true);
      expect(results.has('fail_request')).toBe(false);
    });

    it('should retry failed requests', async () => {
      const requests = [
        {
          id: 'retry_request',
          type: 'test',
          endpoint: '/test/retry',
          priority: { level: 'high' as const, order: 1 },
        },
      ];

      // Mock API to fail twice then succeed
      let callCount = 0;
      mockApiService.get.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network Error'));
        }
        return Promise.resolve({
          success: true,
          data: { retried: true },
        });
      });

      const results = await progressiveLoaderService.loadData(requests);

      expect(results.get('retry_request')).toEqual({ retried: true });
      expect(mockApiService.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Preloading', () => {
    it('should preload critical data for user', async () => {
      mockApiService.get.mockImplementation((endpoint) => {
        return Promise.resolve({
          success: true,
          data: { endpoint },
        });
      });

      await progressiveLoaderService.preloadCriticalData('user123');

      expect(mockApiService.get).toHaveBeenCalledWith('/players/profile');
      expect(mockApiService.get).toHaveBeenCalledWith('/players/friends');
      expect(mockApiService.get).toHaveBeenCalledWith('/games/achievements');
    });

    it('should load game-specific data', async () => {
      mockApiService.get.mockImplementation((endpoint) => {
        return Promise.resolve({
          success: true,
          data: { endpoint },
        });
      });

      const results = await progressiveLoaderService.loadGameData('room123');

      expect(results.has('room_details')).toBe(true);
      expect(results.has('room_players')).toBe(true);
      expect(results.has('game_history')).toBe(true);
      expect(mockApiService.get).toHaveBeenCalledWith('/rooms/room123');
      expect(mockApiService.get).toHaveBeenCalledWith('/rooms/room123/players');
    });

    it('should load social data', async () => {
      mockApiService.get.mockImplementation((endpoint) => {
        return Promise.resolve({
          success: true,
          data: { endpoint },
        });
      });

      const results = await progressiveLoaderService.loadSocialData();

      expect(results.has('friends_activities')).toBe(true);
      expect(results.has('friends_leaderboard')).toBe(true);
      expect(results.has('public_rooms')).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate cache by pattern', () => {
      // This would need to be tested with actual cache data
      // For now, just verify the method exists and can be called
      expect(() => {
        progressiveLoaderService.invalidateCache('user_');
      }).not.toThrow();
    });

    it('should clear all cache', async () => {
      await progressiveLoaderService.clearCache();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('progressive_cache');
    });

    it('should provide cache statistics', () => {
      const stats = progressiveLoaderService.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('cacheHits');
    });
  });

  describe('Prefetching', () => {
    it('should prefetch data based on user context', async () => {
      const userContext = {
        currentScreen: 'main_menu',
        recentActions: ['view_friends', 'browse_rooms'],
        preferences: { enablePrefetch: true },
      };

      mockApiService.get.mockResolvedValue({
        success: true,
        data: { prefetched: true },
      });

      await progressiveLoaderService.prefetchData(userContext);

      // Should have made prefetch requests based on current screen
      expect(mockApiService.get).toHaveBeenCalledWith('/rooms/public');
      expect(mockApiService.get).toHaveBeenCalledWith('/players/friends/status');
    });

    it('should handle prefetch failures gracefully', async () => {
      const userContext = {
        currentScreen: 'main_menu',
        recentActions: [],
        preferences: {},
      };

      mockApiService.get.mockRejectedValue(new Error('Prefetch failed'));

      // Should not throw error
      await expect(
        progressiveLoaderService.prefetchData(userContext)
      ).resolves.not.toThrow();
    });
  });

  describe('Strategy Configuration', () => {
    it('should update loading strategy', () => {
      const newStrategy = {
        batchSize: 10,
        maxConcurrent: 5,
        retryAttempts: 5,
      };

      progressiveLoaderService.updateStrategy(newStrategy);

      // Strategy should be updated (this would need internal access to verify)
      expect(() => {
        progressiveLoaderService.updateStrategy(newStrategy);
      }).not.toThrow();
    });
  });

  describe('Offline Handling', () => {
    it('should handle offline scenarios', async () => {
      mockOfflineSyncService.getOnlineStatus.mockReturnValue(false);

      const requests = [
        {
          id: 'offline_request',
          type: 'test',
          endpoint: '/test',
          priority: { level: 'high' as const, order: 1 },
        },
      ];

      mockApiService.get.mockRejectedValue(new Error('Network unavailable'));

      const results = await progressiveLoaderService.loadData(requests);

      // Should handle offline gracefully
      expect(results.size).toBe(0);
      expect(mockApiService.get).toHaveBeenCalled();
    });
  });
});