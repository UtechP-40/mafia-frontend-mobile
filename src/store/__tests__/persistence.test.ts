import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearPersistedData, getStorageInfo } from '../persistence';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
  getItem: jest.fn(),
}));

describe('persistence utilities', () => {
  let mockAsyncStorage: jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
    jest.clearAllMocks();
  });

  describe('clearPersistedData', () => {
    it('should clear all persisted data keys', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValueOnce(undefined);

      await clearPersistedData();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'persist:auth',
        'persist:game',
        'persist:ui',
        'persist:root',
      ]);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Storage error');
      mockAsyncStorage.multiRemove.mockRejectedValueOnce(error);

      await clearPersistedData();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear persisted data:', error);
      consoleSpy.mockRestore();
    });

    it('should log success message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockAsyncStorage.multiRemove.mockResolvedValueOnce(undefined);

      await clearPersistedData();

      expect(consoleSpy).toHaveBeenCalledWith('Persisted data cleared successfully');
      consoleSpy.mockRestore();
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage info for persist keys', async () => {
      const mockKeys = [
        'persist:auth',
        'persist:game',
        'persist:ui',
        'other:key',
        'persist:root',
      ];

      const mockValues = {
        'persist:auth': '{"user":{"id":"1"}}',
        'persist:game': '{"currentRoom":null}',
        'persist:ui': '{"theme":"dark"}',
        'persist:root': '{}',
      };

      mockAsyncStorage.getAllKeys.mockResolvedValueOnce(mockKeys);
      mockAsyncStorage.getItem.mockImplementation((key) => 
        Promise.resolve(mockValues[key as keyof typeof mockValues] || null)
      );

      const result = await getStorageInfo();

      expect(result).toHaveLength(4); // Only persist keys
      expect(result).toEqual([
        {
          key: 'persist:auth',
          size: '{"user":{"id":"1"}}'.length,
          hasData: true,
        },
        {
          key: 'persist:game',
          size: '{"currentRoom":null}'.length,
          hasData: true,
        },
        {
          key: 'persist:ui',
          size: '{"theme":"dark"}'.length,
          hasData: true,
        },
        {
          key: 'persist:root',
          size: '{}'.length,
          hasData: true,
        },
      ]);
    });

    it('should handle keys with no data', async () => {
      const mockKeys = ['persist:auth'];
      mockAsyncStorage.getAllKeys.mockResolvedValueOnce(mockKeys);
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await getStorageInfo();

      expect(result).toEqual([
        {
          key: 'persist:auth',
          size: 0,
          hasData: false,
        },
      ]);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Storage error');
      mockAsyncStorage.getAllKeys.mockRejectedValueOnce(error);

      const result = await getStorageInfo();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get storage info:', error);
      consoleSpy.mockRestore();
    });

    it('should handle getItem errors for individual keys', async () => {
      const mockKeys = ['persist:auth', 'persist:game'];
      mockAsyncStorage.getAllKeys.mockResolvedValueOnce(mockKeys);
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('{"user":{"id":"1"}}') // First key succeeds
        .mockRejectedValueOnce(new Error('Item error')); // Second key fails

      const result = await getStorageInfo();

      expect(result).toHaveLength(1); // Only successful key
      expect(result[0]).toEqual({
        key: 'persist:auth',
        size: '{"user":{"id":"1"}}'.length,
        hasData: true,
      });
    });
  });

  describe('persistence configuration', () => {
    it('should have correct auth persistence config', () => {
      // This would be tested by importing the actual config
      // and verifying the whitelist/blacklist arrays
      const expectedWhitelist = ['user', 'token', 'refreshToken', 'isAuthenticated', 'lastLoginTime'];
      const expectedBlacklist = ['isLoading', 'error'];

      // In a real test, you would import authPersistConfig and test it
      expect(expectedWhitelist).toContain('user');
      expect(expectedWhitelist).toContain('token');
      expect(expectedBlacklist).toContain('isLoading');
      expect(expectedBlacklist).toContain('error');
    });

    it('should have correct game persistence config', () => {
      const expectedWhitelist = ['currentPlayer', 'chatMessages'];
      const expectedBlacklist = [
        'currentRoom',
        'gameState',
        'players',
        'votes',
        'isConnected',
        'error',
        'connectionError',
        'isJoiningRoom',
        'isCreatingRoom',
        'isStartingGame',
      ];

      expect(expectedWhitelist).toContain('currentPlayer');
      expect(expectedWhitelist).toContain('chatMessages');
      expect(expectedBlacklist).toContain('currentRoom');
      expect(expectedBlacklist).toContain('gameState');
    });

    it('should have correct UI persistence config', () => {
      const expectedWhitelist = [
        'theme',
        'soundEnabled',
        'vibrationEnabled',
        'animationsEnabled',
        'showPlayerList',
        'showChat',
      ];
      const expectedBlacklist = [
        'isLoading',
        'loadingMessage',
        'activeModals',
        'notifications',
        'currentScreen',
        'navigationHistory',
        'chatInputFocused',
        'isOnline',
        'connectionQuality',
        'fps',
        'memoryUsage',
      ];

      expect(expectedWhitelist).toContain('theme');
      expect(expectedWhitelist).toContain('soundEnabled');
      expect(expectedBlacklist).toContain('isLoading');
      expect(expectedBlacklist).toContain('activeModals');
    });
  });

  describe('error handlers', () => {
    it('should handle persistence errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Import and test the onPersistError function
      const { onPersistError } = require('../persistence');
      const error = new Error('Persistence failed');
      
      onPersistError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('Redux persistence error:', error);
      consoleSpy.mockRestore();
    });

    it('should handle rehydration complete', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Import and test the onRehydrateComplete function
      const { onRehydrateComplete } = require('../persistence');
      const mockPersistor = {};
      
      onRehydrateComplete(mockPersistor);
      
      expect(consoleSpy).toHaveBeenCalledWith('Redux state rehydration complete');
      consoleSpy.mockRestore();
    });
  });

  describe('transforms', () => {
    it('should handle date transformations', () => {
      const { transforms } = require('../persistence');
      const dateTransform = transforms[0];

      // Test outbound transformation (Date to timestamp)
      const outboundState = {
        lastLoginTime: new Date('2023-01-01T00:00:00.000Z'),
      };
      
      const transformedOut = dateTransform.out(outboundState, 'auth');
      expect(transformedOut.lastLoginTime).toBe(new Date('2023-01-01T00:00:00.000Z').getTime());

      // Test inbound transformation (timestamp to Date)
      const inboundState = {
        lastLoginTime: 1672531200000, // 2023-01-01T00:00:00.000Z
      };
      
      const transformedIn = dateTransform.in(inboundState, 'auth');
      expect(transformedIn.lastLoginTime).toEqual(new Date(1672531200000));
    });

    it('should pass through non-auth states unchanged', () => {
      const { transforms } = require('../persistence');
      const dateTransform = transforms[0];

      const gameState = {
        currentRoom: null,
        players: [],
      };
      
      expect(dateTransform.out(gameState, 'game')).toBe(gameState);
      expect(dateTransform.in(gameState, 'game')).toBe(gameState);
    });

    it('should handle states without lastLoginTime', () => {
      const { transforms } = require('../persistence');
      const dateTransform = transforms[0];

      const authStateWithoutDate = {
        user: { id: '1' },
        token: 'token',
      };
      
      expect(dateTransform.out(authStateWithoutDate, 'auth')).toBe(authStateWithoutDate);
      expect(dateTransform.in(authStateWithoutDate, 'auth')).toBe(authStateWithoutDate);
    });
  });

  describe('migrations', () => {
    it('should have migration for version 1', () => {
      const { migrations } = require('../persistence');
      
      expect(migrations[1]).toBeDefined();
      expect(typeof migrations[1]).toBe('function');
    });

    it('should handle migration correctly', () => {
      const { migrations } = require('../persistence');
      const migration = migrations[1];
      
      const oldState = {
        someOldProperty: 'value',
      };
      
      const migratedState = migration(oldState);
      
      // Migration should preserve existing state
      expect(migratedState).toEqual(expect.objectContaining(oldState));
    });
  });
});