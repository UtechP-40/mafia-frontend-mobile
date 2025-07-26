import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { offlineSyncService } from '../offlineSync';
import { apiService } from '../api';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../api');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('OfflineSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock NetInfo
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {},
    } as any);
    
    mockNetInfo.addEventListener.mockImplementation((listener) => {
      // Store listener for manual triggering in tests
      (global as any).netInfoListener = listener;
      return jest.fn(); // unsubscribe function
    });

    // Mock AsyncStorage
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.multiRemove.mockResolvedValue();
  });

  describe('Network Status Monitoring', () => {
    it('should initialize with correct network status', async () => {
      expect(offlineSyncService.getOnlineStatus()).toBe(true);
    });

    it('should handle network status changes', async () => {
      const listener = jest.fn();
      offlineSyncService.addSyncListener(listener);

      // Simulate network change
      const netInfoListener = (global as any).netInfoListener;
      netInfoListener({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: {},
      });

      expect(listener).toHaveBeenCalledWith(false);
      expect(offlineSyncService.getOnlineStatus()).toBe(false);
    });
  });

  describe('Action Queuing', () => {
    it('should queue actions when offline', async () => {
      // Set offline
      const netInfoListener = (global as any).netInfoListener;
      netInfoListener({ isConnected: false });

      await offlineSyncService.queueAction({
        type: 'SEND_CHAT_MESSAGE',
        payload: { message: 'test', roomId: '123' },
        maxRetries: 3,
        priority: 'high',
      });

      expect(offlineSyncService.getPendingActionsCount()).toBe(1);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_actions',
        expect.stringContaining('SEND_CHAT_MESSAGE')
      );
    });

    it('should sync actions when coming back online', async () => {
      // Queue an action while offline
      const netInfoListener = (global as any).netInfoListener;
      netInfoListener({ isConnected: false });

      await offlineSyncService.queueAction({
        type: 'SEND_CHAT_MESSAGE',
        payload: { message: 'test', roomId: '123' },
        maxRetries: 3,
        priority: 'high',
      });

      // Come back online
      netInfoListener({ isConnected: true });

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have attempted to sync
      expect(offlineSyncService.getPendingActionsCount()).toBe(0);
    });
  });

  describe('Data Storage', () => {
    it('should store offline data', async () => {
      await offlineSyncService.storeOfflineData('test_key', { data: 'test' });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_data',
        expect.stringContaining('test_key')
      );
    });

    it('should retrieve offline data', async () => {
      const testData = { test_key: { data: { data: 'test' }, timestamp: Date.now() } };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(testData));

      const data = await offlineSyncService.getOfflineData();
      expect(data).toEqual(testData);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve player profile conflicts correctly', async () => {
      const localData = {
        username: 'local_user',
        avatar: 'local_avatar',
        updatedAt: Date.now(),
        statistics: { gamesPlayed: 10, gamesWon: 5 },
      };

      const remoteData = {
        username: 'remote_user',
        avatar: 'remote_avatar',
        updatedAt: Date.now() - 1000, // Older
        statistics: { gamesPlayed: 8, gamesWon: 6 },
      };

      const resolved = await offlineSyncService.resolveConflict(
        localData,
        remoteData,
        'player_profile'
      );

      expect(resolved.username).toBe('local_user'); // Local is newer
      expect(resolved.statistics.gamesPlayed).toBe(10); // Max value
      expect(resolved.statistics.gamesWon).toBe(6); // Max value
    });

    it('should prefer remote data for game state conflicts', async () => {
      const localData = { phase: 'day', players: [] };
      const remoteData = { phase: 'night', players: [{ id: '1' }] };

      const resolved = await offlineSyncService.resolveConflict(
        localData,
        remoteData,
        'game_state'
      );

      expect(resolved).toEqual(remoteData);
    });
  });

  describe('Sync Operations', () => {
    it('should sync offline actions successfully', async () => {
      // Mock successful API calls
      mockApiService.sendFriendRequest = jest.fn().mockResolvedValue({});
      
      // Queue an action
      await offlineSyncService.queueAction({
        type: 'SEND_FRIEND_REQUEST',
        payload: { friendId: '123' },
        maxRetries: 3,
        priority: 'medium',
      });

      // Sync
      await offlineSyncService.syncOfflineActions();

      expect(mockApiService.sendFriendRequest).toHaveBeenCalledWith('123');
      expect(offlineSyncService.getPendingActionsCount()).toBe(0);
    });

    it('should retry failed actions', async () => {
      // Mock API failure then success
      mockApiService.sendFriendRequest = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({});

      // Queue an action
      await offlineSyncService.queueAction({
        type: 'SEND_FRIEND_REQUEST',
        payload: { friendId: '123' },
        maxRetries: 3,
        priority: 'medium',
      });

      // First sync attempt (should fail and retry)
      await offlineSyncService.syncOfflineActions();
      expect(offlineSyncService.getPendingActionsCount()).toBe(1);

      // Second sync attempt (should succeed)
      await offlineSyncService.syncOfflineActions();
      expect(offlineSyncService.getPendingActionsCount()).toBe(0);
    });

    it('should give up after max retries', async () => {
      // Mock API to always fail
      mockApiService.sendFriendRequest = jest.fn().mockRejectedValue(new Error('Network error'));

      // Queue an action with 2 max retries
      await offlineSyncService.queueAction({
        type: 'SEND_FRIEND_REQUEST',
        payload: { friendId: '123' },
        maxRetries: 2,
        priority: 'medium',
      });

      // Sync multiple times
      await offlineSyncService.syncOfflineActions();
      await offlineSyncService.syncOfflineActions();
      await offlineSyncService.syncOfflineActions();

      // Should have given up
      expect(offlineSyncService.getPendingActionsCount()).toBe(0);
      expect(mockApiService.sendFriendRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Synchronization', () => {
    it('should sync offline data with server', async () => {
      // Mock stored offline data
      const offlineData = {
        player_profile: {
          data: { username: 'test', avatar: 'test.jpg' },
          timestamp: Date.now(),
        },
      };
      
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'offline_data') {
          return Promise.resolve(JSON.stringify(offlineData));
        }
        if (key === 'last_sync_timestamp') {
          return Promise.resolve('0');
        }
        return Promise.resolve(null);
      });

      mockApiService.put = jest.fn().mockResolvedValue({});

      await offlineSyncService.syncOfflineData();

      expect(mockApiService.put).toHaveBeenCalledWith(
        '/players/profile',
        offlineData.player_profile.data
      );
    });
  });

  describe('Cleanup', () => {
    it('should clear all offline data', async () => {
      await offlineSyncService.clearOfflineData();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'offline_actions',
        'last_sync_timestamp',
        'offline_data',
      ]);
    });

    it('should remove sync listeners', () => {
      const listener = jest.fn();
      offlineSyncService.addSyncListener(listener);
      offlineSyncService.removeSyncListener(listener);

      // Trigger network change
      const netInfoListener = (global as any).netInfoListener;
      netInfoListener({ isConnected: false });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Force Sync', () => {
    it('should force sync when online', async () => {
      const syncActionsSpy = jest.spyOn(offlineSyncService, 'syncOfflineActions');
      const syncDataSpy = jest.spyOn(offlineSyncService, 'syncOfflineData');

      await offlineSyncService.forceSync();

      expect(syncActionsSpy).toHaveBeenCalled();
      expect(syncDataSpy).toHaveBeenCalled();
    });

    it('should throw error when forcing sync while offline', async () => {
      // Set offline
      const netInfoListener = (global as any).netInfoListener;
      netInfoListener({ isConnected: false });

      await expect(offlineSyncService.forceSync()).rejects.toThrow(
        'Cannot sync while offline'
      );
    });
  });
});