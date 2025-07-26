import { configureStore } from '@reduxjs/toolkit';
import offlineSlice, {
  setOnlineStatus,
  addPendingAction,
  removePendingAction,
  updatePendingAction,
  setSyncInProgress,
  setLastSyncTime,
  storeOfflineData,
  removeOfflineData,
  addConflictResolution,
  updateConflictResolution,
  removeConflictResolution,
  addSyncError,
  clearSyncErrors,
  removeSyncError,
  setDataLoadingProgress,
  updateDataLoadingProgress,
  resetDataLoadingProgress,
  clearOfflineData,
  queueChatMessage,
  queueVote,
  queueProfileUpdate,
  syncOfflineActions,
  loadProgressiveData,
  resolveDataConflict,
  selectIsOnline,
  selectPendingActions,
  selectSyncInProgress,
  selectPendingActionsCount,
  selectHasPendingConflicts,
  selectSyncStatus,
} from '../offlineSlice';

// Mock services
jest.mock('../../../services/offlineSync');
jest.mock('../../../services/progressiveLoader');

describe('offlineSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        offline: offlineSlice,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().offline;
      
      expect(state.isOnline).toBe(true);
      expect(state.pendingActions).toEqual([]);
      expect(state.syncInProgress).toBe(false);
      expect(state.lastSyncTime).toBe(null);
      expect(state.offlineData).toEqual({});
      expect(state.conflictResolutions).toEqual([]);
      expect(state.syncErrors).toEqual([]);
      expect(state.dataLoadingProgress).toEqual({
        total: 0,
        loaded: 0,
        currentBatch: [],
        failed: [],
      });
    });
  });

  describe('online status', () => {
    it('should set online status', () => {
      store.dispatch(setOnlineStatus(false));
      
      const state = store.getState().offline;
      expect(state.isOnline).toBe(false);
    });

    it('should trigger sync when coming back online with pending actions', () => {
      // Add pending action first
      store.dispatch(addPendingAction({
        type: 'TEST_ACTION',
        payload: { test: true },
        maxRetries: 3,
        priority: 'high',
      }));

      // Set offline then online
      store.dispatch(setOnlineStatus(false));
      store.dispatch(setOnlineStatus(true));
      
      const state = store.getState().offline;
      expect(state.isOnline).toBe(true);
      expect(state.syncInProgress).toBe(true);
    });
  });

  describe('pending actions', () => {
    it('should add pending action', () => {
      const action = {
        type: 'TEST_ACTION',
        payload: { test: true },
        maxRetries: 3,
        priority: 'high' as const,
      };

      store.dispatch(addPendingAction(action));
      
      const state = store.getState().offline;
      expect(state.pendingActions).toHaveLength(1);
      expect(state.pendingActions[0]).toMatchObject({
        type: 'TEST_ACTION',
        payload: { test: true },
        maxRetries: 3,
        priority: 'high',
        retryCount: 0,
      });
      expect(state.pendingActions[0]).toHaveProperty('id');
      expect(state.pendingActions[0]).toHaveProperty('timestamp');
    });

    it('should remove pending action', () => {
      const action = {
        type: 'TEST_ACTION',
        payload: { test: true },
        maxRetries: 3,
        priority: 'high' as const,
      };

      store.dispatch(addPendingAction(action));
      const state1 = store.getState().offline;
      const actionId = state1.pendingActions[0].id;

      store.dispatch(removePendingAction(actionId));
      
      const state2 = store.getState().offline;
      expect(state2.pendingActions).toHaveLength(0);
    });

    it('should update pending action', () => {
      const action = {
        type: 'TEST_ACTION',
        payload: { test: true },
        maxRetries: 3,
        priority: 'high' as const,
      };

      store.dispatch(addPendingAction(action));
      const state1 = store.getState().offline;
      const actionId = state1.pendingActions[0].id;

      store.dispatch(updatePendingAction({
        id: actionId,
        updates: { retryCount: 2 },
      }));
      
      const state2 = store.getState().offline;
      expect(state2.pendingActions[0].retryCount).toBe(2);
    });
  });

  describe('sync state', () => {
    it('should set sync in progress', () => {
      store.dispatch(setSyncInProgress(true));
      
      const state = store.getState().offline;
      expect(state.syncInProgress).toBe(true);
    });

    it('should set last sync time', () => {
      const timestamp = Date.now();
      store.dispatch(setLastSyncTime(timestamp));
      
      const state = store.getState().offline;
      expect(state.lastSyncTime).toBe(timestamp);
    });
  });

  describe('offline data', () => {
    it('should store offline data', () => {
      const data = { user: 'test', id: '123' };
      store.dispatch(storeOfflineData({ key: 'user_profile', data }));
      
      const state = store.getState().offline;
      expect(state.offlineData.user_profile).toMatchObject({
        data,
        timestamp: expect.any(Number),
      });
    });

    it('should remove offline data', () => {
      const data = { user: 'test', id: '123' };
      store.dispatch(storeOfflineData({ key: 'user_profile', data }));
      store.dispatch(removeOfflineData('user_profile'));
      
      const state = store.getState().offline;
      expect(state.offlineData.user_profile).toBeUndefined();
    });
  });

  describe('conflict resolution', () => {
    it('should add conflict resolution', () => {
      const conflict = {
        id: 'conflict_1',
        type: 'player_profile',
        localData: { name: 'local' },
        remoteData: { name: 'remote' },
      };

      store.dispatch(addConflictResolution(conflict));
      
      const state = store.getState().offline;
      expect(state.conflictResolutions).toHaveLength(1);
      expect(state.conflictResolutions[0]).toMatchObject({
        ...conflict,
        resolution: 'pending',
        timestamp: expect.any(Number),
      });
    });

    it('should update conflict resolution', () => {
      const conflict = {
        id: 'conflict_1',
        type: 'player_profile',
        localData: { name: 'local' },
        remoteData: { name: 'remote' },
      };

      store.dispatch(addConflictResolution(conflict));
      store.dispatch(updateConflictResolution({
        id: 'conflict_1',
        resolution: 'local',
      }));
      
      const state = store.getState().offline;
      expect(state.conflictResolutions[0].resolution).toBe('local');
    });

    it('should remove conflict resolution', () => {
      const conflict = {
        id: 'conflict_1',
        type: 'player_profile',
        localData: { name: 'local' },
        remoteData: { name: 'remote' },
      };

      store.dispatch(addConflictResolution(conflict));
      store.dispatch(removeConflictResolution('conflict_1'));
      
      const state = store.getState().offline;
      expect(state.conflictResolutions).toHaveLength(0);
    });
  });

  describe('sync errors', () => {
    it('should add sync error', () => {
      const error = {
        action: {
          id: 'action_1',
          type: 'TEST_ACTION',
          payload: {},
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
          priority: 'high' as const,
        },
        error: 'Network error',
      };

      store.dispatch(addSyncError(error));
      
      const state = store.getState().offline;
      expect(state.syncErrors).toHaveLength(1);
      expect(state.syncErrors[0]).toMatchObject({
        action: error.action,
        error: 'Network error',
        id: expect.any(String),
        timestamp: expect.any(Number),
      });
    });

    it('should clear sync errors', () => {
      const error = {
        action: {
          id: 'action_1',
          type: 'TEST_ACTION',
          payload: {},
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
          priority: 'high' as const,
        },
        error: 'Network error',
      };

      store.dispatch(addSyncError(error));
      store.dispatch(clearSyncErrors());
      
      const state = store.getState().offline;
      expect(state.syncErrors).toHaveLength(0);
    });

    it('should remove specific sync error', () => {
      const error = {
        action: {
          id: 'action_1',
          type: 'TEST_ACTION',
          payload: {},
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
          priority: 'high' as const,
        },
        error: 'Network error',
      };

      store.dispatch(addSyncError(error));
      const state1 = store.getState().offline;
      const errorId = state1.syncErrors[0].id;

      store.dispatch(removeSyncError(errorId));
      
      const state2 = store.getState().offline;
      expect(state2.syncErrors).toHaveLength(0);
    });

    it('should limit sync errors to 50', () => {
      // Add 60 errors
      for (let i = 0; i < 60; i++) {
        store.dispatch(addSyncError({
          action: {
            id: `action_${i}`,
            type: 'TEST_ACTION',
            payload: {},
            timestamp: Date.now(),
            retryCount: 0,
            maxRetries: 3,
            priority: 'high',
          },
          error: `Error ${i}`,
        }));
      }
      
      const state = store.getState().offline;
      expect(state.syncErrors).toHaveLength(50);
    });
  });

  describe('data loading progress', () => {
    it('should set data loading progress', () => {
      const progress = {
        total: 10,
        loaded: 5,
        currentBatch: ['item1', 'item2'],
        failed: ['item3'],
      };

      store.dispatch(setDataLoadingProgress(progress));
      
      const state = store.getState().offline;
      expect(state.dataLoadingProgress).toEqual(progress);
    });

    it('should update data loading progress', () => {
      store.dispatch(setDataLoadingProgress({
        total: 10,
        loaded: 5,
        currentBatch: ['item1'],
        failed: [],
      }));

      store.dispatch(updateDataLoadingProgress({
        loaded: 7,
        failed: ['item2'],
      }));
      
      const state = store.getState().offline;
      expect(state.dataLoadingProgress).toEqual({
        total: 10,
        loaded: 7,
        currentBatch: ['item1'],
        failed: ['item2'],
      });
    });

    it('should reset data loading progress', () => {
      store.dispatch(setDataLoadingProgress({
        total: 10,
        loaded: 5,
        currentBatch: ['item1'],
        failed: ['item2'],
      }));

      store.dispatch(resetDataLoadingProgress());
      
      const state = store.getState().offline;
      expect(state.dataLoadingProgress).toEqual({
        total: 0,
        loaded: 0,
        currentBatch: [],
        failed: [],
      });
    });
  });

  describe('queue actions', () => {
    it('should queue chat message', () => {
      const chatData = {
        roomId: 'room123',
        message: 'Hello world',
        tempId: 'temp123',
      };

      store.dispatch(queueChatMessage(chatData));
      
      const state = store.getState().offline;
      expect(state.pendingActions).toHaveLength(1);
      expect(state.pendingActions[0]).toMatchObject({
        id: 'temp123',
        type: 'SEND_CHAT_MESSAGE',
        payload: chatData,
        priority: 'high',
        maxRetries: 3,
      });
    });

    it('should queue vote', () => {
      const voteData = {
        gameId: 'game123',
        targetId: 'player456',
        playerId: 'player789',
      };

      store.dispatch(queueVote(voteData));
      
      const state = store.getState().offline;
      expect(state.pendingActions).toHaveLength(1);
      expect(state.pendingActions[0]).toMatchObject({
        type: 'CAST_VOTE',
        payload: voteData,
        priority: 'high',
        maxRetries: 5,
      });
    });

    it('should queue profile update', () => {
      const profileData = {
        playerId: 'player123',
        updates: { username: 'newname' },
      };

      store.dispatch(queueProfileUpdate(profileData));
      
      const state = store.getState().offline;
      expect(state.pendingActions).toHaveLength(1);
      expect(state.pendingActions[0]).toMatchObject({
        type: 'UPDATE_PLAYER_PROFILE',
        payload: profileData,
        priority: 'medium',
        maxRetries: 3,
      });
    });
  });

  describe('clear offline data', () => {
    it('should clear all offline data', () => {
      // Add some data first
      store.dispatch(storeOfflineData({ key: 'test', data: { test: true } }));
      store.dispatch(addPendingAction({
        type: 'TEST',
        payload: {},
        maxRetries: 3,
        priority: 'high',
      }));
      store.dispatch(addConflictResolution({
        id: 'conflict1',
        type: 'test',
        localData: {},
        remoteData: {},
      }));
      store.dispatch(setLastSyncTime(Date.now()));

      store.dispatch(clearOfflineData());
      
      const state = store.getState().offline;
      expect(state.offlineData).toEqual({});
      expect(state.pendingActions).toEqual([]);
      expect(state.conflictResolutions).toEqual([]);
      expect(state.syncErrors).toEqual([]);
      expect(state.lastSyncTime).toBe(null);
    });
  });

  describe('selectors', () => {
    it('should select online status', () => {
      store.dispatch(setOnlineStatus(false));
      
      const isOnline = selectIsOnline(store.getState());
      expect(isOnline).toBe(false);
    });

    it('should select pending actions', () => {
      store.dispatch(addPendingAction({
        type: 'TEST',
        payload: {},
        maxRetries: 3,
        priority: 'high',
      }));
      
      const pendingActions = selectPendingActions(store.getState());
      expect(pendingActions).toHaveLength(1);
    });

    it('should select sync in progress', () => {
      store.dispatch(setSyncInProgress(true));
      
      const syncInProgress = selectSyncInProgress(store.getState());
      expect(syncInProgress).toBe(true);
    });

    it('should select pending actions count', () => {
      store.dispatch(addPendingAction({
        type: 'TEST1',
        payload: {},
        maxRetries: 3,
        priority: 'high',
      }));
      store.dispatch(addPendingAction({
        type: 'TEST2',
        payload: {},
        maxRetries: 3,
        priority: 'high',
      }));
      
      const count = selectPendingActionsCount(store.getState());
      expect(count).toBe(2);
    });

    it('should select has pending conflicts', () => {
      store.dispatch(addConflictResolution({
        id: 'conflict1',
        type: 'test',
        localData: {},
        remoteData: {},
      }));
      
      const hasPendingConflicts = selectHasPendingConflicts(store.getState());
      expect(hasPendingConflicts).toBe(true);
    });

    it('should select sync status', () => {
      // Test offline status
      store.dispatch(setOnlineStatus(false));
      expect(selectSyncStatus(store.getState())).toBe('offline');

      // Test syncing status
      store.dispatch(setOnlineStatus(true));
      store.dispatch(setSyncInProgress(true));
      expect(selectSyncStatus(store.getState())).toBe('syncing');

      // Test pending status
      store.dispatch(setSyncInProgress(false));
      store.dispatch(addPendingAction({
        type: 'TEST',
        payload: {},
        maxRetries: 3,
        priority: 'high',
      }));
      expect(selectSyncStatus(store.getState())).toBe('pending');

      // Test synced status
      store.dispatch(removePendingAction(store.getState().offline.pendingActions[0].id));
      store.dispatch(setLastSyncTime(Date.now()));
      expect(selectSyncStatus(store.getState())).toBe('synced');
    });
  });
});