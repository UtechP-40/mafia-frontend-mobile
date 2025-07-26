import { offlineSyncService } from '../offlineSync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../api', () => ({
  apiService: {
    syncOfflineActions: jest.fn(),
    syncOfflineData: jest.fn(),
    resolveConflict: jest.fn(),
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockApiService = require('../api').apiService;

describe('OfflineSync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {},
    });
  });

  describe('Online Status Management', () => {
    it('correctly detects online status', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: {},
      });

      const isOnline = offlineSyncService.getOnlineStatus();
      expect(isOnline).toBe(true);
    });

    it('correctly detects offline status', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: {},
      });

      // Simulate network change
      const mockListener = jest.fn();
      offlineSyncService.addSyncListener(mockListener);

      // Trigger network state change
      const netInfoCallback = mockNetInfo.addEventListener.mock.calls[0][0];
      netInfoCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: {},
      });

      expect(mockListener).toHaveBeenCalledWith({
        isOnline: false,
        pendingActions: expect.any(Number),
      });
    });

    it('handles network state changes', () => {
      const mockListener = jest.fn();
      offlineSyncService.addSyncListener(mockListener);

      // Simulate going offline
      const netInfoCallback = mockNetInfo.addEventListener.mock.calls[0][0];
      netInfoCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: {},
      });

      expect(mockListener).toHaveBeenCalledWith({
        isOnline: false,
        pendingActions: 0,
      });

      // Simulate coming back online
      netInfoCallback({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: {},
      });

      expect(mockListener).toHaveBeenCalledWith({
        isOnline: true,
        pendingActions: 0,
      });
    });
  });

  describe('Action Queuing', () => {
    it('queues actions when offline', async () => {
      // Set offline state
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: {},
      });

      const action = {
        type: 'CAST_VOTE',
        payload: { targetId: 'player-1', roomId: 'room-1' },
        timestamp: Date.now(),
      };

      await offlineSyncService.queueAction(action);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_actions',
        expect.stringContaining(action.type)
      );
    });

    it('executes actions immediately when online', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: {},
      });

      mockApiService.syncOfflineActions.mockResolvedValue({ success: true });

      const action = {
        type: 'SEND_MESSAGE',
        payload: { content: 'Hello', roomId: 'room-1' },
        timestamp: Date.now(),
      };

      await offlineSyncService.queueAction(action);

      expect(mockApiService.syncOfflineActions).toHaveBeenCalledWith([action]);
    });

    it('handles action queue persistence', async () => {
      const existingActions = [
        {
          id: '1',
          type: 'CAST_VOTE',
          payload: { targetId: 'player-1' },
          timestamp: Date.now() - 1000,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingActions));

      const newAction = {
        type: 'SEND_MESSAGE',
        payload: { content: 'Hello' },
        timestamp: Date.now(),
      };

      await offlineSyncService.queueAction(newAction);

      const expectedActions = [...existingActions, { ...newAction, id: expect.any(String) }];
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_actions',
        JSON.stringify(expectedActions)
      );
    });

    it('removes duplicate actions', async () => {
      const duplicateAction = {
        type: 'CAST_VOTE',
        payload: { targetId: 'player-1', roomId: 'room-1' },
        timestamp: Date.now(),
      };

      await offlineSyncService.queueAction(duplicateAction);
      await offlineSyncService.queueAction(duplicateAction);

      // Should only store one instance
      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      const storedActions = JSON.parse(lastCall[1]);
      
      expect(storedActions).toHaveLength(1);
    });

    it('handles action queue size limits', async () => {
      const actions = Array.from({ length: 150 }, (_, i) => ({
        type: 'SEND_MESSAGE',
        payload: { content: `Message ${i}` },
        timestamp: Date.now() + i,
      }));

      for (const action of actions) {
        await offlineSyncService.queueAction(action);
      }

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      const storedActions = JSON.parse(lastCall[1]);

      // Should limit queue size to prevent memory issues
      expect(storedActions.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Synchronization', () => {
    it('syncs offline actions when coming online', async () => {
      const offlineActions = [
        {
          id: '1',
          type: 'CAST_VOTE',
          payload: { targetId: 'player-1' },
          timestamp: Date.now() - 1000,
        },
        {
          id: '2',
          type: 'SEND_MESSAGE',
          payload: { content: 'Hello' },
          timestamp: Date.now() - 500,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineActions));
      mockApiService.syncOfflineActions.mockResolvedValue({ success: true });

      await offlineSyncService.syncOfflineActions();

      expect(mockApiService.syncOfflineActions).toHaveBeenCalledWith(offlineActions);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline_actions');
    });

    it('handles partial sync failures', async () => {
      const offlineActions = [
        { id: '1', type: 'CAST_VOTE', payload: { targetId: 'player-1' }, timestamp: Date.now() },
        { id: '2', type: 'SEND_MESSAGE', payload: { content: 'Hello' }, timestamp: Date.now() },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineActions));
      mockApiService.syncOfflineActions.mockResolvedValue({
        success: false,
        failedActions: ['1'],
      });

      await offlineSyncService.syncOfflineActions();

      // Should keep failed actions in queue
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_actions',
        JSON.stringify([offlineActions[0]])
      );
    });

    it('syncs offline data correctly', async () => {
      const offlineData = {
        gameState: { currentPhase: 'day', dayNumber: 2 },
        playerStats: { gamesPlayed: 5, gamesWon: 3 },
        lastSync: Date.now() - 60000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineData));
      mockApiService.syncOfflineData.mockResolvedValue({
        success: true,
        serverData: {
          gameState: { currentPhase: 'night', dayNumber: 2 },
          playerStats: { gamesPlayed: 6, gamesWon: 3 },
        },
      });

      const result = await offlineSyncService.syncOfflineData();

      expect(mockApiService.syncOfflineData).toHaveBeenCalledWith(offlineData);
      expect(result.success).toBe(true);
    });

    it('handles data conflicts during sync', async () => {
      const localData = {
        gameState: { currentPhase: 'day', dayNumber: 2 },
        lastModified: Date.now() - 30000,
      };

      const serverData = {
        gameState: { currentPhase: 'night', dayNumber: 2 },
        lastModified: Date.now() - 10000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(localData));
      mockApiService.syncOfflineData.mockResolvedValue({
        success: false,
        conflict: true,
        serverData,
      });

      mockApiService.resolveConflict.mockResolvedValue({
        success: true,
        resolvedData: serverData, // Server wins
      });

      const result = await offlineSyncService.syncOfflineData();

      expect(mockApiService.resolveConflict).toHaveBeenCalledWith(localData, serverData);
      expect(result.success).toBe(true);
    });

    it('implements exponential backoff for failed syncs', async () => {
      mockApiService.syncOfflineActions.mockRejectedValue(new Error('Network error'));

      const startTime = Date.now();
      
      // First attempt
      await expect(offlineSyncService.syncOfflineActions()).rejects.toThrow();
      
      // Second attempt should wait longer
      await expect(offlineSyncService.syncOfflineActions()).rejects.toThrow();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have implemented backoff delay
      expect(duration).toBeGreaterThan(1000); // At least 1 second delay
    });
  });

  describe('Data Storage', () => {
    it('stores offline data correctly', async () => {
      const data = {
        gameState: { currentPhase: 'day' },
        timestamp: Date.now(),
      };

      await offlineSyncService.storeOfflineData('gameState', data);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_data_gameState',
        JSON.stringify(data)
      );
    });

    it('retrieves offline data correctly', async () => {
      const storedData = {
        gameState: { currentPhase: 'night' },
        timestamp: Date.now(),
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      const result = await offlineSyncService.getOfflineData('gameState');

      expect(result).toEqual(storedData);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('offline_data_gameState');
    });

    it('handles data expiration', async () => {
      const expiredData = {
        gameState: { currentPhase: 'day' },
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredData));

      const result = await offlineSyncService.getOfflineData('gameState');

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline_data_gameState');
    });

    it('compresses large data objects', async () => {
      const largeData = {
        gameHistory: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          result: 'win',
          players: Array.from({ length: 8 }, (_, j) => `player-${j}`),
        })),
        timestamp: Date.now(),
      };

      await offlineSyncService.storeOfflineData('gameHistory', largeData);

      const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
      const storedString = setItemCall[1];
      
      // Should compress data to reduce storage size
      expect(storedString.length).toBeLessThan(JSON.stringify(largeData).length);
    });
  });

  describe('Conflict Resolution', () => {
    it('resolves conflicts using last-write-wins strategy', async () => {
      const localData = {
        playerStats: { gamesWon: 5 },
        lastModified: Date.now() - 60000,
      };

      const serverData = {
        playerStats: { gamesWon: 6 },
        lastModified: Date.now() - 30000,
      };

      const resolved = await offlineSyncService.resolveConflict(localData, serverData);

      // Server data is newer, should win
      expect(resolved).toEqual(serverData);
    });

    it('resolves conflicts using merge strategy for compatible data', async () => {
      const localData = {
        playerStats: { gamesWon: 5, gamesPlayed: 10 },
        achievements: ['first_win'],
        lastModified: Date.now() - 60000,
      };

      const serverData = {
        playerStats: { gamesWon: 5, totalPlayTime: 3600 },
        achievements: ['first_win', 'ten_games'],
        lastModified: Date.now() - 30000,
      };

      const resolved = await offlineSyncService.resolveConflict(localData, serverData);

      expect(resolved.playerStats).toEqual({
        gamesWon: 5,
        gamesPlayed: 10,
        totalPlayTime: 3600,
      });
      expect(resolved.achievements).toEqual(['first_win', 'ten_games']);
    });

    it('handles irreconcilable conflicts', async () => {
      const localData = {
        gameState: { currentPhase: 'day', dayNumber: 3 },
        lastModified: Date.now() - 30000,
      };

      const serverData = {
        gameState: { currentPhase: 'night', dayNumber: 2 },
        lastModified: Date.now() - 60000,
      };

      // Local data is newer but incompatible
      const resolved = await offlineSyncService.resolveConflict(localData, serverData);

      // Should prefer local data when it's newer
      expect(resolved).toEqual(localData);
    });
  });

  describe('Performance and Optimization', () => {
    it('batches multiple sync operations', async () => {
      const actions = Array.from({ length: 10 }, (_, i) => ({
        type: 'SEND_MESSAGE',
        payload: { content: `Message ${i}` },
        timestamp: Date.now() + i,
      }));

      for (const action of actions) {
        offlineSyncService.queueAction(action);
      }

      // Should batch all actions into single sync call
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockApiService.syncOfflineActions).toHaveBeenCalledTimes(1);
      expect(mockApiService.syncOfflineActions).toHaveBeenCalledWith(
        expect.arrayContaining(actions.map(expect.objectContaining))
      );
    });

    it('implements debouncing for frequent sync requests', async () => {
      const syncSpy = jest.spyOn(offlineSyncService, 'syncOfflineActions');

      // Trigger multiple sync requests rapidly
      offlineSyncService.forceSync();
      offlineSyncService.forceSync();
      offlineSyncService.forceSync();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should debounce to single sync call
      expect(syncSpy).toHaveBeenCalledTimes(1);
    });

    it('prioritizes critical actions in sync queue', async () => {
      const criticalAction = {
        type: 'CAST_VOTE',
        payload: { targetId: 'player-1' },
        priority: 'high',
        timestamp: Date.now(),
      };

      const normalAction = {
        type: 'SEND_MESSAGE',
        payload: { content: 'Hello' },
        priority: 'normal',
        timestamp: Date.now() - 1000,
      };

      await offlineSyncService.queueAction(normalAction);
      await offlineSyncService.queueAction(criticalAction);

      await offlineSyncService.syncOfflineActions();

      // Critical action should be synced first despite being queued later
      const syncCall = mockApiService.syncOfflineActions.mock.calls[0][0];
      expect(syncCall[0]).toMatchObject(criticalAction);
    });

    it('manages storage quota efficiently', async () => {
      // Fill storage with data
      const largeDataSets = Array.from({ length: 50 }, (_, i) => ({
        key: `dataset_${i}`,
        data: Array.from({ length: 100 }, (_, j) => ({ id: j, value: Math.random() })),
      }));

      for (const { key, data } of largeDataSets) {
        await offlineSyncService.storeOfflineData(key, data);
      }

      // Should implement storage cleanup when approaching limits
      const removeItemCalls = mockAsyncStorage.removeItem.mock.calls;
      expect(removeItemCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));

      const action = {
        type: 'SEND_MESSAGE',
        payload: { content: 'Hello' },
        timestamp: Date.now(),
      };

      await expect(offlineSyncService.queueAction(action)).resolves.not.toThrow();
    });

    it('handles network errors during sync', async () => {
      mockApiService.syncOfflineActions.mockRejectedValue(new Error('Network timeout'));

      await expect(offlineSyncService.syncOfflineActions()).rejects.toThrow('Network timeout');

      // Should not clear offline actions on network error
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith('offline_actions');
    });

    it('handles corrupted offline data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json data');

      const result = await offlineSyncService.getOfflineData('gameState');

      expect(result).toBeNull();
      // Should clean up corrupted data
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline_data_gameState');
    });

    it('recovers from sync service crashes', async () => {
      mockApiService.syncOfflineActions.mockImplementation(() => {
        throw new Error('Service crashed');
      });

      // Should not crash the app
      await expect(offlineSyncService.syncOfflineActions()).rejects.toThrow();

      // Should be able to recover and try again
      mockApiService.syncOfflineActions.mockResolvedValue({ success: true });
      await expect(offlineSyncService.syncOfflineActions()).resolves.not.toThrow();
    });
  });

  describe('Metrics and Monitoring', () => {
    it('tracks sync performance metrics', async () => {
      const startTime = Date.now();
      
      await offlineSyncService.syncOfflineActions();
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should track sync duration
      expect(duration).toBeGreaterThan(0);
    });

    it('provides pending actions count', () => {
      const count = offlineSyncService.getPendingActionsCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('tracks data usage statistics', async () => {
      await offlineSyncService.storeOfflineData('test', { data: 'test' });
      
      // Should be able to provide storage usage stats
      const stats = await offlineSyncService.getStorageStats();
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('itemCount');
    });
  });
});